# Test Results — Camelia AI Menu v1.0

**Date:** 11 November 2026
**Environment:** Python 3.11.2 · Node.js 22.22.3 · SQLite (test database in the OS temp folder)
**Commands:**

```bash
cd backend && pytest -q
cd frontend && npm run build
```

---

## 1. Automated backend tests

```
215 passed in 9.56s
```

The test module points `DATABASE_URL` at a temporary SQLite file, so running the suite never
touches the developer's local `camelia.db`. Each module start seeds the full menu.

| # | Area | Test | Expected | Result |
|---|---|---|---|---|
| 1 | Health | `test_health` | `status=ok`, database connected | PASS |
| 2 | Compatibility | `test_legacy_menu_endpoint_keeps_its_shape` | old `/api/menu` still returns items with prices | PASS |
| 3 | Seed | `test_menu_is_seeded_with_the_real_camelia_menu` | 17 sections, expected catalog size, names align | PASS |
| 4 | Menu | `test_dish_filters` | vegan / price / search filters correct | PASS |
| 5 | Diet | `test_halal_filter_is_honest_while_unconfirmed` | no dish claims halal before Camelia confirms | PASS |
| 6 | Menu | `test_unknown_dish_returns_404` | 404 for missing dish | PASS |
| 7 | Auth | `test_register_and_login` | 201 on register, 409 on duplicate, `/me` works | PASS |
| 8 | Auth | `test_self_registration_cannot_create_an_admin` | requested `admin` role ignored | PASS |
| 9 | Auth | `test_bad_password_is_rejected` | 401 | PASS |
| 10 | Auth | `test_protected_routes_require_a_token` | 401 without token | PASS |
| 11 | Auth | `test_customer_cannot_reach_admin_routes` | 403 for customers | PASS |
| 12 | AI | `test_recommend_returns_five_ranked_dishes` | 5 results, descending scores, reasons present, logged | PASS |
| 13 | AI | `test_vegetarian_quiz_never_returns_meat` | every result vegetarian | PASS |
| 14 | AI | `test_vegan_and_gluten_free_quizzes_respect_the_filter` | filters hold | PASS |
| 15 | AI | `test_halal_quiz_excludes_pork_dishes` | no pork reaches a halal request | PASS |
| 16 | AI | `test_budget_influences_ranking` | low-budget quiz topped by a cheap dish | PASS |
| 17 | AI | `test_eligibility_rules_are_pure_functions` | diet/availability rules | PASS |
| 18 | AI | `test_recommender_handles_an_empty_menu` | empty menu returns empty list, no crash | PASS |
| 19 | AI | `test_quiz_meta_exposes_weights` | quiz vocabulary and weights served | PASS |
| 20 | Ratings | `test_customer_can_rate_a_dish_once` | second rating updates, does not duplicate | PASS |
| 21 | Ratings | `test_rating_must_be_between_1_and_5` | 422 outside the range | PASS |
| 22 | Ratings | `test_favourites_toggle` | add then remove | PASS |
| 23 | Orders | `test_order_is_priced_server_side` | client-sent price ignored | PASS |
| 24 | Orders | `test_order_with_unknown_dish_is_rejected` | 404 | PASS |
| 25 | Orders | `test_customer_only_sees_their_own_orders` | isolation between customers | PASS |
| 26 | Orders | `test_order_status_flow_for_admin` | pending → preparing → ready → completed | PASS |
| 27 | Orders | `test_customer_cannot_set_order_status` | 403 | PASS |
| 28 | Orders | `test_cancel_rules` | only pending can be cancelled | PASS |
| 29 | Admin | `test_admin_can_create_update_and_retire_a_dish` | full lifecycle | PASS |
| 30 | Admin | `test_dish_with_order_history_is_retired_not_deleted` | history preserved | PASS |
| 31 | Admin | `test_customer_cannot_modify_the_menu` | 403 | PASS |
| 32 | Analytics | `test_analytics_reflects_data` | totals match seeded data | PASS |
| 33 | Analytics | `test_recommendation_logs_are_recorded` | each quiz logged | PASS |
| 34 | Analytics | `test_choice_can_be_recorded_against_a_log` | conversion recorded | PASS |
| 35 | Search | `test_search_returns_what_was_asked_for` ×4 | a named thing comes back first | PASS |
| 36 | Search | `test_a_single_food_word_returns_that_kind_of_dish` ×13 | coffee, tea, juice, breakfast, dinner, burger, soup, salad, chicken, fish, beef, shake, dessert all return that kind of dish | PASS |
| 37 | Search | `test_search_honours_dietary_language` | "no meat" never returns meat | PASS |
| 38 | Search | `test_search_reports_what_it_understood` | the parse is shown back to the customer | PASS |
| 39 | Search | `test_search_never_crashes_on_unrecognised_text` | no 500 on any parseable value | PASS |
| 40 | Roles | `test_registration_cannot_self_assign_a_role` | role ignored on register | PASS |
| 41 | Roles | `test_admin_cannot_demote_themselves` | 409 | PASS |
| 42 | Roles | `test_customer_cannot_promote_anyone` | 403 | PASS |
| 43 | Roles | `test_kitchen_can_see_orders` | 200 | PASS |
| 44 | Roles | `test_kitchen_cannot_manage_the_menu` | 403 | PASS |
| 45 | Roles | `test_kitchen_cannot_see_analytics` | 403 | PASS |
| 46 | Roles | `test_customer_cannot_see_orders` | 403 | PASS |
| 47 | Payment | `test_order_records_payment_method_and_starts_unpaid` | cash / momo / card accepted, starts `unpaid` | PASS |
| 48 | Payment | `test_admin_can_mark_payment_received` | only an admin may mark paid | PASS |
| 49 | Metric | `test_analytics_reports_recommendation_effectiveness` | chosen ÷ quizzes reported | PASS |

The count in the header (215) is the number of collected test runs; parametrised
tests appear once each in the table above because they are one behaviour.

---

## 2. Frontend build

```
✓ built in 2.27s
dist/assets/index-*.js   327.00 kB │ gzip: 95.74 kB
dist/assets/index-*.css   81.37 kB │ gzip: 13.19 kB
```

TypeScript strict mode compiles with no errors and Vite reports no warnings.

---

## 3. Browser checks

| Page | Check | Result |
|---|---|---|
| `/menu` | The full demo menu rendered, with no horizontal overflow at 1440px, no broken images, no console errors | PASS |
| `/menu` | Category chips, diet filter, price band and search all narrow the list | PASS |
| `/` | Hero, story, signature dishes and footer photograph | PASS |
| Quiz | Six questions, results carry reasons, choice is recorded | PASS |

---

## 4. What the tests deliberately do not claim

- **Halal.** There is no halal-certified dish, and the suite asserts the filter stays
  empty until the restaurant confirms certification. An empty filter is the honest result,
  not a bug.
- **Dietary labels** are marked only where the ingredients prove them. The open questions
  are listed in `docs/DIETARY-REVIEW.md`.
- **Payment.** Nothing is charged. The tests verify that the order records how the guest
  intends to pay and that only an admin can mark it received.
