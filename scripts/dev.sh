#!/usr/bin/env bash
set -euo pipefail

is_port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

find_free_port() {
  local port=$1
  local max_attempts=50
  local attempts=0

  while is_port_in_use "$port"; do
    port=$((port + 1))
    attempts=$((attempts + 1))
    if [[ "$attempts" -ge "$max_attempts" ]]; then
      echo "Could not find a free port starting from $1" >&2
      exit 1
    fi
  done

  echo "$port"
}

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

BACKEND_PORT="$(find_free_port 8000)"
FRONTEND_PORT="$(find_free_port 3000)"
API_URL="http://localhost:${BACKEND_PORT}"

if [[ "$BACKEND_PORT" != "8000" ]]; then
  echo "Port 8000 in use — backend will use ${BACKEND_PORT}"
fi

if [[ "$FRONTEND_PORT" != "3000" ]]; then
  echo "Port 3000 in use — frontend will use ${FRONTEND_PORT}"
fi

echo ""
echo "Starting dev servers:"
echo "  Frontend → http://localhost:${FRONTEND_PORT}"
echo "  Backend  → http://localhost:${BACKEND_PORT}"
echo ""

export BACKEND_PORT
export REACT_APP_API_URL="${API_URL}"

exec npx concurrently -n backend,frontend -c blue,green \
  "BACKEND_PORT=${BACKEND_PORT} bash scripts/start-backend.sh" \
  "PORT=${FRONTEND_PORT} REACT_APP_API_URL=${API_URL} npm --prefix frontend start"
