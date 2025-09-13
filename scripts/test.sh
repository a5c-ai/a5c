#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

# Build first (includes install)
"$ROOT_DIR/scripts/build.sh"

# Run unit tests
if [ -f "$ROOT_DIR/package.json" ] && command -v npm >/dev/null 2>&1; then
  if grep -q '"test:ci"' "$ROOT_DIR/package.json"; then
    echo "[test] Running test:ci (vitest)"
    (cd "$ROOT_DIR" && npm run -s test:ci)
  else
    echo "[test] Running test (vitest)"
    (cd "$ROOT_DIR" && npm test --silent)
  fi
else
  echo "[test] No package.json found. Skipping unit tests."
fi

# Placeholder for e2e tests (none defined yet)
echo "[test] E2E tests not configured."

echo "[test] Done."
