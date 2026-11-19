"""The Camellia menu as it is printed on paper.

This is a transcription, read off photographs of the printed menu. It is kept
separate from `menu_data.py` on purpose: if the same table were used to build
the menu and to check it, the check would always pass.

Every price the site shows is compared against this table, so a change to the
menu that was not first verified on the paper fails the test suite. If the
restaurant reprints the menu, this file is what gets updated first.

Source, page by page:

  Page 1  Soups, Camellia Salad Zone, Local fresh fruits
  Page 2  Camellia Light Dishes
  Page 3  Burgers & Sandwiches (cold and hot)
  Page 4  Camellia Kingsize Meals, Mexican Dishes, Pilau, Asian Dishes
  Page 5  Camellia Fresh Juices, Smoothies, Camellia Shakes, Virgin Mojito
  Page 6  Brewed & Special, Iced Frappes, Teas, Camellia Breakfast,
          Pastry, Soft Drinks, Ice Cream
"""

from __future__ import annotations

PRINTED_PRICES = {
    # Brewed & special
    "Espresso Single": 2000, "Black Coffee": 3000, "A Pot of Milk": 3000,
    "Espresso Double": 3000, "Espresso Macchiato": 2500, "Americano": 2500,
    "Cafe Latte": 3000, "Cappuccino": 3500, "Cafe Mocha": 3500,
    "Cinnamon Cappuccino": 4000, "Caramel Macchiato": 3500, "Vanilla Latte": 4500,
    "Hot Chocolate": 4000, "Coffee with Milk": 6000, "Tea with Milk": 6000,
    "Camellia African Coffee": 4000,
    # Iced frappes
    "Iced Americano": 5000, "Iced Tea": 5000, "Iced Spiced Tea": 5000,
    "Iced Cafe Latte": 5000, "Iced Vanilla Latte": 5500, "Iced Coffee Mocha": 8000,
    "Iced African Coffee": 5500, "Caramel Frappé": 6000, "Vanilla Frappé": 6000,
    "Mocha Frappé": 6000, "White Mocha Frappé": 6000,
    # Teas
    "Black Tea": 3000, "Ginger Tea": 3000, "Mint Tea": 3000, "Lemon Tea": 3000,
    "Green Tea": 3000, "Masala Tea": 3000, "Umwucakiyali": 3000,
    "Umuravumba": 3000, "Umwenya Tea": 3000, "Hibiscus Tea": 3000,
    "African Tea": 3500, "Spiced Tea": 4000,
    # Breakfast
    "Spanish Omelette": 5500, "Chipati Omelette": 6000, "Special Omelette": 6500,
    "Create Your Omelette": 7000, "Camellia Executive Breakfast": 11500,
    "Camellia Steak Omelette": 11500,
    # Soups and salads
    "Minestrone Chicken Soup": 6500, "Minestrone Fish Soup": 6500,
    "Camellia Local Mushroom Soup": 6500, "Vegetable Soup": 6500, "Mixed Soup": 7000,
    "Fresh Garden Mix Salad": 7000, "American Garden Salad": 7000,
    "Beef Strips Salad": 7000, "Camellia Chef Salad": 7000,
    # Sandwiches and burgers
    "Mushroom Avocado Spinach Baguette": 8500, "Camellia Egg Cheese Baguette": 8500,
    "Tramazzin Chicken Cheese": 8500, "Croque Madame": 8500, "Croque Monsieur": 8500,
    "Camellia Nice Face": 9000, "Plain Beef Chicken Fish Burger": 7000,
    "Camellia Vegetable Burger": 8000, "Camellia Cheese Beef Burger": 8500,
    "Chicken Cheese Burger": 8500, "Camellia Fish Burger": 8500,
    "Camellia King Beef Chicken Fish Burger": 41500,
    # Light dishes
    "French Fries Salad": 6000, "Spaghetti Bolognaise": 7000,
    "Camellia Chipati Wrap": 9000, "Fried Chicken Wings": 9000,
    "Fish Fingers": 9000, "Chicken Nuggets": 9000, "Beef Sausage": 9000,
    # Kingsize, Mexican, Asian
    "Camellia Hotpot": 12000, "Beef Chicken Fish Stew": 12000,
    "Stroganoff Beef Chicken Fish": 12000, "Chicken Leg": 12000,
    "Fish Fillet": 13500, "Beef Steak": 16000, "Sizzling Dish": 15500,
    "Quesadillas": 11500, "Fajita Platter": 11500, "Pilau": 12000,
    "Vegetable Curry": 10500, "Beef Curry": 11500, "Fish Curry": 11500,
    "Chicken Curry": 11500,
    # Juices, smoothies, shakes, mojito
    "Passion Juice": 5000, "Prune Juice": 5000, "Cucumber Juice": 4500,
    "Carrot Juice": 5000, "Watermelon Juice": 5000, "Papaya Juice": 5000,
    "Pineapple Juice": 5000, "Beetroot Juice": 5000, "Cocktail Juice": 6000,
    "Lemon Juice": 6500, "Mango Juice": 6500, "Detox Juice": 7000,
    "Orange Juice": 7000, "Apple Juice": 7000, "Prune Concentrate": 7000,
    "Create Your Own Juice": 8000,
    "Avocado Smoothie": 6000, "Diana Smoothie": 7000, "King Cocktail Smoothie": 7500,
    "Mango Breeze": 7000, "Shokrin": 7000, "Strawberry Breeze": 7000,
    "Vanilla Shake": 7000, "Chocolate Shake": 7000, "Strawberry Shake": 7000,
    "Caramel Shake": 7000, "Mango Shake": 7000, "Banana Shake": 7000,
    "Pineapple Shake": 7000, "Double Mocha Shake": 7500, "Oreo Shake": 7500,
    "Virgin Mojito": 6500, "Camellia Detox Juice": 7000,
    # Pastry, ice cream, soft drinks
    "Bar Cookies": 1000, "Plain Croissant": 1500, "Chocolate Cake": 1500,
    "Banana Cake": 1500, "Vanilla Cake": 1500, "Lemon Cake": 1500,
    "Black Forest": 2000, "Branded Cup": 500, "Add Honey": 1000,
    "Water": 1500, "Soda": 2500, "Ice Cream": 2500,
}

