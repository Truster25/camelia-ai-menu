"""Shared serialisation helpers."""
from __future__ import annotations

import re

from .models import Dish
from .schemas import DishOut


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def serialise_dish(dish: Dish) -> DishOut:
    category = dish.category
    payload = DishOut.model_validate(dish)
    payload.category_name = category.name if category else ""
    payload.category_slug = slugify(category.name) if category else ""
    payload.occasion_list = dish.occasion_list
    payload.rating_average = dish.rating_average
    payload.rating_count = dish.rating_count
    return payload
