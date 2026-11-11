# 🚀 RUN THIS FIRST — two terminals, backend and frontend

The backend and the frontend are **two separate programs**. They run in **two separate
terminals**, each with its own log output and its own **Ctrl-C**.

That is the whole point: when the page misbehaves you look at Terminal 2, and when an API
call fails you look at Terminal 1. Restarting one never touches the other.

---

## Before anything: are you in the right folder?

Your clone is **`~/Documents/Desktop/MP3`**. The project inside it is
`MP3/MP3/camelia-project` on disk (the second `MP3` is a folder in the repo — that is
normal, the git path is just `MP3/camelia-project`).

```bash
cd ~/Documents/Desktop/MP3
ls MP3/camelia-project/backend/seed.py MP3/camelia-project/backend/app/recommender.py
```

- Both files listed → ✅ correct folder, carry on.
- `No such file or directory` → ❌ wrong folder or wrong branch. You are probably in
  `camelia-project-OLD-DO-NOT-USE`. That folder is the old prototype and is not used.

Confirm the branch:

```bash
git branch --show-current     # must print: arena/cb16c143-camelia-ai-menu
```

If it does not:

```bash
git fetch origin
git checkout arena/cb16c143-camelia-ai-menu
git pull origin arena/cb16c143-camelia-ai-menu
```

---

## Terminal 1 — the backend (API + AI, port 9000)

Open VS Code's terminal (**Ctrl-`**) and run:

```bash
cd ~/Documents/Desktop/MP3/MP3/camelia-project/backend
./run.sh
```

`run.sh` does the setup that used to fail by hand:

| It checks | And then |
|---|---|
| `.venv` exists and is usable | rebuilds it if it was copied from another machine |
| `fastapi, sqlalchemy, sklearn, jose, bcrypt` import | runs `pip install -r requirements.txt` if not |
| `camelia.db` exists | runs `seed.py` to create 26 dishes and the demo users |
| port 9000 is free | stops a leftover copy from a previous run |

You should see:

```
API  →  http://localhost:9000
Docs →  http://localhost:9000/docs
Press Ctrl-C to stop the backend.
```

Check in a browser: <http://localhost:9000/api/health> →
`{"status":"ok","version":"1.0.0","database":"connected"}`

**Leave this terminal running.**

> **Why port 9000 and not 8000?** `frontend/vite.config.ts` proxies `/api` to
> `127.0.0.1:9000`. On 8000 the site shows "The kitchen is offline".

---

## Terminal 2 — the frontend (React, port 5173)

Click the **`+`** at the right of the terminal panel to open a second terminal, then:

```bash
cd ~/Documents/Desktop/MP3/MP3/camelia-project/frontend
./run.sh
```

`run.sh` checks Node ≥ 20, runs `npm install` if `node_modules` is missing, and starts Vite.

You should see:

```
Website  →  http://localhost:5173
Backend must be running on port 9000 (Terminal 1).
Press Ctrl-C to stop the frontend.
```

Open <http://localhost:5173>.

### Node version

```bash
node -v      # must be v20.x or higher
```

Older: `nvm install 20 && nvm use 20`. The repo has a `.nvmrc` in `frontend/`, so a bare
`nvm use` reads it.

---

## In VS Code, without typing

Open the **repo root** (the folder with `MP3/` in it), then **Terminal → Run Task…**:

| Task | What it does |
|---|---|
| **`1️⃣ BACKEND (port 9000)`** | Terminal 1 — the API. Opens its own panel named *backend*. |
| **`2️⃣ FRONTEND (port 5173)`** | Terminal 2 — the site. Opens its own panel named *frontend*. |
| `3️⃣ RUN BOTH (one terminal)` | The old combined start — one Ctrl-C stops everything. |
| `4️⃣ Reset demo database` | Deletes `camelia.db` and re-seeds 26 dishes. |
| `5️⃣ Run backend tests` | `pytest -q` — 33 tests. |
| `6️⃣ Build frontend` | TypeScript check + production build. |
| `7️⃣ Git pull (arena branch)` | Pulls the latest pushed code. |

Run tasks 1 and 2 **once each**; you get two panels side by side.
If **Run Task…** shows nothing, you opened the inner `camelia-project` folder instead of the
repo root — tasks only live at the root.

---

## Log in and check that it works

Open <http://localhost:5173>:

| Role | Email | Password |
|---|---|---|
| Customer | `customer@camelia.rw` | `Customer123` |
| Admin | `admin@camelia.rw` | `Admin123` |

The landing page shows the rotating plate photograph behind "Good food creates better days"
with the dark right-hand panel. The plate changes every 3 seconds.

If the page loads but the menu is empty → the backend is down or on the wrong port.
Look at Terminal 1.

---

## Two servers, two Ctrl-C

| You want to | Do this |
|---|---|
| Change Python code | edit; uvicorn reloads automatically (watch Terminal 1) |
| Change React code | edit; Vite hot-reloads (watch Terminal 2) |
| Restart only the API | Ctrl-C in Terminal 1, then `./run.sh` again |
| Restart only the site | Ctrl-C in Terminal 2, then `./run.sh` again |
| Stop everything | Ctrl-C in both |

These were tested: stopping the frontend leaves the API answering on 9000, and stopping the
API leaves the site serving on 5173.

---

## Error → cause → fix

| Message | Cause | Fix |
|---|---|---|
| `Wrong folder: app/recommender.py is missing` | `run.sh` was run from the wrong directory | `cd MP3/camelia-project/backend` first |
| `zsh: permission denied: ./run.sh` | Executable bit lost (copied the file by hand) | `chmod +x run.sh` |
| `command not found: npm` | Node is not installed | install Node 20+ from nodejs.org |
| `command not found: uvicorn` | You typed it yourself outside the venv | use `./run.sh`; it calls `.venv/bin/python` |
| `install: illegal option -- r` | Typed the macOS `install` command, not `pip` | use `./run.sh`, or `.venv/bin/python -m pip install -r requirements.txt` |
| `can't open file .../backend/package.json` | Ran `npm` inside `backend/` | The React app is in `frontend/`. There is no `package.json` in `backend/`. |
| `Port 9000 is still in use` | Another API is already running | stop it in its terminal, or `lsof -ti:9000 \| xargs kill -9` |
| `Port 5173 is still in use` | Another Vite is already running | stop it, or `lsof -ti:5173 \| xargs kill -9` |
| `WatchFiles detected changes in '.venv/...'` repeatedly | uvicorn started without `--reload-dir app` | `run.sh` always passes it |
| Page loads, menu says "The kitchen is offline" | Backend not running, or on port 8000 | start Terminal 1, confirm 9000 |
| `npm error engine Unsupported engine` | Node older than 20 | `nvm install 20 && nvm use 20` |
| `Port 5173 is in use, trying another one...` | Vite silently moved to 5174 | `run.sh` now refuses instead; stop the other Vite |

---

## What still works the old way

`MP3/camelia-project/start.sh` (and `start.command`, which you can double-click in Finder)
still boots both servers in **one** terminal. It is handy for a quick demo, but for
development use the two `run.sh` scripts — that is what they are for.
