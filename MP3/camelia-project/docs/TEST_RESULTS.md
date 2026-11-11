# Test Results — Camelia AI Menu v1.0

**Date:** 11 November 2026
**Environment:** Python 3.11.2 · Node.js 22.22.3 · SQLite (test database in the OS temp folder)
**Commands:**

```bash
cd MP3/camelia-project/backend && pytest -q
cd MP3/camelia-project/frontend && npm run build
```

---

## 1. Automated backend tests

```
33 passed in 6.01s
```

The test module points `DATABASE_URL` at a temporary SQLite file, so running the suite never
touches the developer's local `camelia.db`. Each module start seeds the full demo data set.

| # | Area | Test | Expected | Result |
|---|---|---|---|---|
| 1 | Health | `test_health` | `status=ok`, database connected | PASS |
| 2 | Compatibility | `test_legacy_menu_endpoint_keeps_its_shape` | old `/api/menu` still returns items with prices | PASS |
| 3 | Seed | `test_menu_is_seeded_with_six_categories_and_26_dishes` | 6 categories, 26 dishes, names align | PASS |
| 4 | Menu | `test_dish_filters` | vegan / price / search filters correct | PASS |
| 5 | Menu | `test_unknown_dish_returns_404` | 404 for missing dish | PASS |
| 6 | Auth | `test_register_and_login` | 201 on register, 409 on duplicate, `/me` works | PASS |
| 7 | Auth | `test_self_registration_cannot_create_an_admin` | requested `admin` role ignored | PASS |
| 8 | Auth | `test_bad_password_is_rejected` | 401 | PASS |
| 9 | Auth | `test_protected_routes_require_a_token` | 401 without token | PASS |
| 10 | Auth | `test_customer_cannot_reach_admin_routes` | 403 for customers | PASS |
| 11 | AI | `test_recommend_returns_five_ranked_dishes` | 5 results, descending scores, reasons present, logged | PASS |
| 12 | AI | `test_vegetarian_quiz_never_returns_meat` | every result vegetarian | PASS |
| 13 | AI | `test_vegan_and_gluten_free_quizzes_respect_the_filter` | filters hold | PASS |
| 14 | AI | `test_halal_quiz_excludes_pork_dishes` | Akabenzi omelette & Big Breakfast excluded | PASS |
| 15 | AI | `test_budget_influences_ranking` | low-budget quiz topped by ≤ RWF 9,500 | PASS |
| 16 | AI | `test_eligibility_rules_are_pure_functions` | diet/availability rules | PASS |
| 17 | AI | `test_recommender_handles_an_empty_menu` | empty result, no crash | PASS |
| 18 | AI | `test_quiz_meta_exposes_weights` | weights sum to 1.0 | PASS |
| 19 | Ratings | `test_customer_can_rate_a_dish_once` | second rating updates the first | PASS |
| 20 | Ratings | `test_rating_must_be_between_1_and_5` | 422 for 9 stars | PASS |
| 21 | Ratings | `test_favourites_toggle` | add then remove | PASS |
| 22 | Orders | `test_order_is_priced_server_side` | total recomputed from DB prices | PASS |
| 23 | Orders | `test_order_with_unknown_dish_is_rejected` | 404 | PASS |
| 24 | Orders | `test_customer_only_sees_their_own_orders` | no leakage | PASS |
| 25 | Orders | `test_order_status_flow_for_admin` | pending → completed; invalid status 422 | PASS |
| 26 | Orders | `test_customer_cannot_set_order_status` | 403 | PASS |
| 27 | Orders | `test_cancel_rules` | cancel once, 409 the second time | PASS |
| 28 | Admin | `test_admin_can_create_update_and_retire_a_dish` | create, duplicate 409, patch, hide, delete | PASS |
| 29 | Admin | `test_dish_with_order_history_is_retired_not_deleted` | retire, order history preserved | PASS |
| 30 | Admin | `test_customer_cannot_modify_the_menu` | 403 | PASS |
| 31 | Analytics | `test_analytics_reflects_data` | KPIs and 7-day series populated | PASS |
| 32 | Analytics | `test_recommendation_logs_are_recorded` | counter increments per quiz | PASS |
| 33 | Evaluation | `test_choice_can_be_recorded_against_a_log` | chosen dish stored | PASS |

### Coverage by risk

| Risk | Guards |
|---|---|
| A dietary requirement ignored | tests 12–16 — diet is a filter, checked before scoring |
| Prices tampered with in the browser | test 22 — totals recalculated server-side |
| Customer reaching admin data | tests 10, 30 — 403 on every admin route |
| Order history lost when a dish changes | test 29 — retire instead of delete, price snapshots |
| Recommender crashing on a small corpus | tests 15–17 |
| Demo data fabricating evaluation claims | tests 31–33 plus honest labelling in the UI |

