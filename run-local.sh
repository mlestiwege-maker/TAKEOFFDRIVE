#!/usr/bin/env bash
# Runs the whole stack locally without Docker or Postgres, using SQLite as a
# stand-in database. Good for quickly demoing the app; for anything closer to
# production, use `docker compose up --build` once docker access is sorted.
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

export DATABASE_URL="sqlite:///$BACKEND_DIR/dev.db"

echo "==> Setting up backend (venv, migrations, seed data)..."
cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q -r requirements.txt

NEW_DB=false
if [ ! -f "dev.db" ]; then
  NEW_DB=true
fi
alembic upgrade head
if [ "$NEW_DB" = true ]; then
  python -m app.seed
fi

echo "==> Starting backend on http://localhost:8000 ..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cleanup() {
  echo ""
  echo "==> Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null
  wait "$BACKEND_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "==> Setting up frontend (npm install)..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  npm install
fi

echo ""
echo "============================================================"
echo " Backend:  http://localhost:8000/docs"
echo " Frontend: http://localhost:5173"
echo ""
echo " Admin login:  admin@takeoff.dev / AdminPass123!"
echo " Test driver:  +263700000001 (application TAKEOFF-000001)"
echo "============================================================"
echo ""

npm run dev
