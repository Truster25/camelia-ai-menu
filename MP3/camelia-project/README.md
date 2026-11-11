# Camellia AI Menu

A restaurant menu recommendation project for Camellia Café & Restaurant, Kigali. This is a **starter prototype**, not a completed restaurant system.

## What works now

- Responsive landing page inspired by the supplied reference and featuring the supplied orange logo.
- React + TypeScript frontend and FastAPI backend; the frontend fetches sample menu items from the API.
- API health check and two backend tests.
- Proposed database design in `docs/DATABASE-DESIGN.md`; `docker-compose.yml` prepares a local PostgreSQL container for a later stage.

The menu, descriptions and prices are fictional demo data. The hero image is AI-generated. Search, login, orders, database persistence and recommendations are **not implemented yet**. The supplied glowing logo may need a cleaner source for small sizes. Do not use this prototype in real restaurant operations.

## Requirements

- Node.js 20 and npm
- Python 3.10 or newer
- VS Code (recommended) and Git
- Docker Desktop is optional for now; PostgreSQL is not yet connected.

## Run locally in VS Code

Open this folder in VS Code. Open two terminals (**Terminal → New Terminal**). Keep both running.

### Terminal 1 — backend

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Windows PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

If PowerShell blocks activation, run the venv's Python directly: `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`, then `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000`. API docs: http://localhost:8000/docs.

### Terminal 2 — frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed in the terminal, normally http://localhost:5173. The Vite development server proxies `/api` requests to the local backend on port 8000. This is a development configuration; production hosting still needs an API route/proxy and environment configuration.

## Checks

```bash
# in backend, after activating the virtual environment
python -m pytest -q
# in frontend
npm run build
```

## Optional local PostgreSQL

From the project root, `docker compose up -d db` starts an empty local PostgreSQL database. The credentials are for local development only. There are no migrations or application database connection yet. Stop it with `docker compose down`; add `-v` only if you want to delete the local data volume.

## GitHub setup

Suggested repository name: **camellia-ai-menu**. Create a new **empty** repository on GitHub (do not add a README or .gitignore there), then in a terminal at this folder run:

```bash
git init
git add .
git commit -m "Initial Camellia prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/camellia-ai-menu.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub account name and sign in through GitHub when prompted. Never put credentials or real customer data in the repository. Use a private repository if you want to limit access. Arena and your VS Code folder are separate copies: changes do not sync automatically; use Git commits/push/pull or download updated files.

## Project layout

```text
frontend/             React application and visual assets
backend/app/          FastAPI application
backend/tests/        API tests
docs/                 Design notes
docker-compose.yml    Optional local PostgreSQL container
BUILD-PLAN.md         Shared roadmap
Handover-Document-v0.1.docx  Planning handover for the student's paper
tools/ and figures/   Handover document generation assets
```
