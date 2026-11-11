# Camelia AI Menu — open this in VS Code

**You are at the repo root.** The real project is one folder down, in
`MP3/camelia-project`. This page exists so you never have to guess which folder is which.

---

## The 3-step version

1. **Open this folder in VS Code** (the repo root — the one with `MP3/`, `project/`, `sabba/`).
2. Click **Terminal → Run Task…** → **`▶ Camelia: start everything`**.
3. Open <http://localhost:5173>. Log in with `admin@camelia.rw` / `Admin123`.

That task installs what is missing, seeds the database and starts both servers for you.
**Ctrl-C** in that terminal stops both.

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
| Backend (Python, the AI) | `MP3/camelia-project/backend` | port **9000** | the task, or `uvicorn app.main:app --reload --reload-dir app --port 9000` |
| Frontend (React) | `MP3/camelia-project/frontend` | port **5173** | the task, or `npm run dev` |

`backend/` has **no** `package.json` — never run `npm` there. `frontend/` has no `seed.py` —
never run `python` there.

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
| "This does not look like the right folder" | You ran `start.sh` outside `MP3/camelia-project`. Use the VS Code task instead. |
| Page loads but no dishes ("The kitchen is offline") | Backend not running, or running on 8000 instead of 9000. |
| Hundreds of `.venv` reload messages | Missing `--reload-dir app`. The task adds it for you. |
| `command not found: npm` | Node is not installed. Install Node 20+ from nodejs.org. |
| `command not found: uvicorn` | The venv is not active. The task activates it for you. |
| Node too old for Tailwind 4 | `node -v` must be v20+. `nvm install 20 && nvm use 20`. |
| Port already in use | The task kills the old process automatically. |

Full detail: [`MP3/camelia-project/docs/RUN-FIRST.md`](MP3/camelia-project/docs/RUN-FIRST.md).

---

## What is actually in here

- `MP3/camelia-project/` — **the project.** React app, FastAPI backend, the AI recommender,
  the database schema, the docs for your book.
- `MP3/camelia-project/docs/` — `SCHEMA.md` (ERD), `TEST_RESULTS.md`, `RUN-FIRST.md`, `HANDOVER.md`.
- `project/`, `sabba/`, `truster-technology/` — old static practice pages, unrelated.
