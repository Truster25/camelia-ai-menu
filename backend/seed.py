"""Seed the database with the Camelia menu and demo users.

Run:  python seed.py          (idempotent, safe to run again)
      python seed.py --reset  (drops and recreates every table first)
"""
from __future__ import annotations

import argparse
import random
import re
import unicodedata
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine, init_db
from app.models import Category, Dish, Order, OrderItem, Rating, RecommendationLog, User
from app.security import hash_password

# The menu itself lives in menu_data.py: dishes transcribed from photographs
# of the printed menu, with the fields the menu does not print (diet, spice,
# prep time) marked conservatively and documented in docs/DIETARY-REVIEW.md.
from menu_data import CATEGORIES, DISHES as MENU  # noqa: E402

DEMO_USERS = [
    ("Camelia Administrator", "admin@camelia.rw", "Admin123", "admin"),
    ("Aline Mukamana", "customer@camelia.rw", "Customer123", "customer"),
    # The kitchen has its own account because it needs a different view: orders
    # and nothing else. It cannot change the menu or read the takings.
    ("Jean Bosco Habimana", "kitchen@camelia.rw", "Kitchen123", "kitchen"),
]


def _add_missing_users(db: Session, accounts: list[tuple[str, str, str, str]]) -> list[User]:
    added = []
    for name, email, password, role in accounts:
        if db.scalar(select(User.id).where(User.matches_email(email)).limit(1)) is None:
            user = User(name=name, email=email, password_hash=hash_password(password), role=role)
            db.add(user)
            added.append(user)
    return added


# Matching images already used on the home page keep their original URLs.
IMAGES = {
    "Camelia Cheese Beef Burger": "/images/hero/dish-burger.jpg",
    "Iced Coffee Mocha": "/images/hero/dish-icedmocha.jpg",
    "Camelia African Coffee": "/images/hero/dish-pourover.jpg",
    "Passion Juice": "/images/hero/dish-passionjuice.jpg",
    "Lemon Juice": "/images/hero/dish-lemonade.jpg",
    "Banana Cake": "/images/hero/dish-banana-cake.jpg",
}

# The original demo's name and image pairs identify rows that can be retired
# when refreshing an old database. Orders and ratings still reference them.
LEGACY_DEMO_IMAGES = {
    "Katogo": "/images/hero/dish-katogo.jpg",
    "Camelia Big Breakfast": "/images/hero/dish-breakfast.jpg",
    "Akabenzi Omelette": "/images/hero/dish-omelette.jpg",
    "Granola & Yoghurt Bowl": "/images/hero/dish-granola.jpg",
    "Camelia Garden Salad": "/images/hero/dish-salad.jpg",
    "Sambaza Platter": "/images/hero/dish-sambaza.jpg",
    "Avocado & Tomato Salad": "/images/hero/dish-avocado-salad.jpg",
    "Mushroom Soup": "/images/hero/dish-soup.jpg",
    "Ubugali & Beef Stew": "/images/hero/dish-ugali.jpg",
    "Isombe": "/images/hero/dish-isombe.jpg",
    "Grilled Tilapia": "/images/hero/dish-tilapia.jpg",
    "Chicken Brochette": "/images/hero-dish.jpg",
    "Beef Brochette": "/images/hero/dish-brochette.jpg",
    "Goat Brochette": "/images/hero/dish-goat-brochette.jpg",
    "Creamy Chicken Pasta": "/images/hero/dish-pasta.jpg",
    "Beef Burger & Fries": "/images/hero/dish-burger.jpg",
    "Camelia Signature Latte": "/images/hero/dish-latte.jpg",
    "Rwandan Single-Origin Pour Over": "/images/hero/dish-pourover.jpg",
    "Iced Mocha": "/images/hero/dish-icedmocha.jpg",
    "African Spiced Tea": "/images/hero/dish-tea.jpg",
    "Banana & Cinnamon Cake": "/images/hero/dish-banana-cake.jpg",
    "Chocolate Fondant": "/images/hero/dish-fondant.jpg",
    "Tropical Fruit Platter": "/images/hero/dish-fruitplatter.jpg",
    "Passion Fruit Juice": "/images/hero/dish-passionjuice.jpg",
    "Mango & Ginger Smoothie": "/images/hero/dish-smoothie.jpg",
    "Ginger Lemonade": "/images/hero/dish-lemonade.jpg",
}


