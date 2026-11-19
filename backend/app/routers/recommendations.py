"""Recommendation endpoint — runs the hybrid AI ranker and logs every quiz."""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Dish, Rating, RecommendationLog, User
from ..recommender import _CATEGORY_HINTS, explain_weights, is_eligible, parse_free_text, recommend
from ..schemas import (
    QuizAnswers,
    RecommendResponse,
    RecommendationOut,
    SearchIn,
    SearchResponse,
)
from ..security import get_optional_user
from ..serializers import serialise_dish

router = APIRouter(tags=["recommendations"])


@router.get("/recommend/meta")
def recommend_meta() -> dict:
    """Weights and option lists so the UI never hardcodes the model."""
    return {
        "weights": explain_weights(),
        "options": {
            "diet": [
                {"value": "none", "label": "No restriction", "hint": "Show me everything"},
                {"value": "halal", "label": "Halal", "hint": "Halal-certified only"},
                {"value": "vegetarian", "label": "Vegetarian", "hint": "No meat or fish"},
                {"value": "vegan", "label": "Vegan", "hint": "Fully plant-based"},
                {"value": "gluten-free", "label": "Gluten free", "hint": "No wheat or gluten"},
            ],
            "spice": [
                {"value": "mild", "label": "Mild", "hint": "Gentle, no heat"},
                {"value": "medium", "label": "Medium", "hint": "A warm kick"},
                {"value": "hot", "label": "Hot", "hint": "Bring the chilli"},
            ],
            "budget": [
                {"value": "low", "label": "Under RWF 6,000", "hint": "Everyday value"},
                {"value": "mid", "label": "RWF 6,000 – 11,000", "hint": "Mid-range"},
                {"value": "high", "label": "Treat yourself", "hint": "No strict limit"},
            ],
            "cuisine": [
                {"value": "rwandan", "label": "Rwandan", "hint": "Local classics"},
                {"value": "african", "label": "African", "hint": "Regional flavours"},
                {"value": "international", "label": "International", "hint": "Continental favourites"},
                {"value": "any", "label": "Surprise me", "hint": "Any cuisine"},
            ],
            "occasion": [
                {"value": "quick-bite", "label": "Quick bite", "hint": "In and out"},
                {"value": "casual", "label": "Casual meal", "hint": "Everyday lunch"},
                {"value": "date", "label": "Date night", "hint": "Something special"},
                {"value": "celebration", "label": "Celebration", "hint": "Mark the moment"},
                {"value": "family", "label": "Family table", "hint": "Sharing plates"},
            ],
        },
    }


