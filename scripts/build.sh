#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

bash "$ROOT_DIR/scripts/install.sh"

if [ -f "$ROOT_DIR/package.json" ] && command -v npm >/dev/null 2>&1; then
  echo "[build] Running npm run build"
  (cd "$ROOT_DIR" && npm run -s build)
else
  echo "[build] No Node build configured; skipping"
fi
