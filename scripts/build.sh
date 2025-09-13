#!/usr/bin/env bash
set -euo pipefail

# Ensure dependencies
"$(dirname "$0")/install.sh"

# Build according to project stack
if [ -f package.json ]; then
  echo "[build] Running npm build..."
  npm run build
else
  echo "[build] No package.json found. Nothing to build."
fi

echo "[build] Done."
