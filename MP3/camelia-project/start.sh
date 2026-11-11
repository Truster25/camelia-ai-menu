#!/usr/bin/env bash
# One-command starter for the Camelia AI Menu (macOS / Linux).
#
#   ./start.sh          install if needed, then run backend + frontend together
#   ./start.sh --reset  rebuild the demo database from scratch first
#
# Ctrl-C stops both servers.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
API_PORT=9000
WEB_PORT=5173

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }
warn()  { printf '\033[0;33m%s\033[0m\n' "$1"; }

# ---------------------------------------------------------------- pre-flight
echo "Camelia AI Menu — running from: $ROOT"
if [ ! -f "$BACKEND/app/recommender.py" ]; then
  red "This does not look like the right folder."
  echo "  Expected $BACKEND/app/recommender.py"
  echo "  You are probably in an OLD copy of the project (the one without seed.py)."
  echo "  Use the fresh clone:  cd ~/Documents/Desktop/MP3/camelia-repo/MP3/camelia-project"
  exit 1
fi

command -v python3 >/dev/null || { red "python3 not found. Install Python 3.10+."; exit 1; }
command -v node    >/dev/null || { red "node not found. Install Node 20+ from https://nodejs.org"; exit 1; }
command -v npm     >/dev/null || { red "npm not found. Reinstall Node 20+ from https://nodejs.org"; exit 1; }

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  red "Node $(node -v) is too old — Tailwind CSS 4 needs Node 20+."
  echo "  Fix:  nvm install 20 && nvm use 20"
  exit 1
fi

# free the ports if an old run is still holding them
for PORT in "$API_PORT" "$WEB_PORT"; do
  if command -v lsof >/dev/null && lsof -ti:"$PORT" >/dev/null 2>&1; then
    warn "Port $PORT is busy — stopping the old process."
    lsof -ti:"$PORT" | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
done

# ---------------------------------------------------------------- backend
cd "$BACKEND"

# A .venv copied from another machine (or another folder) is broken: its
# shebangs point at a python that does not exist here. Detect and rebuild it.
if [ -d .venv ] && ! ./.venv/bin/python -c "import sys" >/dev/null 2>&1; then
  warn "The existing .venv is not usable here — rebuilding it."
  rm -rf .venv
fi

if [ ! -d .venv ]; then
  green "Creating the Python virtual environment…"
  python3 -m venv .venv
  ./.venv/bin/python -m pip install --quiet --disable-pip-version-check --upgrade pip
fi

# shellcheck disable=SC1091
source .venv/bin/activate

if [ ! -f .venv/.installed ] || [ requirements.txt -nt .venv/.installed ] \
   || ! python -c "import fastapi, sqlalchemy, sklearn, jose, bcrypt" >/dev/null 2>&1; then
  green "Installing backend dependencies… (about a minute the first time)"
  python -m pip install --quiet --disable-pip-version-check -r requirements.txt
  touch .venv/.installed
fi

if [ "${1:-}" = "--reset" ]; then
  warn "Rebuilding the demo database…"
  python seed.py --reset
elif [ ! -f camelia.db ]; then
  green "Seeding the demo database…"
  python seed.py
fi

# ---------------------------------------------------------------- frontend
cd "$FRONTEND"

if [ ! -d node_modules ] || [ package.json -nt node_modules/.package-lock.json ]; then
  green "Installing frontend dependencies… (about a minute the first time)"
  npm install --no-audit --no-fund --no-progress
fi

# ---------------------------------------------------------------- run both
green "Starting the API on http://localhost:$API_PORT (docs at /docs)"
cd "$BACKEND"
python -m uvicorn app.main:app --reload --reload-dir app --port "$API_PORT" &
API_PID=$!

green "Starting the site on http://localhost:$WEB_PORT"
cd "$FRONTEND"
npm run dev -- --port "$WEB_PORT" &
WEB_PID=$!

cleanup() {
  echo
  warn "Shutting down…"
  kill "$API_PID" "$WEB_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

cat <<BANNER

  ────────────────────────────────────────────────────────────
   Camelia AI Menu is starting
     Site      http://localhost:$WEB_PORT
     API docs  http://localhost:$API_PORT/docs
     Admin     admin@camelia.rw     / Admin123
     Customer  customer@camelia.rw  / Customer123
   Press Ctrl-C to stop both servers.
  ────────────────────────────────────────────────────────────

BANNER

wait
