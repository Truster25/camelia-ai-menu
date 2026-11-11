#!/usr/bin/env bash
# TERMINAL 1 — Backend. Run from the backend/ folder.
#   ./run.sh
# Creates the virtual environment on first run, installs dependencies,
# seeds the database if it is missing, then serves the API on port 9000.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }
warn()  { printf '\033[0;33m%s\033[0m\n' "$1"; }

command -v python3 >/dev/null || { red "python3 not found. Install Python 3.10+."; exit 1; }

if [ ! -f app/recommender.py ]; then
  red "Wrong folder: app/recommender.py is missing. Run this from MP3/camelia-project/backend."
  exit 1
fi

# A .venv copied from another machine has broken paths — rebuild it.
if [ -d .venv ] && ! ./.venv/bin/python -c "import sys" >/dev/null 2>&1; then
  warn "Existing .venv is not usable here — rebuilding."
  rm -rf .venv
fi

if [ ! -d .venv ]; then
  green "Creating the virtual environment…"
  python3 -m venv .venv
  ./.venv/bin/python -m pip install --quiet --disable-pip-version-check --upgrade pip
fi

if ! ./.venv/bin/python -c "import fastapi, sqlalchemy, sklearn, jose, bcrypt" >/dev/null 2>&1; then
  green "Installing backend dependencies… (about a minute the first time)"
  ./.venv/bin/python -m pip install --quiet --disable-pip-version-check -r requirements.txt
fi

if [ ! -f camelia.db ]; then
  green "Seeding the demo database…"
  ./.venv/bin/python seed.py
fi

# Already running in its own terminal? Do not kill it — that would make the
# backend panel next door go silent, which looks like a crash.
if curl -s -m 2 "http://127.0.0.1:9000/api/health" 2>/dev/null | grep -q '"status"'; then
  green "The backend is already running on http://localhost:9000"
  echo  "Nothing to do. It is probably in Terminal 1."
  echo  "To restart it, press Ctrl-C in that terminal and run ./run.sh again."
  exit 0
fi

# The port is held by something that is not this API — clear it out.
if command -v lsof >/dev/null && lsof -ti:9000 >/dev/null 2>&1; then
  warn "Port 9000 is held by another program — stopping it."
  lsof -ti:9000 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

if curl -s -m 1 -o /dev/null "http://127.0.0.1:9000/api/health" 2>/dev/null; then
  red "Port 9000 is still in use. Stop that program, then run this again."
  exit 1
fi

green "API  →  http://localhost:9000"
echo    "Docs →  http://localhost:9000/docs"
echo    "Press Ctrl-C to stop the backend."
echo

exec ./.venv/bin/python -m uvicorn app.main:app --reload --reload-dir app --host 0.0.0.0 --port 9000
