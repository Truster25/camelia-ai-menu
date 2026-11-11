# Camelia menu recommendation system — build plan

**Status:** Proposed implementation plan. No application code, dataset, deployment or evaluation has been completed. Update this file and the handover document as work progresses.

## Goal

Build a responsive web application that helps restaurant customers discover suitable dishes and lets restaurant staff manage the menu and see orders. Make the recommendation logic understandable and demonstrable. Confirm the restaurant's name and the project's approved objectives when available.

## Scope for the first complete version

Customer:
- Browse and search a menu with prices, photos, ingredients, dietary information and availability.
- Select preferences, budget and dietary restrictions; receive recommendations with short explanations.
- Rate dishes, save favourites, and place a simple order using a table number.
- See a clear message when nothing matches.

Manager:
- Sign in; add, edit and disable dishes; update availability and photos.
- See and update order status and view basic counts and ratings.

Not in the first version: online payment, delivery, live stock management, native apps, multiple branches and LLM chat. An order is recorded for staff; integration into the restaurant's actual workflow must be confirmed. Use demo data until the restaurant provides permission and real information.

## Proposed stack

- Frontend: React, TypeScript, Vite, Tailwind CSS and shadcn/ui. Recharts only when the dashboard needs it.
- Backend: Python, FastAPI, SQLAlchemy and Alembic.
- Database: PostgreSQL.
- Recommendation: pandas and scikit-learn, implemented in the Python backend.
- Access: secure password hashing, role-based authorization and JWT sessions.
- Tests: pytest for backend and recommendation rules; Vitest for frontend logic. Add end-to-end tests if time permits.
- Development: Git, Docker Compose, environment variables and a documented database seed command.
- Deployment target: Vercel frontend, Render backend, Neon PostgreSQL and Cloudinary for images. Check current pricing and terms before selecting a plan.

## Architecture

A mobile-friendly React app calls the FastAPI API over HTTPS. The API validates requests and permissions, reads and writes PostgreSQL and invokes the recommendation service. Images may be stored in Cloudinary in the deployed version. Docker Compose runs the app and PostgreSQL locally for development and as a demonstration backup. An offline demo must be tested with local assets and without dependence on Cloudinary, hosted fonts, external APIs or a network connection.

## Recommendation design

1. Filter by availability and the customer's budget and dietary requirements. Never present missing ingredient or allergen data as safe; exclude or clearly warn about unknowns, as appropriate.
2. Use content similarity between dish attributes and the customer's stated preferences or liked dishes.
3. If enough real ratings exist, add an item-based collaborative signal based on similar users' rating patterns. Set a minimum data threshold and measure whether it adds value.
4. Use popularity as a fallback for new users or sparse data. Clearly label any popularity based on demo or simulated data.
5. Rank the eligible dishes with documented weights; show explanations supported by actual inputs, such as matching a stated preference. Keep filters separate from ranking.

A simple rules-plus-content baseline should work before collaborative filtering is added. If there are insufficient real ratings, keep the collaborative component experimental or disabled and explain the limitation. Do not claim simulated data represents actual restaurant behaviour.

## Initial data model

- User: account details, role and password hash.
- Dish: name, description, category, price, available status, image and structured ingredient/dietary information.
- Preference: user choices including budget and dietary requirements.
- Rating: user, dish, rating and timestamp.
- Favourite: user and dish.
- Order and order item: table number, status, timestamp, dish, quantity and price at order time.

Refine the schema after understanding the actual restaurant workflow; avoid collecting unnecessary personal information. Obtain consent for any interviews or customer data, and restrict access to identifiable data.

## Build sequence and completion checks

1. **Foundation:** repository structure, README, Compose services, frontend and backend health checks, configuration and a sample-data seed. Check: starts on a laptop from documented commands.
2. **Menu and manager access:** schema and migrations, menu API, login/roles, responsive browse/search and manager CRUD. Check: staff can manage dishes; customers can browse; unauthorized requests are rejected.
3. **Recommendations:** preference form, eligibility filters, content baseline, explanations and fallback. Check: unavailable or incompatible dishes do not appear and a new user gets a sensible fallback.
4. **Ratings, favourites and orders:** persist customer actions and provide a manager order view. Check: a full browse-to-order flow works and order status can be updated.
5. **Evaluation and polishing:** test cases and results, usability, accessibility, mobile screens, validation and security; compare against a simple baseline on a real held-out dataset if sufficient. Do not fabricate results; report data limitations. Add collaborative filtering only if justified by data and testing.
6. **Deployment and handover:** deploy, set production environment variables, verify access and backups; rehearse the demonstration both online and offline; document setup, user steps and known limitations.

