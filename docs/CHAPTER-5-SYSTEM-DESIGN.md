# Chapter 5 – System Design
**Project Title:** AI-Based Menu Recommendation System – Case Study: Camellia Restaurant
**Prepared for:** Chapter 5 of the ~15,000-word book (MKU BBIT/BSc IT, Semester 8)
**Date:** 19 November 2026
**Location:** `/home/user/camelia-ai-menu/docs/CHAPTER-5-SYSTEM-DESIGN.docx` (Markdown source at `/home/user/camelia-ai-menu/docs/CHAPTER-5-SYSTEM-DESIGN.md`)

---

## 1. System Architecture

### 1.1 Architecture Overview
The system follows a **Client-Server Architecture** (Hybrid Full-Stack) where:
- **Frontend** (React 18.3.1 + Vite 5.4.11 + TypeScript + Tailwind CSS 4.3.5) runs in the customer’s browser or admin dashboard.
- **Backend** (FastAPI 0.115.12 + Python 3.11) acts as the REST API and AI ranker engine.
- **Database** (SQLite locally for development, PostgreSQL for production via Neon) stores persistent data.

### 1.2 Technologies
| Layer | Technology Stack |
|-------|------------------|
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS 4, Playfair Display + Inter fonts |
| **Backend** | Python 3.11, FastAPI 0.115, SQLAlchemy 2.0, scikit-learn 1.9 (TF-IDF) |
| **Database** | SQLite (`backend/camelia.db`), PostgreSQL (Neon) |
| **Authentication** | JWT (HS256 via python-jose), bcrypt hashing |

### 1.3 Communication
- **Frontend ↔ Backend:** RESTful HTTP/HTTPS requests (JSON payloads). Frontend uses `fetch`/Axios; Backend exposes endpoints via FastAPI.
- **Backend ↔ Database:** SQLAlchemy ORM queries (SQLite/PostgreSQL).
- **AI Ranker:** Internal Python module (`backend/app/recommender.py`) processes TF-IDF similarity and preference rules within the backend process.

### 1.4 System Architecture Diagram
> **Note:** A formal diagram file is not currently in the repository (`frontend/public/images/` or `docs/`). The architecture is documented in `docs/SCHEMA.md` and `docs/HANDOVER.md`. (Diagram to be drawn in the book based on the text above).

---

## 2. Database Design

### 2.1 Database Management System
- **Local:** SQLite (`backend/camelia.db`)
- **Production:** PostgreSQL (Neon)

### 2.2 Tables, Columns, Keys, and Relationships
(Source: `docs/SCHEMA.md` and `backend/menu_data.py`)

1. **users**
   - `id` (PK, Integer)
   - `email` (String, Unique)
   - `password_hash` (String)
   - `role` (Enum: admin, customer, kitchen)
   - `created_at` (DateTime)
   - *Relationship:* 1:N with `orders`, `ratings`, `favourites`

2. **categories**
   - `id` (PK, Integer)
   - `name` (String)
   - *Relationship:* 1:N with `dishes`

3. **dishes**
   - `id` (PK, Integer)
   - `category_id` (FK -> categories.id)
   - `name` (String)
   - `price` (Integer, RWF)
   - `description` (Text)
   - `ingredients` (Text)
   - `is_vegetarian` (Boolean)
   - `is_vegan` (Boolean)
   - `is_gluten_free` (Boolean)
   - `is_halal` (Boolean, currently False/Blank)
   - `spice_level` (Integer 0-3)
   - `prep_time` (Integer, minutes)
   - `calories` (Integer)
   - `popularity` (Integer)
   - `signature` (Boolean)
   - `allergens` (Text)
   - `photo_path` (String, e.g., `/images/dishes/name.jpg`)
   - *Relationship:* 1:N with `order_items`, `ratings`, `favourites`

