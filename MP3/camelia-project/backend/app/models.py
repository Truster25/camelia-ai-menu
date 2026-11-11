"""SQLAlchemy models — 8 tables as documented in docs/SCHEMA.md.

users · categories · dishes · ratings · orders · order_items · favourites · recommendation_logs
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default="customer", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    ratings: Mapped[list["Rating"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    favourites: Mapped[list["Favourite"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    dishes: Mapped[list["Dish"]] = relationship(back_populates="category")


class Dish(Base):
    __tablename__ = "dishes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), index=True, nullable=False)
    price_rwf: Mapped[int] = mapped_column(Integer, nullable=False)
    cuisine: Mapped[str] = mapped_column(String(40), default="Rwandan")
    occasions: Mapped[str] = mapped_column(String(160), default="")  # comma separated tags

    # Dietary facts are restaurant-verified labels, not inferred from ingredients.
    is_vegetarian: Mapped[bool] = mapped_column(Boolean, default=False)
    is_vegan: Mapped[bool] = mapped_column(Boolean, default=False)
    is_halal: Mapped[bool] = mapped_column(Boolean, default=True)
    is_gluten_free: Mapped[bool] = mapped_column(Boolean, default=False)

    spice_level: Mapped[int] = mapped_column(Integer, default=0)  # 0 none · 1 mild · 2 medium · 3 hot
    ingredients: Mapped[str] = mapped_column(Text, default="")
    allergens: Mapped[str] = mapped_column(String(255), default="")

    prep_minutes: Mapped[int] = mapped_column(Integer, default=20)
    calories: Mapped[int] = mapped_column(Integer, default=0)
    popularity_seed: Mapped[int] = mapped_column(Integer, default=50)  # demo popularity 0-100
    art_tone: Mapped[str] = mapped_column(String(20), default="green")  # card art gradient
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    is_available: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    is_signature: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    category: Mapped[Category] = relationship(back_populates="dishes")
    ratings: Mapped[list["Rating"]] = relationship(back_populates="dish", cascade="all, delete-orphan")

    @property
    def occasion_list(self) -> list[str]:
        return [tag.strip() for tag in self.occasions.split(",") if tag.strip()]

    @property
    def rating_average(self) -> float:
        stars = [r.stars for r in self.ratings]
        return round(sum(stars) / len(stars), 2) if stars else 0.0

    @property
    def rating_count(self) -> int:
        return len(self.ratings)


class Rating(Base):
    __tablename__ = "ratings"
    __table_args__ = (UniqueConstraint("user_id", "dish_id", name="uq_rating_user_dish"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), index=True, nullable=False)
    stars: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped[User] = relationship(back_populates="ratings")
    dish: Mapped[Dish] = relationship(back_populates="ratings")


class Favourite(Base):
    __tablename__ = "favourites"
    __table_args__ = (UniqueConstraint("user_id", "dish_id", name="uq_favourite_user_dish"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    dish_id: Mapped[int] = mapped_column(ForeignKey("dishes.id"), index=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user: Mapped[User] = relationship(back_populates="favourites")
    dish: Mapped[Dish] = relationship()


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    table_number: Mapped[str] = mapped_column(String(20), default="")
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    note: Mapped[str] = mapped_column(String(500), default="")
    total_rwf: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user: Mapped[User | None] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy="selectin"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), index=True, nullable=False)
    dish_id: Mapped[int | None] = mapped_column(ForeignKey("dishes.id"), nullable=True)
    dish_name: Mapped[str] = mapped_column(String(120), nullable=False)  # snapshot at order time
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_price_rwf: Mapped[int] = mapped_column(Integer, nullable=False)  # snapshot price

    order: Mapped[Order] = relationship(back_populates="items")
    dish: Mapped[Dish | None] = relationship()


class RecommendationLog(Base):
    """Every quiz run is stored: this is the evidence base for the evaluation chapter."""

    __tablename__ = "recommendation_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    answers: Mapped[str] = mapped_column(Text, default="{}")     # JSON of the quiz answers
    result_ids: Mapped[str] = mapped_column(Text, default="[]")  # JSON list of dish ids
    top_dish_id: Mapped[int | None] = mapped_column(ForeignKey("dishes.id"), nullable=True)
    chosen_dish_id: Mapped[int | None] = mapped_column(ForeignKey("dishes.id"), nullable=True)
    top_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)