---

## 2. Frontend build

```
tsc -b && vite build
✓ built in 3.76s
dist/assets/index-*.js   276.43 kB │ gzip: 80.47 kB
dist/assets/index-*.css   61.58 kB │ gzip: 10.40 kB
```

TypeScript strict mode, `noUnusedLocals` and `noUnusedParameters` are enabled — the build fails
on any unused variable, so a green build is meaningful.

---

## 3. Manual acceptance checks (browser)

Performed against the running dev server (Vite 5173 → FastAPI 9000), Chromium headless,
1440×960 and 390×844 viewports.

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Home page loads | VELO hero, white logo in header, 3 signature dishes | PASS |
| 2 | Mobile home (390 px) | single column, hamburger menu, hero image below copy | PASS |
| 3 | Menu page | 26 dishes, 4-column grid, filters and sort work | PASS |
| 4 | Search "tilapia" | 1 result | PASS |
| 5 | Quiz: vegetarian → medium → mid → Rwandan → date | 16 eligible, all vegetarian, top 5 scored 37–57 | PASS |
| 6 | Quiz result bars | similarity / preference / popularity / occasion rendered | PASS |
| 7 | Add recommendation to order | item lands in cart, `chosen_dish_id` logged | PASS |
| 8 | Cart | quantity controls, total matches price × quantity | PASS |
| 9 | Pre-order without login | button reads "Sign in to pre-order" and routes to login | PASS |
| 10 | Dish detail | ingredients and allergens no longer overlap, tints fixed | PASS |
| 11 | Rating submit | review appears immediately, average updates | PASS |
| 12 | Orders page | pipeline tracker, cancel visible only while pending/accepted | PASS |
| 13 | Customer opens `/admin` | redirected home (no admin UI leaked) | PASS |
| 14 | Admin overview | 9 orders, RWF 133,900 revenue, 7-day chart bars visible | PASS |
| 15 | Admin orders | status buttons update the order in place | PASS |
| 16 | Admin menu CRUD | create/edit modal saves and refreshes the table | PASS |
| 17 | Console | no JavaScript errors on any page visited | PASS |

### Bugs found and fixed during acceptance

| Bug | Cause | Fix |
|---|---|---|
| 7-day bar chart rendered empty | percentage heights inside an auto-height flex parent | compute pixel heights from the maximum |
| Ingredients ran into the Allergens column | unbroken comma list | `break-words` and comma spacing |
| Thumbnails showed "01 / THE MENU" overlapping | decorative label not optional | `showLabels={false}` for small art |
| Pork dishes marked halal | seed data error | Big Breakfast and Akabenzi omelette set `is_halal = false` |
| Admin link "API documentation" 404 | pointed at the frontend origin | link to the backend `/docs` URL |
| Header logo appeared with a large empty gap | supplied PNG has wide transparent padding | trimmed copies `logo-orange.png` / `logo-white.png` |

---

## 4. Recommendation output samples (for the report)

Halal · hot · mid budget · Rwandan · celebration — 24 dishes eligible after the halal filter:

| Rank | Dish | Score | Leading reason |
|---|---|---|---|
| 1 | Goat Brochette | 72.3 | halal, properly hot, great for celebration |
| 2 | Chicken Brochette | 66.2 | halal, within the RWF 6,000–11,000 budget |
| 3 | Grilled Tilapia | 60.2 | halal, Rwandan cuisine, celebration |
| 4 | Sambaza Platter | 60.0 | halal, within budget |
| 5 | Beef Brochette | 57.4 | halal, within budget |

Vegan · medium · mid budget · any cuisine · date night — 7 dishes eligible:

| Rank | Dish | Score |
|---|---|---|
| 1 | Rwandan Single-Origin Pour Over | 61.2 |
| 2 | Camelia Garden Salad | 50.7 |
| 3 | Passion Fruit Juice | 45.4 |

**Interpretation for the write-up:** the vegetarian result set (16 dishes) is larger than the
vegan set (7) because only restaurant-verified labels count. Scores are compressed (roughly
40–72) because four weighted signals are averaged and no dish is perfect on all of them —
that is expected behaviour, not a defect. Absolute scores matter less than the ordering.

---

## 5. What is NOT tested yet

- Usability with real Camelia customers (planned: 5–10 participants, ease score /10).
- Load and concurrency beyond the single-worker development server.
- PostgreSQL-specific behaviour (the suite runs on SQLite; the models are portable but the
  deployed database has not been exercised).
- Cross-browser testing on iOS Safari and Android Chrome on physical devices.
- Accessibility audit with a screen reader (keyboard focus styles and semantic landmarks are in place).