def _slug(name: str) -> str:
    """Turn a dish name into its image filename.

    "Creamed Frappé" becomes "creamed-frappe", so a photo dropped into
    frontend/public/images/dishes/ is picked up automatically. That keeps the
    seeder honest without a hand-maintained list that drifts out of date.
    """
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", plain).strip("-").lower()


def dish_photo(name: str) -> str:
    """Return a seeded dish's public image URL, including on backend-only hosts."""
    return IMAGES.get(name, f"/images/dishes/{_slug(name)}.jpg")


COMMENTS = [
    (5, "Exactly what I wanted. The recommender nailed it."),
    (5, "Great portion, will order again."),
    (4, "Lovely flavour, a touch slow to arrive on a busy Friday."),
    (4, "Very good value for Kigali."),
    (3, "Nice but I would ask for more chilli next time."),
    (5, "Came for the quiz, stayed for the food."),
]


def seed(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    init_db()

    db = SessionLocal()
    try:
        if db.scalar(select(Dish).limit(1)) is not None:
            # Already seeded. Still backfill any dish photo that is missing, so
            # an existing database picks up newly added images without a reset.
            filled = 0
            # The menu in menu_data.py is the source of truth, so a field that was
            # corrected there must reach a database that already exists. Before
            # this, a database seeded before the dietary review kept its old
            # labels, and the gluten-free filter quietly returned nothing.
            source = {row["name"]: row for row in MENU}
            categories_by_name = {
                category.name: category for category in db.scalars(select(Category)).all()
            }
            corrected = 0
            added_sections = 0
            for name, description, order in CATEGORIES:
                category = categories_by_name.get(name)
                if category is None:
                    category = Category(name=name, description=description, sort_order=order)
                    db.add(category)
                    categories_by_name[name] = category
                    added_sections += 1
                elif category.sort_order != order:
                    category.sort_order = order
                    corrected += 1
            if added_sections:
                db.flush()

            retired = 0
            known_dishes = set()
            for dish in db.scalars(select(Dish)).all():
                known_dishes.add(dish.name)
                row = source.get(dish.name)
                if row is None:
                    if (
                        dish.is_available
                        and dish.image_url
                        and LEGACY_DEMO_IMAGES.get(dish.name) == dish.image_url
                    ):
                        dish.is_available = False
                        retired += 1
                    continue

                wanted = dish_photo(dish.name)
                # Replace old demo artwork and preserve URLs supplied by staff.
                if dish.image_url != wanted and (
                    not dish.image_url
                    or dish.image_url.startswith("/images/hero/")
                    or dish.image_url == "/images/hero-dish.jpg"
                ):
                    dish.image_url = wanted
                    filled += 1

                for field, column in (
                    ("is_vegetarian", "is_vegetarian"),
                    ("is_vegan", "is_vegan"),
                    ("is_halal", "is_halal"),
                    ("is_gluten_free", "is_gluten_free"),
                    ("spice_level", "spice_level"),
                    ("price", "price_rwf"),
                    ("description", "description"),
                    ("ingredients", "ingredients"),
                    ("allergens", "allergens"),
                ):
                    if getattr(dish, column) != row[field]:
                        setattr(dish, column, row[field])
                        corrected += 1

                # A dish filed in the wrong section has to move, or the Tea
                # section keeps quoting a coffee price for a pot of tea.
                wanted_category = categories_by_name[row["category"]]
                if dish.category_id != wanted_category.id:
                    dish.category_id = wanted_category.id
                    corrected += 1
            # The demo accounts are part of the promised setup, so a missing one
            # is repaired here rather than left for someone to discover on stage.
            missing_users = len(_add_missing_users(db, DEMO_USERS))

            added_dishes = 0
            for row in MENU:
                if row["name"] in known_dishes:
                    continue
                db.add(Dish(
                    name=row["name"],
                    description=row["description"],
                    category_id=categories_by_name[row["category"]].id,
                    price_rwf=row["price"],
                    cuisine=row["cuisine"],
                    occasions=row["occasions"],
                    is_vegetarian=row["is_vegetarian"],
                    is_vegan=row["is_vegan"],
                    is_halal=row["is_halal"],
                    is_gluten_free=row["is_gluten_free"],
                    spice_level=row["spice_level"],
                    ingredients=row["ingredients"],
                    allergens=row["allergens"],
                    prep_minutes=row["prep_minutes"],
                    calories=row["calories"],
                    popularity_seed=row["popularity_seed"],
                    art_tone="amber",
                    image_url=dish_photo(row["name"]),
                    is_available=True,
                    is_signature=row["is_signature"],
                ))
                added_dishes += 1

            if filled or missing_users or corrected or added_dishes or added_sections or retired:
                db.commit()
                if added_dishes or added_sections:
                    print(f"Added {added_dishes} dish(es) and {added_sections} section(s).")
                print(
                    f"Database already seeded, backfilled {filled} dish image(s), "
                    f"{missing_users} account(s), corrected {corrected} catalog field(s), "
                    f"and retired {retired} prototype dish(es)."
                )
            else:
                print("Database already seeded, nothing to do. Use --reset to rebuild.")
            return

        categories: dict[str, Category] = {}
        for name, description, order in CATEGORIES:
            category = Category(name=name, description=description, sort_order=order)
            db.add(category)
            categories[name] = category
        db.flush()

        dishes: list[Dish] = []
        for row in MENU:
            dish = Dish(
                name=row["name"],
                description=row["description"],
                category_id=categories[row["category"]].id,
                price_rwf=row["price"],
                cuisine=row["cuisine"],
                occasions=row["occasions"],
                is_vegetarian=row["is_vegetarian"],
                is_vegan=row["is_vegan"],
                is_halal=row["is_halal"],
                is_gluten_free=row["is_gluten_free"],
                spice_level=row["spice_level"],
                ingredients=row["ingredients"],
                allergens=row["allergens"],
                prep_minutes=row["prep_minutes"],
                calories=row["calories"],
                popularity_seed=row["popularity_seed"],
                art_tone="amber",
                image_url=dish_photo(row["name"]),
                is_available=True,
                is_signature=row["is_signature"],
            )
            db.add(dish)
            dishes.append(dish)
        db.flush()

        rng = random.Random(7)
        sample_customers = [
            (f"{first} Demo", f"{first.lower()}@example.rw", "Demo1234", "customer")
            for first in ("Jean", "Claudine", "Eric", "Diane", "Patrick", "Sandrine")
        ]
        users = _add_missing_users(db, DEMO_USERS + sample_customers)
        db.flush()

        customer_pool = [u for u in users if u.role == "customer"]
        if not customer_pool:
            db.commit()
            print(f"Seeded {len(categories)} categories and {len(dishes)} dishes. Existing accounts kept.")
            return
        for dish in rng.sample(dishes, 12):
            for user in rng.sample(customer_pool, rng.randint(1, 3)):
                stars, comment = rng.choice(COMMENTS)
                db.add(Rating(user_id=user.id, dish_id=dish.id, stars=stars, comment=comment))

        now = datetime.now(timezone.utc)
        statuses = ["completed", "completed", "completed", "preparing", "accepted", "pending", "cancelled"]
        for index in range(9):
            customer = rng.choice(customer_pool)
            created = now - timedelta(days=index % 6, hours=rng.randint(0, 5))
            items = rng.sample(dishes, rng.randint(1, 3))
            order = Order(
                user_id=customer.id,
                table_number=str(rng.randint(1, 14)),
                status=statuses[index % len(statuses)],
                note="",
                created_at=created,
                updated_at=created,
            )
            total = 0
            for dish in items:
                quantity = rng.randint(1, 2)
                total += dish.price_rwf * quantity
                order.items.append(
                    OrderItem(dish_id=dish.id, dish_name=dish.name, quantity=quantity, unit_price_rwf=dish.price_rwf)
                )
            order.total_rwf = total
            db.add(order)

        for index in range(14):
            top = rng.choice(dishes)
            db.add(
                RecommendationLog(
                    user_id=None if index % 3 == 0 else rng.choice(customer_pool).id,
                    answers='{"diet": "none", "spice": "mild", "budget": "mid", "cuisine": "rwandan", "occasion": "casual"}',
                    result_ids=f"[{top.id}]",
                    top_dish_id=top.id,
                    top_score=round(rng.uniform(55, 88), 1),
                    created_at=now - timedelta(days=rng.randint(0, 6)),
                )
            )

        db.commit()
        print(f"Seeded {len(categories)} categories, {len(dishes)} dishes, {len(users)} users, orders and ratings.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Camelia database")
    parser.add_argument("--reset", action="store_true", help="drop all tables first")
    args = parser.parse_args()
    seed(reset=args.reset)