4. **orders**
   - `id` (PK, Integer)
   - `user_id` (FK -> users.id)
   - `table_number` (String)
   - `status` (Enum: pending, preparing, ready, completed)
   - `total_price` (Integer)
   - `created_at` (DateTime)
   - *Relationship:* 1:N with `order_items`

5. **order_items**
   - `id` (PK, Integer)
   - `order_id` (FK -> orders.id)
   - `dish_id` (FK -> dishes.id)
   - `quantity` (Integer)
   - `price_at_order` (Integer)
   - `kitchen_note` (Text)

6. **ratings**
   - `id` (PK, Integer)
   - `user_id` (FK -> users.id)
   - `dish_id` (FK -> dishes.id)
   - `score` (Integer 1-5)
   - `comment` (Text)
   - `created_at` (DateTime)

7. **favourites**
   - `id` (PK, Integer)
   - `user_id` (FK -> users.id)
   - `dish_id` (FK -> dishes.id)
   - `created_at` (DateTime)

8. **recommendation_logs**
   - `id` (PK, Integer)
   - `user_id` (FK -> users.id, Nullable for guests)
   - `preferences` (JSON: diet, spice, budget, cuisine, occasion)
   - `ranked_dish_ids` (JSON: list of top 5)
   - `chosen_dish_id` (FK -> dishes.id, Nullable)
   - `created_at` (DateTime)

### 2.3 Entity Relationship Diagram (ERD)
> **Note:** The ERD is detailed in `docs/SCHEMA.md`. No standalone image file is currently in the workspace; the text schema above serves as the technical specification for the book's diagram.

---

## 3. System Process Design

### 3.1 Customer Access and Usage
1. **Browse:** Customer visits `/` (Home) or `/menu` (Menu).
2. **Quiz:** Customer answers 5 questions at `/recommend` (Diet, Spice, Budget, Cuisine, Occasion).
3. **Result:** System returns top 5 dishes with scores and reasons.
4. **Order:** Customer adds to basket, selects table number, and places order (`/cart`).

### 3.2 Preference Entry & Dietary Requirements
- **Inputs:** Diet (Vegan/Veg/GF/Halal), Spice (0-3), Budget (RWF), Cuisine, Occasion.
- **Hard Filters:** Dietary needs (Vegan, Vegetarian, Gluten-Free) remove dishes *before* ranking. Halal is currently blank (conservative) per `docs/DIETARY-REVIEW.md`.

### 3.3 Filtering and Recommendation Logic
1. **Filter:** Remove dishes failing hard dietary filters.
2. **Score (Hybrid Ranker):**
   - **Taste Profile (40%):** TF-IDF cosine similarity between quiz answers and dish description/tags/ingredients.
   - **Preference Rules (25%):** Explicit matches (cuisine, category, spice, portion, occasion).
   - **Popularity (20%):** Rating average + count.
   - **Occasion Fit (15%):** Suitability for stated occasion.
3. **Output:** Top 5 ranked dishes with plain-English reasons.

### 3.4 Staff Management
- **Login:** `/login` (Admin role).
- **CRUD:** Manage dishes, categories, prices via `/admin`.
- **Analytics:** View KPIs, 7-day charts, order status, and ratings.

### 3.5 Flowcharts / Process Diagrams
> **Note:** Process flows are described in `docs/HANDOVER.md` and `docs/PROJECT-STATUS.md`. Actual diagram files (PNG/SVG) are not present in the repository; the book should illustrate the text flows above.

---

## 4. User Interface Design

### 4.1 Available Pages & Screenshots
> **Note:** Screenshots are not stored in the repository (only dish photos in `frontend/public/images/dishes/` and logos in `frontend/public/images/`). The book should reference the following routes:
- **Homepage (`/`):** Hero, story carousel, signature dishes, AI explainer.
- **Menu (`/menu`):** 130-dish list, category/diet/price filters, sort.
- **Customer Preference Form (`/recommend`):** 5-step quiz.
- **Meal Recommendation Results (`/recommend`):** Top 5 list with scores.
- **Staff Login (`/login`):** Authentication page.
- **Staff Dashboard (`/admin`):** KPIs, dish CRUD, orders, analytics.
- **Other:** Dish detail (`/menu/:id`), How it works (`/how-it-works`), Our story (`/our-story`), Contact (`/contact`), Cart (`/cart`), Orders (`/orders`), Privacy (`/privacy`).

