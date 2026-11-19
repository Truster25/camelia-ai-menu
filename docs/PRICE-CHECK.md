# Price check against the printed menu

**For Camellia.** The whole menu, dish by dish: the price on the website beside
the price on the printed menu, with the page each was read from.

Nothing here is the app marking its own homework. The printed column is a
separate transcription (`backend/printed_prices.py`) that the menu data is
checked against. Please read it beside the paper menu. If a line is wrong, send
the dish and the correct price and it is a one-line change.

## How it stays honest

- All 136 prices are pinned by tests. Change a price in the app without changing
  the printed transcription and the suite fails, naming the dish.
- A second test fails if the app serves anything not on the printed menu.
- `python audit_menu.py` reproduces this report and fails loudly if they disagree.


## Page 1: Soups, Salad Zone, Local fresh fruits

| Dish | Printed | Website | |
|---|---:|---:|---|
| Camellia Local Mushroom Soup | 6,500 | 6,500 | same |
| Minestrone Chicken Soup | 6,500 | 6,500 | same |
| Minestrone Fish Soup | 6,500 | 6,500 | same |
| Vegetable Soup | 6,500 | 6,500 | same |
| American Garden Salad | 7,000 | 7,000 | same |
| Beef Strips Salad | 7,000 | 7,000 | same |
| Camellia Chef Salad | 7,000 | 7,000 | same |
| Fresh Garden Mix Salad | 7,000 | 7,000 | same |
| Mixed Soup | 7,000 | 7,000 | same |

## Page 2: Light Dishes

| Dish | Printed | Website | |
|---|---:|---:|---|
| French Fries Salad | 6,000 | 6,000 | same |
| Spaghetti Bolognaise | 7,000 | 7,000 | same |
| Beef Sausage | 9,000 | 9,000 | same |
| Camellia Chipati Wrap | 9,000 | 9,000 | same |
| Chicken Nuggets | 9,000 | 9,000 | same |
| Fish Fingers | 9,000 | 9,000 | same |
| Fried Chicken Wings | 9,000 | 9,000 | same |

## Page 3: Burgers & Sandwiches

| Dish | Printed | Website | |
|---|---:|---:|---|
| Plain Beef Chicken Fish Burger | 7,000 | 7,000 | same |
| Camellia Vegetable Burger | 8,000 | 8,000 | same |
| Camellia Cheese Beef Burger | 8,500 | 8,500 | same |
| Camellia Egg Cheese Baguette | 8,500 | 8,500 | same |
| Camellia Fish Burger | 8,500 | 8,500 | same |
| Chicken Cheese Burger | 8,500 | 8,500 | same |
| Croque Madame | 8,500 | 8,500 | same |
| Croque Monsieur | 8,500 | 8,500 | same |
| Mushroom Avocado Spinach Baguette | 8,500 | 8,500 | same |
| Tramazzin Chicken Cheese | 8,500 | 8,500 | same |
| Camellia Nice Face | 9,000 | 9,000 | same |
| Camellia King Beef Chicken Fish Burger | 41,500 | 41,500 | same |

## Page 4: Kingsize, Mexican, Pilau, Asian

| Dish | Printed | Website | |
|---|---:|---:|---|
| Vegetable Curry | 10,500 | 10,500 | same |
| Beef Curry | 11,500 | 11,500 | same |
| Chicken Curry | 11,500 | 11,500 | same |
| Fajita Platter | 11,500 | 11,500 | same |
| Fish Curry | 11,500 | 11,500 | same |
| Quesadillas | 11,500 | 11,500 | same |
| Beef Chicken Fish Stew | 12,000 | 12,000 | same |
| Camellia Hotpot | 12,000 | 12,000 | same |
| Chicken Leg | 12,000 | 12,000 | same |
| Pilau | 12,000 | 12,000 | same |
| Stroganoff Beef Chicken Fish | 12,000 | 12,000 | same |
| Fish Fillet | 13,500 | 13,500 | same |
| Sizzling Dish | 15,500 | 15,500 | same |
| Beef Steak | 16,000 | 16,000 | same |

## Page 5: Juices, Smoothies, Shakes, Mojito

| Dish | Printed | Website | |
|---|---:|---:|---|
| Cucumber Juice | 4,500 | 4,500 | same |
| Beetroot Juice | 5,000 | 5,000 | same |
| Carrot Juice | 5,000 | 5,000 | same |
| Papaya Juice | 5,000 | 5,000 | same |
| Passion Juice | 5,000 | 5,000 | same |
| Pineapple Juice | 5,000 | 5,000 | same |
| Prune Juice | 5,000 | 5,000 | same |
| Watermelon Juice | 5,000 | 5,000 | same |
| Avocado Smoothie | 6,000 | 6,000 | same |
| Cocktail Juice | 6,000 | 6,000 | same |
| Lemon Juice | 6,500 | 6,500 | same |
| Mango Juice | 6,500 | 6,500 | same |
| Virgin Mojito | 6,500 | 6,500 | same |
| Apple Juice | 7,000 | 7,000 | same |
| Banana Shake | 7,000 | 7,000 | same |
| Camellia Detox Juice | 7,000 | 7,000 | same |
| Caramel Shake | 7,000 | 7,000 | same |
| Chocolate Shake | 7,000 | 7,000 | same |
| Detox Juice | 7,000 | 7,000 | same |
| Diana Smoothie | 7,000 | 7,000 | same |
| Mango Breeze | 7,000 | 7,000 | same |
| Mango Shake | 7,000 | 7,000 | same |
| Orange Juice | 7,000 | 7,000 | same |
| Pineapple Shake | 7,000 | 7,000 | same |
| Prune Concentrate | 7,000 | 7,000 | same |
| Shokrin | 7,000 | 7,000 | same |
| Strawberry Breeze | 7,000 | 7,000 | same |
| Strawberry Shake | 7,000 | 7,000 | same |
| Vanilla Shake | 7,000 | 7,000 | same |
| Double Mocha Shake | 7,500 | 7,500 | same |
| King Cocktail Smoothie | 7,500 | 7,500 | same |
| Oreo Shake | 7,500 | 7,500 | same |
| Create Your Own Juice | 8,000 | 8,000 | same |

