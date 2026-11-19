# Dietary labels — needs the restaurant's confirmation

**Why this file exists.** The AI recommender filters on diet. If it tells a
customer a dish is halal and it is not, that is a serious problem for them and
for Camellia. The printed menu does not state halal status, gluten content or
vegan suitability for anything, so those labels were assigned conservatively
from the listed ingredients and **must be confirmed by the restaurant before
this site is shown to customers.**

---

## How each label was set

| Label | Rule used | Set on |
|---|---|---|
| **Vegan** | The ingredients listed cannot contain an animal product. Practically: single-fruit and single-vegetable juices, black tea, soda, water. | 39 dishes |
| **Vegetarian** | The listed ingredients contain no meat or fish. Eggs and dairy allowed. | 100 dishes |
| **Halal** | **Never set. Not on any dish.** | 0 dishes, deliberately |
| **Gluten free** | Only where nothing baked, battered, or thickened appears. | 67 dishes |

### Halal is deliberately empty

Camellia's halal certification status is not stated anywhere on the menu, and it
is not something that can be inferred from a recipe. Until the restaurant
confirms, every dish is marked *not halal*, which means **the halal filter will
return nothing**. That is the safe failure: a customer who selects halal gets no
dish rather than a wrong one.

**Action:** if Camellia holds halal certification, tell us which dishes are
covered and the filter turns on properly.

---

## What to check, by section

Work down this list with the kitchen. Mark each item **yes**, **no**, or
**unsure** for vegan, vegetarian and halal.

### Breakfast (6 dishes)
- [ ] Spanish Omelette — has eggs and potatoes, no meat listed
- [ ] Chipati Omelette — chapati may contain ghee or butter
- [ ] Special Omelette — depends on the three fillings chosen
- [ ] Create Your Omelette — depends on fillings
- [ ] Camellia Steak Omelette — contains beef
- [ ] Camellia Executive Breakfast — contains sausage and bacon

**Key question: are the chipatis made with butter or ghee?**

### Soups (5 dishes)
- [ ] Minestrone Chicken — contains chicken stock
- [ ] Minestrone Fish — contains fish and cream
- [ ] Local Mushroom — contains cream
- [ ] Vegetable — **is the stock vegetable, or is chicken stock used?**
- [ ] Mixed Soup — combination of the above

**Key question: is the vegetable soup made with vegetable stock or chicken stock?**

### Salads (4 dishes)
- [ ] Fresh Garden Mix — has boiled egg and cheese
- [ ] American Garden — has boiled egg, honey mustard
- [ ] Beef Strips — contains beef, soy sauce, sesame
- [ ] Camellia Chef Salad — contains beef ham

**Key question: is the vinaigrette made with any animal product?**

### Sandwiches (6 dishes)
- [ ] Mushroom Avocado Spinach Baguette — no meat listed
- [ ] Egg Cheese Baguette — egg and cheese
- [ ] Tramazzin Chicken Cheese — contains chicken
- [ ] Croque Madame — egg and cheese
- [ ] Croque Monsieur — contains ham (**pork — affects halal**)
- [ ] Camellia Nice Face — contains chicken

**Key question: does the ham in Croque Monsieur contain pork?**

### Burgers (6 dishes)
- [ ] Vegetable Burger — **is the patty egg-bound? Is the cheese dairy?**
- [ ] Cheese Beef Burger — contains beef
- [ ] Chicken Cheese Burger — contains chicken
- [ ] Fish Burger — contains fish
- [ ] Plain Burger — depends on choice of patty
- [ ] King Burger — depends on choice of patty

**Key question: is the beef supplied from a halal-certified source?**

### Light Dishes (7 dishes)
- [ ] French Fries Salad — chips and salad, fries may share a fryer with meat
- [ ] Spaghetti Bolognaise — contains minced beef
- [ ] Camellia Chipati Wrap — depends on filling
- [ ] Fried Chicken Wings — contains chicken
- [ ] Fish Fingers — contains fish, battered (**gluten**)
- [ ] Chicken Nuggets — contains chicken, coated (**gluten**)
- [ ] Beef Sausage — contains beef

**Key question: are chips fried in a separate fryer from meat?**

### Kingsize Meals (7 dishes)
All contain meat or fish except none — check each sauce for alcohol or stock.

### Mexican & Pilau (3 dishes)
- [ ] Quesadillas — cheese and choice of filling
- [ ] Fajita Platter — choice of filling
- [ ] Pilau — choice of beef, chicken or fish

### Asian Curries (4 dishes)
- [ ] Vegetable Curry — **is the curry sauce made with fish sauce?**
- [ ] Beef / Fish / Chicken Curry — contain meat or fish

**Key question: does the curry sauce base contain fish sauce or shrimp paste?**

### Drinks (69 dishes)
Mostly straightforward. The ones that need checking:

- [ ] **Shakes and smoothies** — made with dairy ice cream. Not vegan, not dairy-free.
- [ ] **Oreo Shake** — Oreo biscuits contain gluten.
- [ ] **Add Honey** — honey is not considered vegan by most definitions.
- [ ] **Mojitos** — confirm they are genuinely alcohol-free ("virgin" implies it).
- [ ] **Create Your Own Juice** — confirm no milk or ice cream is added by default.

---

## After confirmation

Send back the answers and the labels get corrected in `backend/menu_data.py`.
Every change is one line per dish. The AI filters pick it up automatically
because they read the same fields.

Until then, the safe defaults stand: **nothing is marked halal**, and vegan is
only claimed where an animal product is impossible.
