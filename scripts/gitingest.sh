#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="${ROOT}/ingest/digest.txt"

mkdir -p "${ROOT}/ingest"
cd "${ROOT}"

gitingest . -o "${OUTPUT}"

echo ""
echo "Gitingest complete."
echo "Output: ingest/digest.txt"
echo "Tip: run 'npm run gitingest:stdout' to pipe digest to stdout."
