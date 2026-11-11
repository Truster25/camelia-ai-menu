# 🚀 RUN THIS FIRST — getting the project running on your Mac

This is the short version, written from your terminal errors on 11 Nov 2026.
If you follow these four blocks in order it will work.

---

## ⚠️⚠️ The #1 cause of every error below: you are in the OLD folder

There are now **two copies** of `camelia-project` on your Desktop:

| Folder | What it is |
|---|---|
| `MP3/camelia-project` | **OLD.** The original prototype. No `seed.py`, no `Dockerfile`, no real backend. |
| `MP3/camelia-repo/MP3/camelia-project` | **NEW. This is the one to use.** Everything I built. |

Your terminal said `macbook@192 camelia-project %` — that is the **old** folder, which is why
`python seed.py` said *"can't open file .../camelia-project/backend/seed.py"* and why
`pip install -r requirements.txt` installed only 4 packages instead of the full set.

**How to tell which folder you are in** (run this):

```bash
ls backend/seed.py backend/app/recommender.py
```

- Both files exist → ✅ correct folder, carry on.
- "No such file or directory" → ❌ old folder. Move to the clone:

```bash
cd /Users/macbook/Documents/Desktop/MP3/camelia-repo/MP3/camelia-project
```

Your prompt must read `camelia-project` **and** the path above must contain `camelia-repo`.
Tip: run `pwd` if you are ever unsure — it prints the full path.

---

## ⚠️ Read this before anything else

Your project folder is **`MP3/camelia-project/`** — not `MP3/`.

The `camelia-project` folder is **inside** the `MP3` folder. If you `cd backend` while you
are in `MP3/` (not `MP3/camelia-project/`), you are in the wrong `backend`.

Proof: your error said it could not find
`/Users/macbook/Documents/Desktop/MP3/camelia-project/backend/package.json`.
That is correct — **there is no `package.json` in `backend/`**. The React app is in
`frontend/`. Never run `npm` inside `backend/`.

Also: `pip` and `uvicorn` are "command not found" because they live **inside the virtual
environment**, and the virtual environment was not activated.

---

## Block 1 — get the latest code (one time, then whenever I push)

```bash
cd /Users/macbook/Documents/Desktop/MP3
```

If you have **not** cloned my branch yet (you have, so skip this):

```bash
cd /Users/macbook/Documents/Desktop/MP3
git clone https://github.com/Truster25/camelia-ai-menu.git camelia-repo
cd camelia-repo
git checkout arena/cb16c143-camelia-ai-menu
```

✅ You already did this — your clone is at
`/Users/macbook/Documents/Desktop/MP3/camelia-repo` and is up to date.

If you already have a clone of the repo:

```bash
cd camelia-repo            # your existing clone
git fetch origin
git checkout arena/cb16c143-camelia-ai-menu
git pull origin arena/cb16c143-camelia-ai-menu
```

✅ **Check you got my work:** you should now have these files that did not exist before:

```bash
ls MP3/camelia-project/backend/app/recommender.py     # the AI
ls MP3/camelia-project/frontend/src/pages/             # Home, Menu, Recommend, Admin…
ls MP3/camelia-project/docs/SCHEMA.md
```

If those are missing, you are on the wrong branch. Run `git branch --show-current` — it must
print `arena/cb16c143-camelia-ai-menu`.

---

## Block 2 — backend (Terminal 1)

```bash
cd /Users/macbook/Documents/Desktop/MP3/camelia-repo/MP3/camelia-project/backend
python3 -m venv .venv              # create the virtual environment (once)
source .venv/bin/activate          # ← THIS is the step you missed
```

Your prompt must now start with `(.venv)`.

```bash
pip install -r requirements.txt    # takes ~1 minute; ignore pip's version notice
python seed.py                     # creates camelia.db with 26 dishes + demo users
uvicorn app.main:app --reload --reload-dir app --port 9000
```

> **Always pass `--reload-dir app`.** Without it uvicorn watches the whole `backend/`
> folder including `.venv`, so every file pip writes triggers a reload and drowns your
> terminal in `WatchFiles detected changes in '.venv/...'` warnings. `start.sh` does this
> for you automatically.