Complete one working vertical slice at a time instead of building the entire UI before the API. Exact dates depend on the deadline and how quickly real information is available.

## Evidence for the student's book

As work happens, retain dated and accurate records of requirements, decisions, architecture and data-flow diagrams, ERD and schema, tool versions, UI screenshots, consent and collection methods, test inputs and actual outcomes, evaluation method and results, limitations, and deployment/setup instructions. Record what was actually built; update the handover document as facts change. The student writes her own paper and must be able to explain and demonstrate the project, subject to the supervisor's rules on outside assistance.

## Inputs to request in parallel

- Current proposal and objectives, submission and demonstration dates, and any mandated technologies.
- Restaurant contact and permission; current menu, prices, ingredients, dietary/allergen information and ordering workflow.
- Availability of existing ratings or consent to collect new ones; any hosting budget.

These inputs refine scope and real data; they do not prevent starting a clearly labelled sample-data prototype.

## Build progress — first prototype

- A responsive landing-page prototype uses the supplied Camellia logo and the dark editorial reference. The hero photo is AI-generated; the menu entries and prices are fictional.
- React + TypeScript frontend retrieves three sample items from a FastAPI endpoint. Backend health and menu endpoints have basic tests.
- A proposed entity/relationship design is in `docs/DATABASE-DESIGN.md`. PostgreSQL is not connected, and no database migration has been applied.
- Authentication, menu management, orders and the recommendation engine are not implemented yet. Next: implement PostgreSQL models/migrations and a real menu API, followed by manager access.

## Build progress — second prototype (v1.0, November 2026)

The vertical slices from the plan above are now implemented end to end.

**Done**
1. **Foundation** — SQLAlchemy models for the eight tables (`docs/SCHEMA.md`), seeded demo
   data (6 categories, 26 dishes, demo users, sample orders and ratings), environment-driven
   configuration (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`), health endpoint, 33 pytest tests.
2. **Menu and manager access** — menu API with search/filter/sort, dish detail API, JWT login
   with bcrypt hashing, role-based guards (customers receive 403 on every admin route),
   React market pages, and admin dish CRUD. Dishes with order history are retired, never
   deleted, so past orders keep their names and prices.
3. **Recommendations** — five-question quiz (diet, spice, budget, cuisine, occasion) feeding a
   hybrid ranker: TF-IDF cosine similarity 40%, preference rules 25%, popularity 20%,
   occasion 15%. Dietary requirements are hard filters applied before ranking. Each result
   carries a score breakdown and a plain-English reason. Weights are exposed by
   `GET /api/recommend/meta` so the interface never hardcodes the model.
4. **Ratings, favourites and orders** — one rating per customer per dish (updatable), favourites
   toggle, cart with server-side price calculation, table number and kitchen note, order status
   flow from `pending` to `completed`, customer tracking view and admin kitchen queue.
5. **Evaluation groundwork** — every quiz is written to `recommendation_logs` with the answers,
   ranked results and top score; choosing a recommendation records `chosen_dish_id`. That makes
   top-1 hit rate and top-5 conversion measurable from real traffic rather than estimated.
6. **Deployment preparation** — `render.yaml`, `frontend/vercel.json`, `.env.example` files and
   a deployment section in the README. Deployment itself has not been executed.

**Not done / next**
- Collaborative filtering: deliberately deferred until enough real ratings exist (the plan's
  minimum-data threshold), so keep it described as future work.
- Usability testing with real Camelia customers (5–10 participants) for Chapter 6.
- Screenshots, test-result tables and the final ERD export for the appendix.
- Confirm the menu, prices and allergen data with the restaurant before real use.

**Test result so far:** `pytest -q` → 33 passed. `npm run build` → clean TypeScript build.
Recommendations checked manually: vegan quiz returns only vegan dishes, halal quiz excludes the
two pork dishes, low-budget quiz is topped by an affordable plate.