# Which printed page each dish was read from, so the transcription can be
# checked against the photographs without guessing.
PAGE = {}
for _name in ("Minestrone Chicken Soup", "Minestrone Fish Soup",
              "Camellia Local Mushroom Soup", "Vegetable Soup", "Mixed Soup",
              "Fresh Garden Mix Salad", "American Garden Salad",
              "Beef Strips Salad", "Camellia Chef Salad"):
    PAGE[_name] = 1
for _name in ("French Fries Salad", "Spaghetti Bolognaise", "Camellia Chipati Wrap",
              "Fried Chicken Wings", "Fish Fingers", "Chicken Nuggets", "Beef Sausage"):
    PAGE[_name] = 2
for _name in ("Mushroom Avocado Spinach Baguette", "Camellia Egg Cheese Baguette",
              "Tramazzin Chicken Cheese", "Croque Madame", "Croque Monsieur",
              "Camellia Nice Face", "Plain Beef Chicken Fish Burger",
              "Camellia Vegetable Burger", "Camellia Cheese Beef Burger",
              "Chicken Cheese Burger", "Camellia Fish Burger",
              "Camellia King Beef Chicken Fish Burger"):
    PAGE[_name] = 3
for _name in ("Camellia Hotpot", "Beef Chicken Fish Stew", "Stroganoff Beef Chicken Fish",
              "Chicken Leg", "Fish Fillet", "Beef Steak", "Sizzling Dish",
              "Quesadillas", "Fajita Platter", "Pilau", "Vegetable Curry",
              "Beef Curry", "Fish Curry", "Chicken Curry"):
    PAGE[_name] = 4
for _name in ("Passion Juice", "Prune Juice", "Cucumber Juice", "Carrot Juice",
              "Watermelon Juice", "Papaya Juice", "Pineapple Juice", "Beetroot Juice",
              "Cocktail Juice", "Lemon Juice", "Mango Juice", "Detox Juice",
              "Orange Juice", "Apple Juice", "Prune Concentrate", "Create Your Own Juice",
              "Avocado Smoothie", "Diana Smoothie", "King Cocktail Smoothie",
              "Mango Breeze", "Shokrin", "Strawberry Breeze",
              "Vanilla Shake", "Chocolate Shake", "Strawberry Shake", "Caramel Shake",
              "Mango Shake", "Banana Shake", "Pineapple Shake",
              "Double Mocha Shake", "Oreo Shake", "Virgin Mojito",
              "Camellia Detox Juice"):
    PAGE[_name] = 5
for _name in PRINTED_PRICES:
    PAGE.setdefault(_name, 6)
