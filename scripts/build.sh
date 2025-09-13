#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

"$ROOT_DIR/scripts/install.sh"

if [ -f "$ROOT_DIR/package.json" ] && command -v npm >/dev/null 2>&1; then
  echo "Running npm run build (scaffold)"
  (cd "$ROOT_DIR" && npm run -s build)
else
  echo "No Node build configured; skipping"
fi
