#!/usr/bin/env bash
set -euo pipefail

# --- 1. AUTO-HEALING SETUP ---
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}"

# If frontend dependencies are missing, silently install them
if [ ! -d "${ROOT}/frontend/node_modules" ]; then
  echo "📦 Frontend dependencies missing. Auto-installing now..."
  npm install --prefix frontend
fi

# Auto-bootstrap .env from .env.example on first clone
if [[ ! -f "${ROOT}/.env" ]]; then
  if [[ -f "${ROOT}/.env.example" ]]; then
    cp "${ROOT}/.env.example" "${ROOT}/.env"
    echo "⚙️  Created .env from .env.example — add your API keys to .env to enable all features."
  fi
fi

# Load environment variables from .env (if present) without overwriting existing env
if [[ -f "${ROOT}/.env" ]]; then
  set -o allexport
  # shellcheck disable=SC1091
  source "${ROOT}/.env"
  set +o allexport
fi

# --- 2. PORT MANAGEMENT ---
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

BACKEND_PORT="$(find_free_port 8000)"
FRONTEND_PORT="$(find_free_port 3000)"
API_URL="http://localhost:${BACKEND_PORT}"

if [[ "$BACKEND_PORT" != "8000" ]]; then
  echo "⚠️ Port 8000 in use — backend will safely use ${BACKEND_PORT}"
fi

if [[ "$FRONTEND_PORT" != "3000" ]]; then
  echo "⚠️ Port 3000 in use — frontend will safely use ${FRONTEND_PORT}"
fi

# --- 3. BOOT SERVERS ---
echo ""
echo "🚀 Starting dev servers:"
echo "  Frontend → http://localhost:${FRONTEND_PORT}"
echo "  Backend  → http://localhost:${BACKEND_PORT}"
echo "  Client errors → echoed here as [frontend:...] lines"
echo ""

export BACKEND_PORT
export REACT_APP_API_URL="${API_URL}"

# ESLINT_NO_DEV_ERRORS keeps lint warnings from crashing the dev build.
exec npx concurrently -n backend,frontend -c blue,green \
  "BACKEND_PORT=${BACKEND_PORT} bash scripts/start-backend.sh" \
  "PORT=${FRONTEND_PORT} REACT_APP_API_URL=${API_URL} ESLINT_NO_DEV_ERRORS=true npm --prefix frontend start"