---

## 5. System Security Design

### 5.1 Login and Authentication
- **Method:** JWT (HS256) tokens stored in cookies/local storage.
- **Process:** `/login` verifies email/password via bcrypt; returns token.

### 5.2 User Roles & Access
- **Admin:** Full access to `/admin` and API CRUD.
- **Customer:** Access to `/menu`, `/recommend`, `/cart`, `/orders`.
- **Kitchen:** View order status (simulated in admin).
- **Guest:** Browse menu and quiz (no account).

### 5.3 Protection Measures
- **Passwords:** Hashed with `bcrypt` (never stored in plain text).
- **Guards:** Backend endpoints use role-based decorators; Frontend routes redirect unauthorized users.
- **Dietary Safety:** Halal filter is deliberately empty (no false claims) until certification.

### 5.4 Other Measures
- **Input Validation:** FastAPI Pydantic models.
- **Database:** Retire-instead-of-delete for dishes with history.

---

## 6. Recommendation System Design

### 6.1 Algorithm / Technique
- **Hybrid Content-Based Ranker** (Not a neural network).
- **Technique:** TF-IDF cosine similarity (Scikit-learn) blended with rule-based weights.

### 6.2 Preference Processing
- Quiz answers are converted into text vectors (TF-IDF) and rule flags.

### 6.3 Filtering & Ranking
- **Step 1 (Filter):** Remove non-matching dietary items (Hard filter).
- **Step 2 (Rank):**
  - Taste Match (40%)
  - Preference Rules (25%)
  - Popularity (20%)
  - Occasion Fit (15%)
- **Step 3 (Explain):** Generate plain-English reason for each top 5 dish.

### 6.4 Budget & Dietary Restrictions
- **Budget:** Filtered in Preference Rules (25% weight) or hard filter if specified.
- **Dietary:** Hard filters (Vegan, Vegetarian, GF) applied *before* scoring. Halal is currently not marked.

---

## 7. Development Technologies

### 7.1 Programming Languages
- **Python 3.11** (Backend, AI, Seeding)
- **TypeScript / JavaScript** (Frontend)
- **HTML / CSS (Tailwind)** (Frontend)

### 7.2 Frameworks & Libraries
- **Frontend:** React 18.3.1, Vite 5.4.11, Tailwind CSS 4.3.5, @fontsource (Playfair Display, Inter).
- **Backend:** FastAPI 0.115.12, SQLAlchemy 2.0.57, scikit-learn 1.9.1, python-jose, bcrypt.
- **Testing:** pytest (218 tests passed).

### 7.3 Development Tools
- **IDE:** VS Code (Mac/Zsh), Arena.ai Agent Mode.
- **Version Control:** Git (Branch: `arena/727f4717-camelia-ai-menu`).
- **Environment:** Python `.venv`, Node.js/npm.

### 7.4 APIs / External Services
- **Internal API:** FastAPI endpoints (e.g., `GET /api/recommend/meta`, `POST /api/order`).
- **External:** None currently (Newsletter form stores to DB but sends no email; no mail provider configured).
- **Deployment (Prepared):** Vercel (Frontend), Render (Backend), Neon (DB).

---

**File Location:** `/home/user/camelia-ai-menu/docs/CHAPTER-5-SYSTEM-DESIGN.md`
**Word Document Export:** The Markdown above can be converted to `.docx` using Pandoc or copied into the book manuscript (Times New Roman 12, 1.5 spacing, Harvard references).

---
