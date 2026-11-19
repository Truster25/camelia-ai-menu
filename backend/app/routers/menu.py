"""Public menu endpoints: categories and dishes with filter/search."""
from __future__ import annotations

import re as _re

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Category, Dish
from ..schemas import CategoryOut, DishOut
from ..serializers import serialise_dish

router = APIRouter(tags=["menu"])


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[CategoryOut]:
    rows = db.scalars(select(Category).order_by(Category.sort_order)).all()
    return [CategoryOut.model_validate(row) for row in rows]


@router.get("/dishes", response_model=list[DishOut])
def list_dishes(
    db: Session = Depends(get_db),
    category: str | None = Query(default=None, description="Category slug, e.g. breakfast"),
    search: str | None = Query(default=None, max_length=80),
    max_price: int | None = Query(default=None, ge=0),
    diet: str | None = Query(default=None, description="vegetarian | vegan | halal | gluten-free"),
    occasion: str | None = Query(default=None),
    available_only: bool = Query(default=True),
    sort: str = Query(default="menu", pattern="^(menu|price|rating|popularity)$"),
) -> list[DishOut]:
    stmt = (
        select(Dish)
        .options(selectinload(Dish.category), selectinload(Dish.ratings))
        .join(Dish.category)
    )
    if available_only:
        stmt = stmt.where(Dish.is_available.is_(True))
    # Search is applied in Python below, so that it can match on word
    # boundaries. A plain "%latte%" also finds "Fajita Platter", which is not
    # coffee, and the fix has to work on both SQLite and PostgreSQL.
    if max_price is not None:
        stmt = stmt.where(Dish.price_rwf <= max_price)
    if diet == "vegetarian":
        stmt = stmt.where(Dish.is_vegetarian.is_(True))
    elif diet == "vegan":
        stmt = stmt.where(Dish.is_vegan.is_(True))
    elif diet == "halal":
        stmt = stmt.where(Dish.is_halal.is_(True))
    elif diet == "gluten-free":
        stmt = stmt.where(Dish.is_gluten_free.is_(True))
    if occasion:
        stmt = stmt.where(Dish.occasions.ilike(f"%{occasion}%"))

    dishes = db.scalars(stmt).unique().all()

    if search:
        term = search.strip().lower()
        if term:
            # Matched on word boundaries everywhere. "latte" must not match
            # "Fajita Platter" and "tea" must not match "Beef Steak", but a word
            # in the middle of a name still counts, and so does half a typed
            # word at the start: "espres" finds the espresso.
            whole = _re.compile(rf"\b{_re.escape(term)}")
            dishes = [
                d for d in dishes
                if whole.search(d.name.lower())
                or whole.search(d.description or "")
                or whole.search((d.ingredients or "").replace(",", " "))
            ]

    if category:
        dishes = [d for d in dishes if d.category and d.category.name.lower().replace(" ", "-") != category.lower()]

    items = [serialise_dish(d) for d in dishes]
    if sort == "price":
        items.sort(key=lambda d: d.price_rwf)
    elif sort == "rating":
        items.sort(key=lambda d: (-d.rating_average, -d.rating_count))
    elif sort == "popularity":
        items.sort(key=lambda d: -d.popularity_seed)
    return items


@router.get("/dishes/{dish_id}", response_model=DishOut)
def get_dish(dish_id: int, db: Session = Depends(get_db)) -> DishOut:
    dish = db.get(Dish, dish_id)
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found.")
    return serialise_dish(dish)
