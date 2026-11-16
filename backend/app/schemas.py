"""Request/response schemas (Pydantic v2)."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# --------------------------------------------------------------------------- auth


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    role: str
    created_at: datetime


class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    role: Literal["customer", "admin"] = "customer"


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------------------------------------------------------------------- categories


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str
    sort_order: int


# -------------------------------------------------------------------------- dishes


class DishBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = ""
    category_id: int
    price_rwf: int = Field(ge=0, le=10_000_000)
    cuisine: str = "Rwandan"
    occasions: str = ""
    is_vegetarian: bool = False
    is_vegan: bool = False
    is_halal: bool = True
    is_gluten_free: bool = False
    spice_level: int = Field(default=0, ge=0, le=3)
    ingredients: str = ""
    allergens: str = ""
    prep_minutes: int = Field(default=20, ge=1, le=240)
    calories: int = Field(default=0, ge=0)
    popularity_seed: int = Field(default=50, ge=0, le=100)
    art_tone: str = "green"
    image_url: str | None = None
    is_available: bool = True
    is_signature: bool = False


class DishCreate(DishBase):
    pass


class DishUpdate(BaseModel):
    """All fields optional — PATCH semantics."""

    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = None
    category_id: int | None = None
    price_rwf: int | None = Field(default=None, ge=0, le=10_000_000)
    cuisine: str | None = None
    occasions: str | None = None
    is_vegetarian: bool | None = None
    is_vegan: bool | None = None
    is_halal: bool | None = None
    is_gluten_free: bool | None = None
    spice_level: int | None = Field(default=None, ge=0, le=3)
    ingredients: str | None = None
    allergens: str | None = None
    prep_minutes: int | None = Field(default=None, ge=1, le=240)
    calories: int | None = Field(default=None, ge=0)
    popularity_seed: int | None = Field(default=None, ge=0, le=100)
    art_tone: str | None = None
    image_url: str | None = None
    is_available: bool | None = None
    is_signature: bool | None = None


class DishOut(DishBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_name: str = ""
    category_slug: str = ""
    rating_average: float = 0.0
    rating_count: int = 0
    occasion_list: list[str] = []


# ------------------------------------------------------------------ recommendations


DietChoice = Literal["none", "vegetarian", "vegan", "halal", "gluten-free"]
SpiceChoice = Literal["mild", "medium", "hot"]
BudgetChoice = Literal["low", "mid", "high"]
CuisineChoice = Literal["rwandan", "african", "international", "any"]
OccasionChoice = Literal["quick-bite", "casual", "date", "celebration", "family"]


class QuizAnswers(BaseModel):
    diet: DietChoice = "none"
    spice: SpiceChoice = "mild"
    budget: BudgetChoice = "mid"
    cuisine: CuisineChoice = "any"
    occasion: OccasionChoice = "casual"

    @field_validator("diet", "spice", "budget", "cuisine", "occasion", mode="before")
    @classmethod
    def lowercase(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value


class RecommendationOut(BaseModel):
    dish: DishOut
    score: float  # 0-100
    reason: str
    score_breakdown: dict[str, float]
    badges: list[str] = []


class RecommendResponse(BaseModel):
    answers: QuizAnswers
    results: list[RecommendationOut]
    filters_applied: list[str]
    considered: int
    generated_at: datetime
    log_id: int | None = None


# ------------------------------------------------------------------------ ratings


class RatingIn(BaseModel):
    stars: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=500)


class RatingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    dish_id: int
    stars: int
    comment: str
    updated_at: datetime
    user_name: str = ""


# ------------------------------------------------------------------------- orders


class OrderItemIn(BaseModel):
    dish_id: int
    quantity: int = Field(default=1, ge=1, le=20)


class OrderIn(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1, max_length=30)
    table_number: str = Field(default="", max_length=20)
    note: str = Field(default="", max_length=500)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    dish_id: int | None
    dish_name: str
    quantity: int
    unit_price_rwf: int


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    customer_name: str = ""
    table_number: str
    status: str
    note: str
    total_rwf: int
    created_at: datetime
    items: list[OrderItemOut]


class OrderStatusIn(BaseModel):
    status: Literal["pending", "accepted", "preparing", "ready", "completed", "cancelled"]


# ---------------------------------------------------------------------- analytics


class TopDish(BaseModel):
    dish_id: int
    name: str
    orders: int
    rating_average: float
    rating_count: int


class AnalyticsOut(BaseModel):
    total_orders: int
    revenue_rwf: int
    customers: int
    dishes: int
    ratings: int
    average_rating: float
    recommendations: int
    orders_by_status: dict[str, int]
    top_dishes: list[TopDish]
    quiz_popularity: dict[str, int]
    last_7_days: list[dict[str, int | str]]
