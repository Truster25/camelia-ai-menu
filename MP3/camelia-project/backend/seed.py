"""Seed the database with the Camelia menu (6 categories, 24 dishes) and demo users.

Run:  python seed.py          (idempotent — safe to run again)
      python seed.py --reset  (drops and recreates every table first)
"""
from __future__ import annotations

import argparse
import random
from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database import Base, SessionLocal, engine, init_db
from app.models import Category, Dish, Order, OrderItem, Rating, RecommendationLog, User
from app.security import hash_password

CATEGORIES = [
    ("Breakfast", "Slow mornings, Rwandan classics and fresh starts.", 1),
    ("Starters & Salads", "Light plates to open the table.", 2),
    ("From the Grill & Kitchen", "Hearty mains, brochettes and house favourites.", 3),
    ("Coffee & Tea", "Single-origin Rwandan coffee, brewed with care.", 4),
    ("Desserts", "Something sweet to finish on.", 5),
    ("Fresh Juices", "Cold-pressed, seasonal and made to order.", 6),
]

# name, category, price, cuisine, occasions, veg, vegan, halal, gf, spice, ingredients,
# allergens, prep, calories, popularity, tone, description, signature
DISHES = [
    # ---------------------------------------------------------------- Breakfast
    ("Katogo", "Breakfast", 4500, "Rwandan", "quick-bite,casual,family", True, False, True, True, 1,
     "matooke,beans,tomato,onion,ginger,spring onion", "", 15, 420, 88, "amber",
     "Green matooke simmered with beans, tomato and ginger — the Kigali morning classic.", True),
    ("Camelia Big Breakfast", "Breakfast", 9500, "International", "casual,family,celebration", False, False, False, False, 1,
     "eggs,bacon,sausage,baked beans,mushroom,grilled tomato,toast", "egg,gluten,milk", 20, 780, 74, "brown",
     "Two eggs your way, Rwandan sausage, bacon, beans, grilled tomato and toast.", True),
    ("Akabenzi Omelette", "Breakfast", 6000, "Rwandan", "quick-bite,casual", False, False, False, True, 2,
     "eggs,akabenzi pork,tomato,onion,chilli,cheese", "egg,milk", 12, 510, 63, "amber",
     "Three-egg omelette folded with spiced akabenzi pork, tomato and a little chilli."),
    ("Granola & Yoghurt Bowl", "Breakfast", 5000, "International", "quick-bite,casual,date", True, False, True, False, 0,
     "granola,yoghurt,banana,honey,passion fruit,oats", "milk,nuts,gluten", 5, 340, 58, "green",
     "House granola, thick yoghurt, banana and passion fruit with a drizzle of honey."),

    # ------------------------------------------------------- Starters & Salads
    ("Camelia Garden Salad", "Starters & Salads", 4500, "International", "quick-bite,casual,date", True, True, True, True, 0,
     "lettuce,avocado,tomato,cucumber,red onion,citrus dressing", "", 8, 210, 66, "green",
     "Crisp leaves, avocado, tomato and cucumber with a bright citrus dressing."),
    ("Sambaza Platter", "Starters & Salads", 7000, "Rwandan", "casual,family,celebration", False, False, True, True, 2,
     "sambaza,sambaza,lemon,chilli,tomato,onion", "fish", 15, 390, 81, "amber",
     "Lake Kivu sambaza fried crisp, served with lemon, chilli and tomato relish.", True),
    ("Avocado & Tomato Salad", "Starters & Salads", 4000, "Rwandan", "quick-bite,casual,family", True, True, True, True, 0,
     "avocado,tomato,red onion,lime,groundnuts", "nuts", 7, 260, 60, "green",
     "Ripe avocado and tomato with red onion, lime and crushed groundnuts."),
    ("Mushroom Soup", "Starters & Salads", 5500, "International", "casual,date", True, False, True, False, 1,
     "mushroom,cream,onion,garlic,thyme,bread", "milk,gluten", 10, 280, 54, "brown",
     "Creamy forest mushroom soup with thyme and warm house bread."),

    # ------------------------------------------ From the Grill & Kitchen (mains)
    ("Ubugali & Beef Stew", "From the Grill & Kitchen", 8000, "Rwandan", "casual,family", False, False, True, True, 2,
     "ugali,beef,tomato,carrot,onion,green pepper", "", 25, 720, 84, "amber",
     "Hand-rolled ugali with slow-cooked beef stew and garden vegetables."),
    ("Isombe", "From the Grill & Kitchen", 6500, "Rwandan", "casual,family", True, False, True, True, 1,
     "cassava leaves,spinach,palm oil,onion,groundnuts,fish", "fish,nuts", 25, 380, 71, "green",
     "Pounded cassava leaves simmered with onion, palm oil and groundnuts.", True),
    ("Grilled Tilapia", "From the Grill & Kitchen", 12000, "Rwandan", "date,celebration,family", False, False, True, True, 2,
     "tilapia,lemon,garlic,ginger,chilli,plantain,greens", "fish", 30, 520, 90, "amber",
     "Whole tilapia grilled over charcoal with lemon, chilli and fried plantain.", True),
    ("Chicken Brochette", "From the Grill & Kitchen", 7500, "Rwandan", "casual,family,celebration", False, False, True, True, 2,
     "chicken,peanut,chilli,onion,green pepper,garlic", "nuts", 20, 480, 86, "brown",
     "Marinated chicken skewers off the grill with peanut chilli sauce.", True),
    ("Beef Brochette", "From the Grill & Kitchen", 8500, "Rwandan", "casual,family,quick-bite", False, False, True, True, 2,
     "beef,chilli,onion,tomato,garlic", "", 20, 540, 79, "brown",
     "Charcoal-grilled beef skewers with onion and a fiery tomato chilli dip."),
    ("Goat Brochette", "From the Grill & Kitchen", 9000, "Rwandan", "casual,family,celebration", False, False, True, True, 3,
     "goat,chilli,onion,garlic,lemon", "", 25, 610, 76, "brown",
     "Tender goat grilled slowly, finished with lemon and house chilli."),
    ("Creamy Chicken Pasta", "From the Grill & Kitchen", 9500, "International", "date,family,casual", False, False, True, False, 1,
     "pasta,chicken,cream,mushroom,garlic,parmesan,basil", "gluten,milk", 22, 690, 72, "amber",
     "Fettuccine tossed in cream with grilled chicken, mushroom and basil."),
    ("Beef Burger & Fries", "From the Grill & Kitchen", 10500, "International", "quick-bite,casual,family", False, False, True, False, 1,
     "beef,cheese,brioche,bacon,lettuce,tomato,potato,mayonnaise", "gluten,milk,egg", 20, 860, 77, "brown",
     "Char-grilled beef burger with cheese, bacon and hand-cut fries."),

    # ----------------------------------------------------------- Coffee & Tea
    ("Camellia Signature Latte", "Coffee & Tea", 4000, "Rwandan", "quick-bite,date,casual", True, False, True, True, 0,
     "espresso,milk,vanilla,powdered sugar", "milk", 5, 170, 91, "brown",
     "Double espresso, steamed milk and a whisper of vanilla — our house latte.", True),
    ("Rwandan Single-Origin Pour Over", "Coffee & Tea", 4500, "Rwandan", "quick-bite,date,casual", True, True, True, True, 0,
     "rwandan coffee,arabica,huye,water", "", 7, 5, 82, "brown",
     "Huye highlands arabica, hand-poured and served black. Bright and floral."),
    ("Iced Mocha", "Coffee & Tea", 4800, "International", "quick-bite,casual,date", True, False, True, True, 0,
     "espresso,chocolate,milk,ice,cream", "milk", 5, 210, 69, "brown",
     "Espresso and dark chocolate over ice with cold milk and cream."),
    ("African Spiced Tea", "Coffee & Tea", 2500, "Rwandan", "quick-bite,casual,family", True, True, True, True, 1,
     "black tea,ginger,cardamom,cinnamon,milk,honey", "milk", 4, 120, 65, "amber",
     "Black tea brewed with ginger, cardamom and cinnamon, honey on the side."),

    # --------------------------------------------------------------- Desserts
    ("Banana & Cinnamon Cake", "Desserts", 4500, "Rwandan", "quick-bite,casual,date", True, False, True, False, 0,
     "banana,cinnamon,flour,butter,egg,sugar", "gluten,egg,milk", 5, 380, 78, "amber",
     "Warm banana cake with cinnamon and a spoon of fresh cream."),
    ("Chocolate Fondant", "Desserts", 6000, "International", "date,celebration", True, False, True, False, 0,
     "dark chocolate,butter,egg,flour,sugar,cream", "gluten,egg,milk", 15, 460, 83, "brown",
     "Molten dark chocolate fondant with vanilla cream. Best shared on a date.", True),
    ("Tropical Fruit Platter", "Desserts", 5000, "Rwandan", "quick-bite,family,casual", True, True, True, True, 0,
     "pineapple,passion fruit,mango,watermelon,banana,grapefruit", "", 8, 180, 70, "green",
     "Whatever is sweetest that morning, sliced to order. Naturally vegan."),

    # ------------------------------------------------------------ Fresh Juices
    ("Passion Fruit Juice", "Fresh Juices", 3000, "Rwandan", "quick-bite,casual,family", True, True, True, True, 0,
     "passion fruit,sugar,water,ice", "", 4, 110, 87, "amber",
     "Poured from fresh passion fruit, sharpened with lime. No concentrate.", True),
    ("Mango & Ginger Smoothie", "Fresh Juices", 3500, "International", "quick-bite,casual,date", True, False, True, True, 0,
     "mango,ginger,yoghurt,honey,ice", "milk", 5, 220, 73, "amber",
     "Ripe mango blended with ginger and thick yoghurt."),
    ("Ginger Lemonade", "Fresh Juices", 2800, "International", "quick-bite,casual", True, True, True, True, 1,
     "ginger,lemon,honey,soda,ice", "", 4, 90, 61, "green",
     "House ginger syrup, lemon and sparkling water — bright and refreshing."),
]