## Page 6: Coffee, Iced Frappes, Teas, Breakfast, Pastry, Drinks

| Dish | Printed | Website | |
|---|---:|---:|---|
| Branded Cup | 500 | 500 | same |
| Add Honey | 1,000 | 1,000 | same |
| Bar Cookies | 1,000 | 1,000 | same |
| Banana Cake | 1,500 | 1,500 | same |
| Chocolate Cake | 1,500 | 1,500 | same |
| Lemon Cake | 1,500 | 1,500 | same |
| Plain Croissant | 1,500 | 1,500 | same |
| Vanilla Cake | 1,500 | 1,500 | same |
| Water | 1,500 | 1,500 | same |
| Black Forest | 2,000 | 2,000 | same |
| Espresso Single | 2,000 | 2,000 | same |
| Americano | 2,500 | 2,500 | same |
| Espresso Macchiato | 2,500 | 2,500 | same |
| Ice Cream | 2,500 | 2,500 | same |
| Soda | 2,500 | 2,500 | same |
| A Pot of Milk | 3,000 | 3,000 | same |
| Black Coffee | 3,000 | 3,000 | same |
| Black Tea | 3,000 | 3,000 | same |
| Cafe Latte | 3,000 | 3,000 | same |
| Espresso Double | 3,000 | 3,000 | same |
| Ginger Tea | 3,000 | 3,000 | same |
| Green Tea | 3,000 | 3,000 | same |
| Hibiscus Tea | 3,000 | 3,000 | same |
| Lemon Tea | 3,000 | 3,000 | same |
| Masala Tea | 3,000 | 3,000 | same |
| Mint Tea | 3,000 | 3,000 | same |
| Umuravumba | 3,000 | 3,000 | same |
| Umwenya Tea | 3,000 | 3,000 | same |
| Umwucakiyali | 3,000 | 3,000 | same |
| African Tea | 3,500 | 3,500 | same |
| Cafe Mocha | 3,500 | 3,500 | same |
| Cappuccino | 3,500 | 3,500 | same |
| Caramel Macchiato | 3,500 | 3,500 | same |
| Camellia African Coffee | 4,000 | 4,000 | same |
| Cinnamon Cappuccino | 4,000 | 4,000 | same |
| Hot Chocolate | 4,000 | 4,000 | same |
| Spiced Tea | 4,000 | 4,000 | same |
| Vanilla Latte | 4,500 | 4,500 | same |
| Iced Americano | 5,000 | 5,000 | same |
| Iced Cafe Latte | 5,000 | 5,000 | same |
| Iced Spiced Tea | 5,000 | 5,000 | same |
| Iced Tea | 5,000 | 5,000 | same |
| Iced African Coffee | 5,500 | 5,500 | same |
| Iced Vanilla Latte | 5,500 | 5,500 | same |
| Spanish Omelette | 5,500 | 5,500 | same |
| Caramel Frappé | 6,000 | 6,000 | same |
| Chipati Omelette | 6,000 | 6,000 | same |
| Coffee with Milk | 6,000 | 6,000 | same |
| Mocha Frappé | 6,000 | 6,000 | same |
| Tea with Milk | 6,000 | 6,000 | same |
| Vanilla Frappé | 6,000 | 6,000 | same |
| White Mocha Frappé | 6,000 | 6,000 | same |
| Special Omelette | 6,500 | 6,500 | same |
| Create Your Omelette | 7,000 | 7,000 | same |
| Iced Coffee Mocha | 8,000 | 8,000 | same |
| Camellia Executive Breakfast | 11,500 | 11,500 | same |
| Camellia Steak Omelette | 11,500 | 11,500 | same |

## Summary

| | |
|---|---:|
| Dishes on the printed menu | 136 |
| Dishes the app serves | 136 |
| Prices that agree | 136 |
| Prices that differ | 0 |
| Printed but missing from the app | 0 |
| In the app but not printed | 0 |

## What the photographs did not settle

The **Snacks & desserts** list on page 6 is cut off in the photograph, so those
items are not in the app. The **Local fresh fruits** block on page 1 was legible after all and its four
dishes are now in the app. The **Snacks & desserts** line on page 6 is genuinely
cut off by the edge of the photograph and still needs a clearer one.
