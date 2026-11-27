# HANDOVER — Resume This Project in a New Chat (Read This First)

> **For the next Arena chat / developer:** the repo below is the single source of truth.
> Read this file, then `README.md`, then `docs/SCHEMA.md`. Do not start from scratch.

Last updated: **2026-11-19** · Version **1.0.0**

---

## Repo & links

- **GitHub:** https://github.com/Truster25/camelia-ai-menu (branch `main`)
- **Code lives in:** `/` (the repo root also holds unrelated earlier folders —
  `project/`, `sabba/`, `truster-technology` — ignore them for this project)
- **Backend:** `backend` — FastAPI on port **9000**
- **Frontend:** `frontend` — Vite dev server on port **5173**
- Live previews do not persist between chats: restart both servers (see below).

## Project in one paragraph

AI-based menu recommendation system — case study **Camelia Café & Restaurant, Kigali**.
A guest answers five questions (diet, spice, budget, cuisine, occasion) and a hybrid AI
ranker scores all 137 dishes: TF-IDF cosine similarity 40% + preference rules 25% +
popularity 20% + occasion 15%, with dietary needs applied as **hard filters before ranking**.
The guest gets the top five with scores and plain-English reasons, can rate dishes, save
favourites and pre-order with a table number. Admins manage the menu, orders and see
analytics. Landing page is VELO-style ("Made for moments worth savouring") using the official
Camelia logos.

## Stack (locked — do not change without supervisor approval)

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript + Tailwind CSS 4, Playfair Display + Inter (self-hosted via @fontsource) |
| Backend | Python 3.11 + FastAPI 0.115 + SQLAlchemy 2.0 + scikit-learn (TF-IDF) |
| Auth | JWT (python-jose) + bcrypt |
| DB | SQLite locally (`backend/camelia.db`), PostgreSQL in production (Neon) |
| Deploy | Vercel (frontend) + Render (backend) + Neon (DB) — prepared, not executed |

## Demo accounts

- **Admin:** `admin@camelia.rw` / `Admin123`
- **Customer:** `customer@camelia.rw` / `Customer123`
- Guests can browse the menu and take the quiz without an account.
- Six extra demo customers (`jean@example.rw` … password `Demo1234`) exist so analytics are not empty.

## Run it

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed.py                       # optional: tables + demo data are auto-created on boot
uvicorn app.main:app --reload --reload-dir app --port 9000
```

```bash
cd frontend
npm install
npm run dev                          # http://localhost:5173
```

Checks: `cd backend && pytest -q`  · `cd frontend && npm run build`.

## What is DONE ✅

- **Backend** — 8 tables (`docs/SCHEMA.md`), 25+ endpoints, JWT auth with roles, bcrypt hashing,
  admin guards, server-side order pricing, retire-instead-of-delete for dishes with history.
- **AI recommender** — `backend/app/recommender.py`, weights served by `GET /api/recommend/meta`,
  API tests include diet-filter guarantees and a check that nothing claims to be
  halal before Camelia confirms certification.
- **Frontend pages** — Home (VELO landing), Menu (search + category/diet/price filters + sort),
  DishDetail (ingredients, allergens warning, ratings, favourite, add to cart), Recommend
  (5-step quiz → top 5 with score breakdown), HowItWorks (method + honest limitations),
  Login/Register, Cart (table number + kitchen note), Orders (kitchen status tracker),
  Admin (overview KPIs + 7-day chart, menu CRUD modal, order status buttons, customers).
- **Assets** — `camelia-logo-orange.png` and `camelia-logo-white.png` are the transparent
  Camelia wordmarks. The hero photo is AI-generated.

### Replacing a dish photograph

Dish pictures live in `frontend/public/images/dishes/`, named after the dish:
lowercase, punctuation removed, spaces turned into hyphens. "Creamed Frappé" is
`creamed-frappe.jpg`. The seeder looks a dish up by that name, so the only step
is to drop the file in and run:

```bash
cd backend && python seed.py
```

The seed command refreshes image links on an existing catalog. The menu audit checks that
each image file is present. The interface shows a fallback if an image fails to load.

A few dishes still use assets from `images/hero/`. Remove the corresponding override in
`seed.py` when switching one of them to a dish-specific file.
- **Docs** — `README.md` (setup, API table, deployment), `docs/SCHEMA.md` (ERD + data dictionary),
  `docs/DATABASE-DESIGN.md` (earlier proposal, kept as the evolution record), `docs/TEST_RESULTS.md`,
  `BUILD-PLAN.md` with a progress section, `render.yaml`, `frontend/vercel.json`, Dockerfiles.
- **Evaluation hooks** — every quiz is logged in `recommendation_logs` with the ranked ids;
  choosing a suggestion records `chosen_dish_id`, so top-1 hit rate and top-5 conversion are
  measurable from real traffic instead of invented numbers.

## What is NEXT (pick one)

1. **UAT with real customers** — 5–10 Camelia guests, record ease score /10 and top-1 hit rate;
   this is the Chapter 6 evidence. Use `docs/TEST_RESULTS.md` as the recording sheet.
2. **Deploy** — Neon → Render → Vercel (steps in README "Deployment"). Then re-run the demo
   against production and screenshot it for the appendix.
3. **Book screenshots** — capture Home, Menu, Quiz result, DishDetail, Cart, Orders, Admin
   (desktop + mobile). Evidence map belongs in `book-pack/CHAPTER_EVIDENCE_MAP.md`.
4. **Menu confirmation** — confirm the cropped snacks and desserts list, the King Burger price,
   and the restaurant's ingredients and allergens.
5. **Collaborative filtering** — only after enough real ratings exist (the build plan's threshold).

## Known limitations (state these honestly in the report)

- Corpus is 137 dishes; ratings are sparse and partly seeded for the demo.
- No collaborative filtering yet — deliberate, per the build plan's minimum-data rule.
- `recommendation_logs` currently contains demo traffic; label it as such.
- Allergen information must be confirmed with the restaurant — the app says "none declared",
  never "safe".
- Deployment is documented and configured but has not been executed.
- Alembic migrations are not used yet; tables are created by `create_all()` at startup.

## Sync rules

GitHub is the hub. Arena edits → commit/push to the branch → pull in VS Code. Never edit the
same file in Arena and VS Code the same day. Never commit `node_modules/`, `dist/`, `*.db`
or `.env` (all covered by `.gitignore`).

## User context

Developer: **Rutabeshya Aloys (Truster25)**, full-stack, Kigali, Rwanda (Mac + VS Code, zsh).
A friend in Semester 8 (MKU BBIT/BSc IT) writes the ~15,000-word book; the developer builds the
system. MKU rules: past tense, 35–50 pages main + 10–20 appendix, Times New Roman 12, 1.5
spacing, Harvard references, 3 bound copies plus a soft copy.
