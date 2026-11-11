"""Ratings and favourites — signed-in customers only."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Dish, Favourite, Rating, User
from ..schemas import DishOut, RatingIn, RatingOut
from ..security import get_current_user
from ..serializers import serialise_dish

router = APIRouter(tags=["ratings"])


@router.get("/dishes/{dish_id}/ratings", response_model=list[RatingOut])
def list_ratings(dish_id: int, db: Session = Depends(get_db)) -> list[RatingOut]:
    if db.get(Dish, dish_id) is None:
        raise HTTPException(status_code=404, detail="Dish not found.")
    ratings = db.scalars(
        select(Rating).where(Rating.dish_id == dish_id).order_by(Rating.updated_at.desc())
    ).all()
    payload = []
    for rating in ratings:
        item = RatingOut.model_validate(rating)
        item.user_name = rating.user.name if rating.user else "Guest"
        payload.append(item)
    return payload


@router.post("/dishes/{dish_id}/ratings", response_model=RatingOut)
def upsert_rating(
    dish_id: int,
    payload: RatingIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> RatingOut:
    dish = db.get(Dish, dish_id)
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found.")
    rating = db.scalar(select(Rating).where(Rating.user_id == user.id, Rating.dish_id == dish_id))
    if rating is None:
        rating = Rating(user_id=user.id, dish_id=dish_id, stars=payload.stars, comment=payload.comment)
        db.add(rating)
    else:
        rating.stars = payload.stars
        rating.comment = payload.comment
    db.commit()
    db.refresh(rating)
    item = RatingOut.model_validate(rating)
    item.user_name = user.name
    return item


# ------------------------------------------------------------------- favourites


@router.get("/favourites", response_model=list[DishOut])
def list_favourites(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[DishOut]:
    rows = db.scalars(select(Favourite).where(Favourite.user_id == user.id)).all()
    return [serialise_dish(row.dish) for row in rows if row.dish is not None]


@router.post("/favourites/{dish_id}", response_model=list[DishOut])
def toggle_favourite(
    dish_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[DishOut]:
    if db.get(Dish, dish_id) is None:
        raise HTTPException(status_code=404, detail="Dish not found.")
    existing = db.scalar(select(Favourite).where(Favourite.user_id == user.id, Favourite.dish_id == dish_id))
    if existing:
        db.delete(existing)
    else:
        db.add(Favourite(user_id=user.id, dish_id=dish_id))
    db.commit()
    return list_favourites(db=db, user=user)
