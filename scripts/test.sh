#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

"$ROOT_DIR/scripts/build.sh"

if [ -f "$ROOT_DIR/package.json" ] && command -v npm >/dev/null 2>&1; then
  echo "Running npm test (vitest)"
  (cd "$ROOT_DIR" && npm test --silent)
else
  echo "No Node tests configured; skipping"
fi
