# Camellia AI Menu — Project Status

**AI-based menu recommendation system · Case study: Camellia Café & Restaurant, Kigali**

Last updated: 19 November 2026 · Commit `ad4d9ab`

---

## 1. What this is

A customer answers five quick questions (diet, spice, budget, cuisine, occasion). A hybrid
AI ranker scores every available dish and returns the **top five**, each with a match score
and a plain-English reason. The restaurant manages the menu, orders and analytics from an
admin dashboard.

---

## 2. Technology

| Layer | Technology |
|---|---|
| Frontend | React 18.3.1, Vite 5.4.11, TypeScript, Tailwind CSS 4.3.5 |
| Backend | FastAPI 0.115.12, SQLAlchemy 2.0.57, scikit-learn 1.9.1 |
| Authentication | JWT (HS256), bcrypt password hashing |
| Database | SQLite locally, PostgreSQL in production |
| Tests | 67 backend tests, pytest |

---

## 3. The AI recommender

This is the academically important part, so it is described precisely.

**It is a hybrid content-based ranker, not a neural network.** Four signals are blended
into one score:

| Signal | Weight | What it measures |
|---|---|---|
| Taste profile match | 40% | TF-IDF text similarity between the customer's answers and the dish description, tags and ingredients |
| Preference rules | 25% | Explicit matches on cuisine, category, spice tolerance, portion and occasion |
| Popularity | 20% | Rating average blended with number of ratings |
| Occasion fit | 15% | Whether the dish suits the stated occasion |

**Dietary needs are hard filters, not scores.** If a customer says halal, a non-halal dish
is removed before ranking and can never appear, however well it scores. The same applies to
vegan and vegetarian.

Every recommendation carries a **human-readable reason**, so the customer sees why a dish
was suggested instead of being handed an unexplained list.

Quiz submissions are logged, which is what the admin analytics are built on.

---

## 4. Screens built (12)

| Screen | Route | What it does |
|---|---|---|
| Home | `/` | Full-bleed hero, story carousel, signature dishes, AI explainer, testimonial |
| Menu | `/menu` | Full 130-dish menu with category filter, search and sort |
| Dish detail | `/menu/:id` | One dish, ingredients, diet badges, ratings, add to basket |
| Quiz | `/recommend` | The five-question flow |
| Results | `/recommend` | Top five with score and reason |
| How it works | `/how-it-works` | Explains the ranking model to a customer |
| Our story | `/our-story` | Restaurant story and team |
| Contact | `/contact` | Address, opening hours |
| Cart | `/cart` | Basket, pickup time, place order |
| My orders | `/orders` | Customer order history |
| Login / register | `/login` | Customer and admin authentication |
| Admin | `/admin` | Dish CRUD, orders, ratings, analytics |

Plus `/privacy`.

---

## 5. Database (8 tables)

`users` · `categories` · `dishes` · `orders` · `order_items` · `ratings` · `favourites` ·
`recommendation_logs`

Seeded with 130 dishes across 16 sections, each with its own photograph.

---

## 6. Working end to end

- Five-question quiz producing a ranked top five with scores and reasons
- Hard dietary filters that cannot be bypassed by a high score
- Menu browsing with filter, search and sort
- Ratings and favourites, signed-in customers only
- Basket and pre-order with pickup time
- Order history per customer
- Admin: dish create/edit/delete, orders, ratings, analytics
- Role-based access: admin routes reject customers, customer routes require sign-in
- Three languages: **English, Kinyarwanda, French**, remembered between visits
- Responsive 390px to 1440px, verified with no horizontal overflow
- Accessibility: reduced motion respected, visible focus states, ARIA labels

---

## 7. Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@camelia.rw` | `Admin123` |
| Customer | `customer@camelia.rw` | `Customer123` |
| Kitchen | `kitchen@camelia.rw` | `Kitchen123` |

---

## 8. Running it

```bash
cd ~/Documents/Desktop/camelia-ai-menu
./start.sh
```

Site http://localhost:5173 · API docs http://localhost:9000/docs

`./start.sh --reset` rebuilds the demo database from scratch.

---

## 9. What is real, what is placeholder

This section exists because it matters if the project is shown to the restaurant.

**Real and working:** everything in section 6, the recommender, the database,
authentication and the admin tools.

**Placeholder, replace before showing Camellia:**

| Item | Status |
|---|---|
| Dish names, sections, prices | **Real.** Transcribed from photographs of the printed menu |
| Dish descriptions | The printed detail line where the menu gives one, otherwise a plain description of the dish |
| Dish photographs | Being replaced by one picture per dish; the restaurant's own photos replace them before launch |
| Dietary labels | Marked only where the ingredients make it certain. See `docs/DIETARY-REVIEW.md` |
| Halal | **Deliberately blank.** Nothing is marked halal until Camellia confirms certification |
| Team names and photographs | Invented |
| Testimonial quote | Invented |
| Address, phone, opening hours | Placeholder |
| `admin@` / `customer@` / `hello@camelia.rw` | Placeholder addresses, not real mailboxes |

The menu as built holds 130 dishes in 16 sections, priced 500 to 41,500 RWF,
with nine of them marked as signature dishes.

---

## 10. Known gaps

- **Photographs are being filled in, dish by dish.** Every dish is on its way to having
  its own picture; until a dish has one it shows generated art rather than a borrowed
  photograph of a different dish. The restaurant's own photography should replace all of
  them before service.
- **Some printed sections are not modelled.** The menu photographs also showed fresh fruit,
  iced frappés as a section of their own, sides and sauces, and snacks. Those were folded
  into other sections or left out. If Camellia wants full fidelity to the printed menu,
  these are the four to add.
- **Dietary labels need the restaurant to confirm them.** The questions are written out,
  section by section, in `docs/DIETARY-REVIEW.md`. Until they are answered the labels stay
  conservative, which means the halal filter is correctly empty rather than wrong.
- **The newsletter form has no backend endpoint.** It looks correct and submitting does
  nothing, so no address is ever stored.
- **Translation is partial.** Navigation, footer, home page and menu headings are translated;
  dish descriptions and some secondary pages are English only.
- **Not deployed.** It runs locally. `render.yaml` and `vercel.json` are ready but nothing is
  live.

---

## 11. Documented elsewhere

| Document | Covers |
|---|---|
| `docs/SCHEMA.md` | Full database design |
| `docs/DATABASE-DESIGN.md` | Table-by-table rationale |
| `docs/TEST_RESULTS.md` | The 67 tests and how to run them |
| `docs/PAYMENT-EXPLAINED.md` | Why payment is simulated, in plain words |
| `docs/DIETARY-REVIEW.md` | The dietary questions Camellia needs to answer |
| `docs/HANDOVER.md` | Where everything lives |
| `docs/RUN-FIRST.md` | Setup and troubleshooting |
| `BUILD-PLAN.md` | Original phased plan |
| `README.md` | Quick start |