DEMO_USERS = [
    ("Camelia Administrator", "admin@camelia.rw", "Admin123", "admin"),
    ("Aline Mukamana", "customer@camelia.rw", "Customer123", "customer"),
]

# Photography per dish. Only the photos that exist are referenced; any path that
# is missing falls back to the generated gradient art in DishArt, so a missing
# file never breaks the page.
# Photography per dish. Only photos that actually exist in
# frontend/public/images/ are listed; everything else falls back to the
# generated gradient art in DishArt, so a missing file never breaks a card.
# Add the real photo, add one line here, re-run: python seed.py --reset
IMAGES = {'Katogo': '/images/hero/dish-katogo.jpg', 'Camelia Big Breakfast': '/images/hero/dish-breakfast.jpg', 'Akabenzi Omelette': '/images/hero/dish-omelette.jpg', 'Granola & Yoghurt Bowl': '/images/hero/dish-granola.jpg', 'Camelia Garden Salad': '/images/hero/dish-salad.jpg', 'Sambaza Platter': '/images/hero/dish-sambaza.jpg', 'Avocado & Tomato Salad': '/images/hero/dish-salad.jpg', 'Mushroom Soup': '/images/hero/dish-soup.jpg', 'Ubugali & Beef Stew': '/images/hero/dish-ugali.jpg', 'Isombe': '/images/hero/dish-isombe.jpg', 'Grilled Tilapia': '/images/hero/dish-tilapia.jpg', 'Chicken Brochette': '/images/hero-dish.jpg', 'Beef Brochette': '/images/hero/dish-brochette.jpg', 'Goat Brochette': '/images/hero/dish-brochette.jpg', 'Creamy Chicken Pasta': '/images/hero/dish-pasta.jpg', 'Beef Burger & Fries': '/images/hero/dish-burger.jpg', 'Chocolate Fondant': '/images/hero/dish-fondant.jpg',
    "Camellia Signature Latte": "/images/hero/dish-latte.jpg",
    "Rwandan Single-Origin Pour Over": "/images/hero/dish-pourover.jpg",
    "Iced Mocha": "/images/hero/dish-icedmocha.jpg",
    "African Spiced Tea": "/images/hero/dish-tea.jpg",
    "Banana & Cinnamon Cake": "/images/hero/dish-banana-cake.jpg",
    "Tropical Fruit Platter": "/images/hero/dish-fruitplatter.jpg",
    "Passion Fruit Juice": "/images/hero/dish-passionjuice.jpg",
    "Mango & Ginger Smoothie": "/images/hero/dish-smoothie.jpg",
    "Ginger Lemonade": "/images/hero/dish-lemonade.jpg"}


