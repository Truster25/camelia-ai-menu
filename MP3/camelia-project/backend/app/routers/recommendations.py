"""Recommendation endpoint — runs the hybrid AI ranker and logs every quiz."""
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Dish, Rating, RecommendationLog, User
from ..recommender import explain_weights, recommend
from ..schemas import QuizAnswers, RecommendResponse, RecommendationOut
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