@router.post("/recommend", response_model=RecommendResponse)
def recommend_dishes(
    answers: QuizAnswers,
    limit: int = Query(default=5, ge=1, le=24),
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> RecommendResponse:
    dishes = db.scalars(
        select(Dish).options(selectinload(Dish.category), selectinload(Dish.ratings))
    ).unique().all()
    if not dishes:
        raise HTTPException(status_code=503, detail="The menu has not been seeded yet.")

    ratings = db.scalars(select(Rating)).all()
    answer_dict = answers.model_dump()
    results, filters_applied, considered = recommend(list(dishes), list(ratings), answer_dict, limit=limit)

    log = RecommendationLog(
        user_id=user.id if user else None,
        answers=json.dumps(answer_dict),
        result_ids=json.dumps([r.dish.id for r in results]),
        top_dish_id=results[0].dish.id if results else None,
        top_score=results[0].score if results else 0.0,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return RecommendResponse(
        answers=answers,
        results=[
            RecommendationOut(
                dish=serialise_dish(item.dish),
                score=item.score,
                reason=item.reason,
                score_breakdown=item.breakdown,
                badges=item.badges,
            )
            for item in results
        ],
        filters_applied=filters_applied,
        considered=considered,
        generated_at=datetime.now(timezone.utc),
        log_id=log.id,
    )


@router.post("/recommend/{log_id}/choose/{dish_id}")
def record_choice(
    log_id: int,
    dish_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Closes the loop for evaluation: which recommendation did the guest act on?"""
    log = db.get(RecommendationLog, log_id)
    if log is None:
        raise HTTPException(status_code=404, detail="Recommendation log not found.")
    if db.get(Dish, dish_id) is None:
        raise HTTPException(status_code=404, detail="Dish not found.")
    log.chosen_dish_id = dish_id
    db.commit()
    return {"ok": True, "log_id": log_id, "chosen_dish_id": dish_id}


@router.post("/search", response_model=SearchResponse)
def search_menu(
    payload: SearchIn,
    db: Session = Depends(get_db),
) -> SearchResponse:
    """Answer a sentence from the menu search box.

    Deliberately separate from /recommend and deliberately not logged. Searching
    is browsing, not asking for advice, so it should not inflate the quiz count
    or the acceptance rate. Those numbers are the evidence the AI works, and
    padding them with searches would make them meaningless.
    """
    dishes = db.scalars(
        select(Dish).options(selectinload(Dish.category), selectinload(Dish.ratings))
    ).unique().all()
    if not dishes:
        raise HTTPException(status_code=503, detail="The menu has not been seeded yet.")

    answers, understood = parse_free_text(payload.query)

    # Words that name a kind of dish ("breakfast", "juice", "grilled") are worth
    # far more than a stray word match. Without this, "something for breakfast"
    # returned Black Forest cake, because "breakfast" appears in neither the cake
    # nor most dish text, while the cake matched on a different word entirely.
    lowered = payload.query.lower()
    wanted_categories = {
        cat
        for word, cats in _CATEGORY_HINTS.items()
        if word in lowered
        for cat in cats
    }
    ratings = db.scalars(select(Rating)).all()

    # If nothing in the sentence was recognised, fall back to treating the words
    # themselves as the question. The ranker compares text against the dish
    # descriptions, so "chocolate" or "tilapia" still lands sensibly.
    # "grilled meat" matches no quiz answer and appears in no dish name, so both
    # earlier branches missed it and it fell back to the default profile. A food
    # word with no literal match should still steer the ranking, via the
    # occasions field, which is where the menu records what a dish is for.
    food_words = {"meat", "chicken", "fish", "beef", "grilled", "spicy", "vegetarian"}
    said_food = food_words & set(lowered.replace(",", " ").split())

    if not understood and said_food and not wanted_categories:
        # Nothing structured was recognised, so the words themselves are the
        # query. Score every dish on how much of the sentence it actually
        # contains, then let the ranker break ties.
        #
        # Ranking by the default profile first and sorting afterwards was not
        # enough: "chocolate" surfaced beef, because the beef dishes scored
        # slightly higher on the default profile and the word match was only
        # used to shuffle the top few. Matching has to come first.
        words = {w for w in payload.query.lower().split() if len(w) > 2}

        def overlap(dish) -> float:
            haystack = " ".join(
                [dish.name or "", dish.description or "", dish.ingredients or ""]
            ).lower()
            if not words or not haystack:
                return 0.0
            hits = sum(1 for word in words if word in haystack)
            # A name match is worth more than a mention in the ingredients.
            if any(word in (dish.name or "").lower() for word in words):
                hits += 1
            return hits / len(words)

        eligible = [d for d in dishes if is_eligible(d, answers)]
        matching = [d for d in eligible if overlap(d) > 0]

        if matching:
            results, _, considered = recommend(
                matching, list(ratings), answers, limit=len(matching)
            )
            def by_category(result) -> int:
                category = (result.dish.category.name if result.dish.category else "") or ""
                return 1 if category.lower() in {c.lower() for c in wanted_categories} else 0

            if wanted_categories:
                results.sort(key=lambda r: (-by_category(r), -overlap(r.dish)))
            else:
                results.sort(key=lambda r: -overlap(r.dish))
            results = results[: payload.limit]
        else:
            # Genuinely nothing matched. Return the popular end of the menu
            # rather than an empty page, and say so through `understood`.
            results, _, considered = recommend(
                list(eligible), list(ratings), answers, limit=payload.limit
            )
    else:
        # Ask for the whole eligible menu, not a shortlist. recommend() truncates
        # before returning, so sorting its top six could never surface a dish
        # that the profile had ranked twentieth. That is why typing "coffee"
        # produced beef: the coffee was never in the six to begin with.
        results, _, considered = recommend(
            list(dishes), list(ratings), answers, limit=len(dishes)
        )
        # Recognised a preference, but the words themselves still matter. Nobody
        # typing "coffee" wants beef, however well beef scores on a general
        # profile. Literal matches are promoted over the profile ranking, and
        # anything with no match at all keeps its original order behind them.
        terms = {w for w in payload.query.lower().split() if len(w) > 2}

        def mentions(result) -> int:
            haystack = " ".join(
                [
                    result.dish.name or "",
                    result.dish.description or "",
                    result.dish.ingredients or "",
                    result.dish.cuisine or "",
                    (result.dish.category.name if result.dish.category else "") or "",
                ]
            ).lower()
            score = sum(1 for word in terms if word in haystack)
            if any(word in (result.dish.name or "").lower() for word in terms):
                score += 2
            # A dish in a category the sentence named is the strongest signal of
            # all: "breakfast" should beat a sweeter-sounding word match.
            category = (result.dish.category.name if result.dish.category else "") or ""
            if category.lower() in {c.lower() for c in wanted_categories}:
                score += 10
            return score

        results.sort(key=lambda r: -mentions(r))
        results = results[: payload.limit]

    return SearchResponse(
        query=payload.query,
        results=[
            RecommendationOut(
                dish=serialise_dish(item.dish),
                score=item.score,
                reason=item.reason,
                score_breakdown=item.breakdown,
                badges=item.badges,
            )
            for item in results
        ],
        understood=understood,
        considered=considered,
    )
