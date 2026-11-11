#!/usr/bin/env bash
# TERMINAL 2 — Frontend. Run from the frontend/ folder.
#   ./run.sh
# Installs node modules on first run, then serves the React app on port 5173.
# It talks to the backend on port 9000 through the Vite proxy.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

green() { printf '\033[0;32m%s\033[0m\n' "$1"; }
red()   { printf '\033[0;31m%s\033[0m\n' "$1"; }
warn()  { printf '\033[0;33m%s\033[0m\n' "$1"; }

command -v node >/dev/null || { red "node not found. Install Node 20+ from https://nodejs.org"; exit 1; }
command -v npm  >/dev/null || { red "npm not found. Reinstall Node 20+."; exit 1; }

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 20 ]; then
  red "Node $(node -v) is too old — this project needs Node 20 or newer."
  echo "  Fix:  nvm install 20 && nvm use 20"
  exit 1
fi

# ---------------------------------------------------------------------------
# Self-repair: a "D" line in git status means a tracked file is MISSING from
# this working copy (after a folder rename or a branch switch). Vite then
# serves a folder with no index.html, and the browser shows a bare 404 that
# looks like the server is down. git pull will NOT restore these files,
# because nothing upstream changed them.
#
# Files are restored one at a time and run.sh is skipped, so this repair can
# never overwrite the script that is currently running.
# ---------------------------------------------------------------------------
if git rev-parse --git-dir >/dev/null 2>&1; then
  missing="$(git ls-files --deleted -- "." 2>/dev/null | grep -v 'run\.sh$' || true)"
  if [ -n "$missing" ]; then
    warn "Tracked files are missing from this folder — restoring them:"
    while IFS= read -r f; do
      [ -z "$f" ] && continue
      echo "    $f"
      git checkout -- "$f" 2>/dev/null || red "    could not restore $f"
    done <<< "$missing"
  fi
fi

if [ ! -f package.json ]; then
  red "Wrong folder: package.json is missing. Run this from MP3/camelia-project/frontend."
  exit 1
fi

if [ ! -d node_modules ]; then
  green "Installing frontend dependencies… (about a minute the first time)"
  npm install --no-audit --no-fund --no-progress
fi

# Already running in its own terminal? Do not kill it — that would make the
# frontend panel next door go silent, which looks like a crash.
if curl -s -m 2 "http://127.0.0.1:5173" 2>/dev/null | grep -qi 'vite\|<div id="root"\|<!doctype html'; then
  green "The website is already running on http://localhost:5173"
  echo  "Nothing to do. It is probably in Terminal 2."
  echo  "To restart it, press Ctrl-C in that terminal and run ./run.sh again."
  exit 0
fi

# The port is held by something else — clear it out.
if command -v lsof >/dev/null && lsof -ti:5173 >/dev/null 2>&1; then
  warn "Port 5173 is held by another program — stopping it."
  lsof -ti:5173 | xargs kill -9 2>/dev/null || true
  sleep 1
fi

# Fail loudly rather than silently moving to 5174: the README, the screenshots
# and the user's habits all assume 5173.
if curl -s -m 1 -o /dev/null "http://127.0.0.1:5173" 2>/dev/null; then
  red "Port 5173 is still in use. Stop that program, then run this again."
  exit 1
fi

green "Website  →  http://localhost:5173"
echo    "Backend must be running on port 9000 (Terminal 1)."
echo    "Press Ctrl-C to stop the frontend."
echo

exec npm run dev -- --port 5173
