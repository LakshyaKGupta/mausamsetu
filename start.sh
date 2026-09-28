#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

if [[ ! -x "$BACKEND_DIR/.venv/bin/uvicorn" ]]; then
  echo "Backend virtual environment is missing. Create it with:"
  echo "  cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt"
  exit 1
fi

if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
  echo "Frontend dependencies are missing. Install them with:"
  echo "  cd frontend && npm ci"
  exit 1
fi

echo "Starting MausamSetu backend..."
STARTED_PIDS=()

cleanup() {
  echo "\nStopping MausamSetu services..."
  if ((${#STARTED_PIDS[@]})); then
    kill "${STARTED_PIDS[@]}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

wait_for_port() {
  local port="$1"
  local service_name="$2"
  local attempt

  for attempt in {1..25}; do
    if lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.2
  done

  echo "$service_name did not start listening on port $port." >&2
  return 1
}

if lsof -tiTCP:8000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Backend port 8000 is already in use; reusing the running service."
else
  (
    cd "$BACKEND_DIR"
    exec .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
  ) &
  STARTED_PIDS+=("$!")
  wait_for_port 8000 "Backend"
fi

echo "Starting MausamSetu frontend..."
if lsof -tiTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Frontend port 5173 is already in use; reusing the running service."
else
  (
    cd "$FRONTEND_DIR"
    exec npm run dev
  ) &
  STARTED_PIDS+=("$!")
  wait_for_port 5173 "Frontend"
fi

echo "MausamSetu is running."
echo "Backend:  http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both services."

if ((${#STARTED_PIDS[@]})); then
  wait "${STARTED_PIDS[@]}"
fi