COMMENTS = [
    (5, "Exactly what I wanted — the recommender nailed it."),
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
            for dish in db.scalars(select(Dish)).all():
                wanted = IMAGES.get(dish.name)
                if wanted and not dish.image_url:
                    dish.image_url = wanted
                    filled += 1
            if filled:
                db.commit()
                print(f"Database already seeded — backfilled {filled} missing dish image(s).")
            else:
                print("Database already seeded — nothing to do. Use --reset to rebuild.")
            return

        categories: dict[str, Category] = {}
        for name, description, order in CATEGORIES:
            category = Category(name=name, description=description, sort_order=order)
            db.add(category)
            categories[name] = category
        db.flush()

        dishes: list[Dish] = []
        for row in DISHES:
            (name, category, price, cuisine, occasions, veg, vegan, halal, gf, spice,
             ingredients, allergens, prep, calories, popularity, tone, description, *rest) = row
            dish = Dish(
                name=name, description=description, category_id=categories[category].id, price_rwf=price,
                cuisine=cuisine, occasions=occasions, is_vegetarian=veg, is_vegan=vegan, is_halal=halal,
                is_gluten_free=gf, spice_level=spice, ingredients=ingredients, allergens=allergens,
                prep_minutes=prep, calories=calories, popularity_seed=popularity, art_tone=tone,
                image_url=IMAGES.get(name),
                is_available=True, is_signature=bool(rest and rest[0]),
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