Leave that terminal running. Then open:

- http://localhost:9000/api/health → should say `{"status":"ok",...}`
- http://localhost:9000/docs → interactive API documentation

### About `install -r requirements.txt`

`install` is a macOS system command for copying files, not pip. You must type **`pip`**:

```bash
pip install -r requirements.txt     # ✅
install -r requirements.txt         # ❌ macOS install command
```

If `pip` is not found, use the interpreter directly — this always works:

```bash
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 9000
```

### Why port 9000 and not 8000?

The frontend is configured to proxy `/api` to `127.0.0.1:9000` (`frontend/vite.config.ts`).
Use 9000 and everything connects with no configuration. If you prefer 8000, change **both**
`--port 8000` and `VITE_API_PROXY` in `vite.config.ts` to 8000, otherwise the app will show
"The kitchen is offline".

---

## Block 3 — frontend (Terminal 2, new tab)

```bash
cd MP3/camelia-project/frontend    # ← frontend, not backend
npm install
npm run dev
```

Open http://localhost:5173.

### ⚠️ Node version

This project needs **Node 20 or newer** (Tailwind CSS 4 and Vite 5 require it). Check:

```bash
node -v      # must be v20.x or higher
```

If it is older, install Node 20 and use it:

```bash
nvm install 20
nvm use 20        # or simply: nvm use   (reads the .nvmrc in frontend/)
node -v           # now v20.x
```

Then delete the broken install and retry:

```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Block 4 — log in and check it works

Open http://localhost:5173 and use:

| Role | Email | Password |
|---|---|---|
| Customer | `customer@camelia.rw` | `Customer123` |
| Admin | `admin@camelia.rw` | `Admin123` |

The landing page must show the rotating plate photo behind "Good food creates better days"
and the dark right-hand panel ("Your next favourite meal"). The plate changes every 3 seconds.

If the page loads but the menu is empty, the backend is not running or is on the wrong port —
look at Terminal 1.

---

## Error → cause → fix

| Error you saw | What it really means | Fix |
|---|---|---|
| `install: illegal option -- r` | macOS `install` command, not pip | type `pip install -r requirements.txt` |
| `zsh: command not found: pip` | virtual environment not activated | `source .venv/bin/activate` then `pip …` |
| `zsh: command not found: uvicorn` | same — it is installed inside `.venv` | activate the venv first |
| `Could not read package.json … /backend/package.json` | ran `npm` inside `backend/` | `cd ../frontend` then `npm install` |
| `ENOENT … /MP3/camelia-project/backend/…` | you are in `MP3/` not `MP3/camelia-project/` | `cd MP3/camelia-project` first |
| Port already in use | another server is running | `lsof -ti:9000 \| xargs kill -9` |
| `The kitchen is offline` in the app | backend not running or on port 8000 | start it on 9000 |
| `can't open file .../backend/seed.py` | you are in the OLD `camelia-project` folder | `cd .../camelia-repo/MP3/camelia-project/backend` |
| pip installed only 4 packages | same — old `requirements.txt` has no SQLAlchemy/sklearn | use the clone |
| Hundreds of `WatchFiles detected changes in '.venv/...'` | uvicorn watching the venv | add `--reload-dir app` |
| `(venv)` prompt but `uvicorn: command not found` | venv from the old folder | recreate it in the correct folder |
| Page is unstyled / no Tailwind | Node older than 20 | `nvm use 20`, delete `node_modules`, reinstall |

---

## Where new changes go

I push to the branch **`arena/cb16c143-camelia-ai-menu`** only. Your `main` branch still holds
the old prototype. To keep your local copy current:

```bash
cd camelia-repo
git fetch origin
git checkout arena/cb16c143-camelia-ai-menu
git pull origin arena/cb16c143-camelia-ai-menu
```

Never edit the same file on your Mac and in Arena the same day — pull first, then edit, then
push. That is how you avoid a merge conflict.

## Useful checks

```bash
# backend tests (from backend/, with the venv active)
pytest -q                 # expect: 33 passed

# frontend production build (from frontend/)
npm run build             # expect: ✓ built in ~4s
```
