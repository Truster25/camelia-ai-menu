"""Seed the database with the real Camellia menu (16 categories, 130 dishes) and demo users.

Run:  python seed.py          (idempotent, safe to run again)
      python seed.py --reset  (drops and recreates every table first)
"""
from __future__ import annotations

import argparse
import random
import re
import unicodedata
from pathlib import Path
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import Base, SessionLocal, engine, init_db
from app.models import Category, Dish, Order, OrderItem, Rating, RecommendationLog, User
from app.security import hash_password

# The menu itself lives in menu_data.py: 130 dishes transcribed from photographs
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

# Photography per dish. Only photos that actually exist in
# frontend/public/images/ are listed; anything missing falls back to generated
# art, so a missing file never breaks a card.
#
# These 25 photographs were made for the demo menu. They are reused here only
# where the subject genuinely matches the real dish. Everything else has no
# photograph yet and shows generated art until the restaurant's own photos
# arrive, which is honest: an invented picture of a dish Camellia sells is worse
# than a placeholder.
IMAGES = {
    # breakfast
    "Chipati Omelette": "/images/hero/dish-omelette.jpg",
    "Spanish Omelette": "/images/hero/dish-breakfast.jpg",
    "Camellia Executive Breakfast": "/images/hero/dish-granola.jpg",
    # soups and salads
    "Vegetable Soup": "/images/hero/dish-soup.jpg",
    "Fresh Garden Mix Salad": "/images/hero/dish-salad.jpg",
    "American Garden Salad": "/images/hero/dish-avocado-salad.jpg",
    "Beef Strips Salad": "/images/hero/dish-sambaza.jpg",
    # sandwiches, burgers
    "Camellia Cheese Beef Burger": "/images/hero/dish-burger.jpg",
    # kingsize and curries
    "Beef Chicken Fish Stew": "/images/hero/dish-ugali.jpg",
    "Beef Steak": "/images/hero-dish.jpg",
    "Chicken Curry": "/images/hero/dish-brochette.jpg",
    "Fish Fillet": "/images/hero/dish-tilapia.jpg",
    "Beef Curry": "/images/hero/dish-goat-brochette.jpg",
    "Vegetable Curry": "/images/hero/dish-isombe.jpg",
    # drinks
    "Latte": "/images/hero/dish-latte.jpg",
    "Cappuccino": "/images/hero/dish-tea.jpg",
    "Iced Coffee Mocha": "/images/hero/dish-icedmocha.jpg",
    "Camellia African Coffee": "/images/hero/dish-pourover.jpg",
    "Passion Juice": "/images/hero/dish-passionjuice.jpg",
    "Lemon Juice": "/images/hero/dish-lemonade.jpg",
    "Mango Breeze": "/images/hero/dish-smoothie.jpg",
    # desserts
    "Chocolate Cake": "/images/hero/dish-fondant.jpg",
    "Banana Cake": "/images/hero/dish-banana-cake.jpg",
    "Create Your Own Juice": "/images/hero/dish-fruitplatter.jpg",
    "Spaghetti Bolognaise": "/images/hero/dish-pasta.jpg",
}


def _slug(name: str) -> str:
    """Turn a dish name into the filename its photograph would have.

    "Creamed Frappé" becomes "creamed-frappe", so a photo dropped into
    frontend/public/images/dishes/ is picked up automatically. That keeps the
    seeder honest without a hand-maintained list that drifts out of date.
    """
    plain = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-zA-Z0-9]+", "-", plain).strip("-").lower()


DISH_PHOTO_DIR = (
    Path(__file__).resolve().parent.parent / "frontend" / "public" / "images" / "dishes"
)


def dish_photo(name: str) -> str | None:
    """The photograph for a dish: the curated one first, then the folder."""
    curated = IMAGES.get(name)
    if curated:
        return curated
    candidate = DISH_PHOTO_DIR / f"{_slug(name)}.jpg"
    if candidate.exists():
        return f"/images/dishes/{candidate.name}"
    return None


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
            corrected = 0
            for dish in db.scalars(select(Dish)).all():
                wanted = dish_photo(dish.name)
                # Backfill a missing photo, and also correct one that had to
                # share another dish's photo before its own existed.
                if wanted and dish.image_url != wanted:
                    dish.image_url = wanted
                    filled += 1

                row = source.get(dish.name)
                if row is None:
                    continue
                for field, column in (
                    ("is_vegetarian", "is_vegetarian"),
                    ("is_vegan", "is_vegan"),
                    ("is_halal", "is_halal"),
                    ("is_gluten_free", "is_gluten_free"),
                    ("spice_level", "spice_level"),
                    ("price", "price_rwf"),
                ):
                    if getattr(dish, column) != row[field]:
                        setattr(dish, column, row[field])
                        corrected += 1
            # The demo accounts are part of the promised setup, so a missing one
            # is repaired here rather than left for someone to discover on stage.
            missing_users = 0
            for name, email, password, role in DEMO_USERS:
                if db.scalar(select(User).where(User.email == email)) is None:
                    db.add(
                        User(
                            name=name,
                            email=email,
                            password_hash=hash_password(password),
                            role=role,
                        )
                    )
                    missing_users += 1

            if filled or missing_users or corrected:
                db.commit()
                print(
                    f"Database already seeded, backfilled {filled} dish image(s), "
                    f"{missing_users} account(s) and corrected {corrected} dish field(s)."
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

        users: dict[str, User] = {}
        for name, email, password, role in DEMO_USERS:
            user = User(name=name, email=email, password_hash=hash_password(password), role=role)
            db.add(user)
            users[email] = user
        # A few extra demo customers so the admin dashboard is not empty.
        rng = random.Random(7)
        for index, first in enumerate(["Jean", "Claudine", "Eric", "Diane", "Patrick", "Sandrine"]):
            user = User(
                name=f"{first} Demo",
                email=f"{first.lower()}@example.rw",
                password_hash=hash_password("Demo1234"),
                role="customer",
            )
            db.add(user)
            users[user.email] = user
        db.flush()

        customer_pool = [u for u in users.values() if u.role == "customer"]
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
