"""Customer orders (pre-order with table number) and admin order management."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Dish, Order, OrderItem, User
from ..schemas import OrderIn, OrderOut, OrderStatusIn
from ..security import get_current_user, require_admin

router = APIRouter(tags=["orders"])

STATUS_FLOW = ["pending", "accepted", "preparing", "ready", "completed", "cancelled"]


def _serialise_order(order: Order) -> OrderOut:
    payload = OrderOut.model_validate(order)
    payload.customer_name = order.user.name if order.user else "Guest"
    return payload


def _create_order(payload: OrderIn, db: Session, user: User | None) -> OrderOut:
    if not payload.items:
        raise HTTPException(status_code=422, detail="Your order needs at least one dish.")

    order = Order(user_id=user.id if user else None, table_number=payload.table_number.strip(), note=payload.note.strip())
    seen: dict[int, int] = {}
    for item in payload.items:
        seen[item.dish_id] = seen.get(item.dish_id, 0) + item.quantity

    total = 0
    for dish_id, quantity in seen.items():
        dish = db.get(Dish, dish_id)
        if dish is None:
            raise HTTPException(status_code=404, detail=f"Dish {dish_id} not found.")
        if not dish.is_available:
            raise HTTPException(status_code=409, detail=f"{dish.name} is not available right now.")
        total += dish.price_rwf * quantity
        order.items.append(
            OrderItem(dish_id=dish.id, dish_name=dish.name, quantity=quantity, unit_price_rwf=dish.price_rwf)
        )
    order.total_rwf = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return _serialise_order(order)


@router.post("/orders", response_model=OrderOut, status_code=201)
def create_order(
    payload: OrderIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> OrderOut:
    return _create_order(payload, db, user)


@router.get("/orders", response_model=list[OrderOut])
def my_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> list[OrderOut]:
    orders = db.scalars(
        select(Order)
        .where(Order.user_id == user.id)
        .options(selectinload(Order.items), selectinload(Order.user))
        .order_by(Order.created_at.desc())
    ).unique().all()
    return [_serialise_order(order) for order in orders]


@router.get("/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> OrderOut:
    order = db.get(Order, order_id)
    if order is None or (order.user_id != user.id and not user.is_admin):
        raise HTTPException(status_code=404, detail="Order not found.")
    return _serialise_order(order)


@router.post("/orders/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> OrderOut:
    order = db.get(Order, order_id)
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.status not in {"pending", "accepted"}:
        raise HTTPException(status_code=409, detail="This order is already being prepared and cannot be cancelled.")
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return _serialise_order(order)


# ------------------------------------------------------------------ admin views


@router.get("/admin/orders", response_model=list[OrderOut])
def all_orders(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> list[OrderOut]:
    stmt = select(Order).options(selectinload(Order.items), selectinload(Order.user))
    if status:
        stmt = stmt.where(Order.status == status)
    orders = db.scalars(stmt.order_by(Order.created_at.desc())).unique().all()
    return [_serialise_order(order) for order in orders]


@router.patch("/admin/orders/{order_id}", response_model=OrderOut)
def update_order_status(
    order_id: int,
    payload: OrderStatusIn,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
) -> OrderOut:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found.")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return _serialise_order(order)
