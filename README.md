# Camelia AI Menu — open this in VS Code

**You are at the repo root.** The real project is one folder down, in
`MP3/camelia-project`. This page exists so you never have to guess which folder is which.

---

## Two terminals — one for the backend, one for the frontend

Each server gets **its own terminal**, its own log output and its own **Ctrl-C**.
Started this way you can restart the frontend without touching the backend, and read
Python errors and React errors in different windows.

### Option A — two VS Code tasks (no typing)

1. **Open this folder in VS Code** (the repo root — the one with `MP3/`, `project/`, `sabba/`).
2. **Terminal → Run Task…** → **`1️⃣ BACKEND (port 9000)`**.
3. **Terminal → Run Task…** again → **`2️⃣ FRONTEND (port 5173)`**.

VS Code opens a separate panel for each, named *backend* and *frontend*, sitting side by side.

| Task | What it does |
|---|---|
| **`1️⃣ BACKEND (port 9000)`** | Terminal 1 — the API. Own panel, own Ctrl-C. |
| **`2️⃣ FRONTEND (port 5173)`** | Terminal 2 — the site. Own panel, own Ctrl-C. |
| `3️⃣ RUN BOTH (one terminal)` | The old combined start — one Ctrl-C stops everything. |
| `4️⃣ Reset demo database` | Deletes `camelia.db`, re-seeds 26 dishes. |
| `5️⃣ Run backend tests` | `pytest -q` — 33 tests. |
| `6️⃣ Build frontend` | TypeScript check + production build. |
| `7️⃣ Git pull (arena branch)` | Pulls the latest pushed code. |

If **Run Task…** shows nothing, you opened the inner `camelia-project` folder instead of the
repo root. Tasks only exist at the root.

### Option B — two terminals by hand

**Terminal 1 — backend** (Ctrl-` to open the first one):

```bash
cd MP3/camelia-project/backend
./run.sh
```

Wait for `API → http://localhost:9000`. Leave it running.

**Terminal 2 — frontend** (click the **`+`** in the terminal panel for a second one):

```bash
cd MP3/camelia-project/frontend
./run.sh
```

Wait for `Website → http://localhost:5173`. Now open <http://localhost:5173>.

| Terminal | Folder | You should see | Ctrl-C stops |
|---|---|---|---|
| **1** | `MP3/camelia-project/backend` | `API → http://localhost:9000` | only the API |
| **2** | `MP3/camelia-project/frontend` | `Website → http://localhost:5173` | only the website |

`run.sh` handles the first-run setup itself: it creates the Python virtual environment,
installs the dependencies, seeds the database if it is missing, and frees the port from a
previous run. The frontend version installs `node_modules` if they are missing.

> Need both in a single panel instead? Use **`3️⃣ RUN BOTH (one terminal)`**. That is the old
> combined behaviour — convenient, but a Ctrl-C stops everything, so it is not the way to
> develop.

> The other folders (`project/`, `sabba/`, `truster-technology/`) are earlier unrelated work.
> Ignore them completely.

---

## Before you start: update to my latest code

In VS Code open the terminal (**Ctrl-`**) and run:

```bash
git pull origin arena/cb16c143-camelia-ai-menu
```

If VS Code says you are on `main`, switch first:

```bash
git checkout arena/cb16c143-camelia-ai-menu
git pull origin arena/cb16c143-camelia-ai-menu
```

---

## Is everything working?

Two files must exist. Check with:

```bash
ls MP3/camelia-project/backend/seed.py MP3/camelia-project/backend/app/recommender.py
```

- Both listed → ✅ the project is fine, start it.
- "No such file" → you are on the wrong branch or in an old copy. Run the `git checkout` above.

The backend and frontend themselves are healthy. The only thing that ever went wrong was
running commands in the wrong folder — the task above cannot make that mistake.

---

## What the two servers are

| | Folder | Runs on | Start it with |
|---|---|---|---|
| Backend (Python, the AI) | `MP3/camelia-project/backend` | port **9000** | `./run.sh` |
| Frontend (React) | `MP3/camelia-project/frontend` | port **5173** | `./run.sh` |

Each folder has its own `run.sh` — **run each one in its own terminal**. `backend/` has
**no** `package.json` — never run `npm` there. `frontend/` has no `seed.py` — never run
`python` there.

---

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@camelia.rw` | `Admin123` |
| Customer | `customer@camelia.rw` | `Customer123` |

---

## If something refuses to start

| Symptom | Fix |
|---|---|
| "Wrong folder: app/recommender.py is missing" | You ran `backend/run.sh` from somewhere else. `cd MP3/camelia-project/backend` first, or use the VS Code task. |
| Page loads but no dishes ("The kitchen is offline") | Backend not running, or running on 8000 instead of 9000. |
| Hundreds of `.venv` reload messages | Missing `--reload-dir app`. The task adds it for you. |
| `command not found: npm` | Node is not installed. Install Node 20+ from nodejs.org. |
| `command not found: uvicorn` | The venv is not active. `run.sh` calls the venv directly, so this cannot happen there — only if you typed `uvicorn` yourself. |
| Node too old for Tailwind 4 | `node -v` must be v20+. `nvm install 20 && nvm use 20`. |
| "Port 9000 is still in use" | An old copy is running. Stop it in the other terminal, or `lsof -ti:9000 \| xargs kill -9`. |

Note: `start.sh` at `MP3/camelia-project/` still exists and still runs both servers in one
terminal — it is what `start.command` uses when you double-click it in Finder. For day-to-day
work prefer the two `run.sh` scripts above.

Full detail: [`MP3/camelia-project/docs/RUN-FIRST.md`](MP3/camelia-project/docs/RUN-FIRST.md).

---

## What is actually in here

- `MP3/camelia-project/` — **the project.** React app, FastAPI backend, the AI recommender,
  the database schema, the docs for your book.
- `MP3/camelia-project/docs/` — `SCHEMA.md` (ERD), `TEST_RESULTS.md`, `RUN-FIRST.md`, `HANDOVER.md`.
- `project/`, `sabba/`, `truster-technology/` — old static practice pages, unrelated.
