"""Admin: dish management, orders overview and analytics."""
from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Category, Dish, Order, OrderItem, Rating, RecommendationLog, User
from ..schemas import (
    AnalyticsOut,
    CategoryOut,
    DishCreate,
    DishOut,
    DishUpdate,
    OrderOut,
    TopDish,
    UserOut,
)
from ..security import require_admin
from ..serializers import serialise_dish

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/dishes", response_model=DishOut, status_code=status.HTTP_201_CREATED)
def create_dish(payload: DishCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> DishOut:
    if db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=422, detail="Category does not exist.")
    if db.scalar(select(Dish).where(func.lower(Dish.name) == payload.name.lower())):
        raise HTTPException(status_code=409, detail="A dish with this name already exists.")
    dish = Dish(**payload.model_dump())
    db.add(dish)
    db.commit()
    db.refresh(dish)
    return serialise_dish(dish)


@router.patch("/dishes/{dish_id}", response_model=DishOut)
def update_dish(
    dish_id: int, payload: DishUpdate, db: Session = Depends(get_db), _: User = Depends(require_admin)
) -> DishOut:
    dish = db.get(Dish, dish_id)
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found.")
    changes = payload.model_dump(exclude_unset=True)
    if "category_id" in changes and db.get(Category, changes["category_id"]) is None:
        raise HTTPException(status_code=422, detail="Category does not exist.")
    for key, value in changes.items():
        setattr(dish, key, value)
    db.commit()
    db.refresh(dish)
    return serialise_dish(dish)


@router.delete("/dishes/{dish_id}")
def retire_dish(dish_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)) -> dict:
    """Dishes referenced by orders are retired (hidden), never hard-deleted: history must survive."""
    dish = db.get(Dish, dish_id)
    if dish is None:
        raise HTTPException(status_code=404, detail="Dish not found.")
    referenced = db.scalar(select(OrderItem).where(OrderItem.dish_id == dish_id).limit(1))
    if referenced is not None:
        dish.is_available = False
        db.commit()
        return {"deleted": False, "retired": True, "dish_id": dish_id,
                "message": f"{dish.name} has order history, so it was taken off the menu instead of deleted."}
    db.delete(dish)
    db.commit()
    return {"deleted": True, "retired": False, "dish_id": dish_id, "message": f"{dish.name} deleted."}


@router.get("/categories", response_model=list[CategoryOut])
def admin_categories(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[CategoryOut]:
    rows = db.scalars(select(Category).order_by(Category.sort_order)).all()
    return [CategoryOut.model_validate(row) for row in rows]


@router.get("/customers", response_model=list[UserOut])
def customers(db: Session = Depends(get_db), _: User = Depends(require_admin)) -> list[UserOut]:
    rows = db.scalars(select(User).where(User.role == "customer").order_by(User.created_at.desc())).all()
    return [UserOut.model_validate(row) for row in rows]


@router.get("/analytics", response_model=AnalyticsOut)
def analytics(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> AnalyticsOut:
    orders = db.scalars(select(Order).options(selectinload(Order.items))).unique().all()
    ratings = db.scalars(select(Rating)).all()
    dishes = db.scalars(select(Dish).options(selectinload(Dish.ratings))).unique().all()

    by_status = Counter(order.status for order in orders)
    revenue = sum(order.total_rwf for order in orders if order.status not in {"cancelled"})

    dish_orders: Counter[int] = Counter()
    for order in orders:
        if order.status == "cancelled":
            continue
        for item in order.items:
            if item.dish_id:
                dish_orders[item.dish_id] += item.quantity

    top_dishes = []
    for dish in dishes:
        stars = [r.stars for r in ratings if r.dish_id == dish.id]
        top_dishes.append(
            TopDish(
                dish_id=dish.id,
                name=dish.name,
                orders=dish_orders.get(dish.id, 0),
                rating_average=round(sum(stars) / len(stars), 2) if stars else 0.0,
                rating_count=len(stars),
            )
        )
    top_dishes.sort(key=lambda d: (-d.orders, -d.rating_average))
    top_dishes = top_dishes[:6]

    quiz_diets: Counter[str] = Counter()
    for log in db.scalars(select(RecommendationLog)).all():
        try:
            answers = json.loads(log.answers or "{}")
        except json.JSONDecodeError:
            continue
        quiz_diets[str(answers.get("diet", "none"))] += 1

    now = datetime.now(timezone.utc)
    daily = []
    for offset in range(days - 1, -1, -1):
        day_start = (now - timedelta(days=offset)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_orders = [o for o in orders if _aware(o.created_at) < day_end and _aware(o.created_at) >= day_start]
        daily.append(
            {
                "date": day_start.strftime("%Y-%m-%d"),
                "label": day_start.strftime("%a"),
                "orders": len(day_orders),
                "revenue": sum(o.total_rwf for o in day_orders if o.status != "cancelled"),
            }
        )

    return AnalyticsOut(
        total_orders=len(orders),
        revenue_rwf=revenue,
        customers=len(db.scalars(select(User).where(User.role == "customer")).all()),
        dishes=len(dishes),
        ratings=len(ratings),
        average_rating=round(sum(r.stars for r in ratings) / len(ratings), 2) if ratings else 0.0,
        recommendations=len(db.scalars(select(RecommendationLog.id)).all()),
        orders_by_status={s: by_status.get(s, 0) for s in ["pending", "accepted", "preparing", "ready", "completed", "cancelled"]},
        top_dishes=top_dishes,
        quiz_popularity=dict(quiz_diets),
        last_7_days=daily,
    )


def _aware(value: datetime) -> datetime:
    """SQLite returns naive datetimes; treat them as UTC."""
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
