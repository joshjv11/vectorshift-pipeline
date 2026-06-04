#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK_SRC="${ROOT}/scripts/hooks/pre-push"
HOOK_DST="${ROOT}/.git/hooks/pre-push"

cp "${HOOK_SRC}" "${HOOK_DST}"
chmod +x "${HOOK_DST}"
echo "Installed pre-push hook (blocks teamnuvoro pushes)."
