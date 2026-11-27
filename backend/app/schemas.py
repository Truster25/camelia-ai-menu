"""Request/response schemas (Pydantic v2)."""
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# --------------------------------------------------------------------------- auth


def _password_fits_bcrypt(value: str) -> str:
    """bcrypt silently ignores bytes past 72, so a longer password would be
    accepted here and then fail to verify at login. Multi-byte characters
    (emoji, accents) make "72 characters" and "72 bytes" different limits."""
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Use a password no longer than 72 bytes. Some characters use more than one byte.")
    return value


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
    # Deliberately not accepted here. Public registration creates customers
    # only: if this field were honoured, anyone could post {"role": "admin"} and
    # own the restaurant. Staff are promoted by an administrator, below.
    role: Literal["customer"] = "customer"

    @field_validator("name", mode="before")
    @classmethod
    def strip_name(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return _password_fits_bcrypt(value)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ForgotPasswordOut(BaseModel):
    """The token that authorises setting a new password for this account.

    By design this endpoint does not email anything or prove the caller owns
    the inbox -- it only confirms the address matches an account and hands
    back a short-lived token on the spot. See the forgot_password route for
    the full trade-off.
    """

    token: str


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)

    @field_validator("new_password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        return _password_fits_bcrypt(value)


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


class SearchIn(BaseModel):
    """Free text from the menu search box."""

    query: str = Field(min_length=2, max_length=200)
    limit: int = Field(default=6, ge=1, le=20)


class SearchResponse(BaseModel):
    query: str
    results: list[RecommendationOut]
    # What the parser took from the sentence, shown back to the customer so the
    # answer is never a black box.
    understood: list[str]
    considered: int


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
    # How the customer intends to settle. Restricted to the three methods the
    # restaurant actually accepts.
    payment_method: Literal["cash", "momo", "card"] = "cash"


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
    payment_method: str = "cash"
    payment_status: str = "unpaid"
    created_at: datetime
    items: list[OrderItemOut]


class OrderStatusIn(BaseModel):
    status: Literal["pending", "accepted", "preparing", "ready", "completed", "cancelled"]


class RoleIn(BaseModel):
    role: Literal["customer", "admin", "kitchen"]


class PaymentStatusIn(BaseModel):
    payment_status: Literal["unpaid", "paid", "refunded"]


# ---------------------------------------------------------------------- analytics


class RecommendationEffectiveness(BaseModel):
    """Does the AI actually change what people order?

    Three numbers, because `chosen` alone is not enough to judge it. A quiz can
    produce a top five and the customer can ignore all of it; `shown` counts
    that. The rate is only meaningful next to both.
    """

    quizzes: int
    shown: int
    chosen: int
    acceptance_rate: float


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
    recommendation_effectiveness: RecommendationEffectiveness
