# Camelia AI Menu

**AI-based menu recommendation system · Case study: Camelia Café & Restaurant, Kigali.**

A customer answers five quick questions — diet, spice, budget, cuisine, occasion — and a
hybrid AI ranker scores every available dish, returning the top five with a match score and
a plain-English reason. The restaurant manages the menu, orders and analytics from an admin
dashboard.

Stack: **React 18 + Vite + TypeScript + Tailwind CSS 4** · **FastAPI + SQLAlchemy + scikit-learn**
· **SQLite locally / PostgreSQL in production**.

> Demo accounts — Admin: `admin@camelia.rw` / `Admin123` · Customer: `customer@camelia.rw` / `Customer123`.
> The dish names and prices are a realistic demo menu, not the restaurant's confirmed prices.

---

## What is built

| Area | Status |
|---|---|
| VELO-style landing page with the official Camelia logos | ✅ |
| Menu of 26 dishes in 6 categories, search + diet/price/category filters | ✅ |
| Dish detail: ingredients, allergens, allergens warning, spice, prep time | ✅ |
| **Hybrid AI recommender** (TF-IDF 40% · preferences 25% · popularity 20% · occasion 15%) | ✅ |
| Dietary requirements enforced as **hard filters** before ranking | ✅ |
| Ratings (1–5 + comment, one per customer per dish) and favourites | ✅ |
| Cart, pre-order with table number, server-side pricing | ✅ |
| Customer order tracking with kitchen status | ✅ |
| Admin: analytics dashboard, menu CRUD, order status management, customer list | ✅ |
| JWT auth with roles (customer / admin), bcrypt password hashing | ✅ |
| Quiz logging for evaluation (top-1 hit rate, top-5 conversion) | ✅ |
| 33 backend tests (`pytest`) | ✅ |
| Deployment to Vercel + Render + Neon | ⏳ documented, not executed |

### The recommender in one paragraph

Dishes are turned into text profiles (name, description, ingredients, cuisine, dietary
labels, spice words, occasion tags). The quiz answers become one more document. TF-IDF +
cosine similarity measures the content match (40%); rule checks score diet, spice distance,
budget and cuisine (25%); a Bayesian-ish blend of ratings and the curated popularity seed
scores demand (20%); occasion tags score the moment (15%). **Diet is a filter, not a score** —
a halal request can never surface a pork dish no matter how popular it is. The full
explanation is on the in-app `/how-it-works` page and in `backend/app/recommender.py`.

---

## Run it locally

Requirements: Node.js 20+, Python 3.10+. Docker is optional.

### Terminal 1 — backend (port **9000**)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate            # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python seed.py                       # 6 categories, 26 dishes, demo users, sample orders
uvicorn app.main:app --reload --port 9000
```

- API docs: http://localhost:9000/docs
- Health check: http://localhost:9000/api/health

The database is created and seeded automatically on first start, so `python seed.py` is only
needed if you want a fresh copy (`python seed.py --reset` rebuilds everything).

> Port 9000 is used because 8000 is frequently taken by other local services. If you prefer
> 8000, change `--port` here and `VITE_API_PROXY` in `frontend/vite.config.ts`.

### Terminal 2 — frontend (port **5173**)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to the backend on port 9000, so no CORS
configuration is needed in development.

### Checks

```bash
cd backend && pytest -q          # 33 tests
cd frontend && npm run build     # type-check + production bundle
```

---

## API overview

Interactive documentation with request/response schemas: `http://localhost:9000/docs`.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | — | Liveness + version |
| POST | `/api/auth/register` · `/api/auth/login` | — | Create customer / obtain JWT |
| GET | `/api/auth/me` | user | Current profile |
| GET | `/api/categories` | — | Six menu sections |
| GET | `/api/dishes` | — | Filters: `category`, `search`, `max_price`, `diet`, `occasion`, `sort` |
| GET | `/api/dishes/{id}` | — | Single dish with rating summary |
| GET | `/api/dishes/{id}/ratings` | — | Reviews, newest first |
| POST | `/api/dishes/{id}/ratings` | user | Create or update your rating |
| GET/POST | `/api/favourites` · `/api/favourites/{id}` | user | List / toggle |
| GET | `/api/recommend/meta` | — | Model weights + quiz option lists |
| POST | `/api/recommend?limit=5` | optional | Run the AI quiz (guests allowed, logged anonymously) |
| POST | `/api/recommend/{log}/choose/{dish}` | — | Record which suggestion was acted on |
| POST/GET | `/api/orders` | user | Pre-order / list my orders |
| POST | `/api/orders/{id}/cancel` | user | Cancel while still pending or accepted |
| GET | `/api/admin/orders` · PATCH `/api/admin/orders/{id}` | admin | Kitchen queue + status |
| POST/PATCH/DELETE | `/api/admin/dishes[/{id}]` | admin | Menu management (deletes retire instead) |
| GET | `/api/admin/customers` · `/api/admin/categories` | admin | Reference lists |
| GET | `/api/admin/analytics?days=7` | admin | KPIs, daily series, top dishes, quiz mix |

`GET /api/menu` is kept for backwards compatibility with the first prototype client.

---

## Project structure

```text
backend/
  app/
    main.py            FastAPI app, CORS, startup seeding
    config.py          Environment-driven settings
    database.py        Engine, session, Base
    models.py          Eight SQLAlchemy models
    schemas.py         Pydantic request/response models
    security.py        bcrypt hashing, JWT, role guards
    recommender.py     The hybrid AI (pure functions, unit-testable)
    serializers.py     Dish → API payload with rating aggregates
    routers/           auth · menu · recommendations · ratings · orders · admin
  seed.py              26-dish demo menu + demo users/orders/ratings
  tests/test_api.py    33 tests (isolated temp database)
frontend/
  src/
    pages/             Home · Menu · DishDetail · Recommend · HowItWorks · Login · Cart · Orders · Admin
    components/        Layout, Logo, DishCard, ui primitives, admin modal
    context/           AuthContext (JWT) · CartContext (localStorage)
    lib/               api client, types, presentation helpers
docs/
  SCHEMA.md            Implemented database schema (ERD + data dictionary)
  DATABASE-DESIGN.md   Earlier proposal, kept for the evolution record
```

---

## Deployment (free tier)

1. **Neon** — create a Postgres database, copy the connection string
   (`postgresql://user:pass@host/db?sslmode=require`).
2. **Render** — new Web Service from this repo, root directory `MP3/camelia-project/backend`:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Env: `DATABASE_URL`, `JWT_SECRET` (long random string), `CORS_ORIGINS=https://your-app.vercel.app`
   The service seeds the demo menu on first boot.
3. **Vercel** — new project, root directory `MP3/camelia-project/frontend`:
   - Build: `npm run build`, output `dist`
   - Env: `VITE_API_URL=https://your-render-service.onrender.com`
   - `vercel.json` rewrites all routes to `index.html` so client-side routing works.

Free tiers sleep after inactivity, so the first request after idle can take ~30 seconds.
The demo must also run fully offline from a laptop — fonts are self-hosted and no external
CDN or LLM is required.

---

## Notes for the write-up

- `docs/SCHEMA.md` is the implemented schema (ERD + data dictionary) — use it for the
  database chapter.
- Every quiz is logged in `recommendation_logs` together with which suggestion was chosen,
  so top-1 hit rate and top-5 conversion can be computed from real data rather than invented.
- Limitations to state honestly: 26-dish corpus, sparse ratings, no collaborative filtering
  yet, and demo traffic only until real customers are involved.
- The menu data is realistic but fictional; confirm prices and allergen information with the
  restaurant before any real use.
