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

# Ensure runtime JS assets that TypeScript doesn't emit are available in dist
if [ -d "$ROOT_DIR/src" ] && [ -d "$ROOT_DIR/dist" ]; then
  # enrichGithubEvent.js is authored in JS; copy it and its types to dist
  if [ -f "$ROOT_DIR/src/enrichGithubEvent.js" ]; then
    cp "$ROOT_DIR/src/enrichGithubEvent.js" "$ROOT_DIR/dist/enrichGithubEvent.js"
  fi
  if [ -f "$ROOT_DIR/src/enrichGithubEvent.d.ts" ]; then
    cp "$ROOT_DIR/src/enrichGithubEvent.d.ts" "$ROOT_DIR/dist/enrichGithubEvent.d.ts"
  fi
  if [ -f "$ROOT_DIR/src/types-enrichGithubEvent.d.ts" ]; then
    cp "$ROOT_DIR/src/types-enrichGithubEvent.d.ts" "$ROOT_DIR/dist/types-enrichGithubEvent.d.ts"
  fi
fi
