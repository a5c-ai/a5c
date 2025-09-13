#!/usr/bin/env bash
set -euo pipefail

# Install project dependencies according to detected stack
if [ -f package.json ]; then
  echo "[install] Node dependencies"
  if command -v corepack >/dev/null 2>&1; then
    corepack enable || true
  fi
  if [ -f package-lock.json ]; then
    npm ci
  else
    npm install
  fi
else
  echo "[install] No package.json found. Skipping npm install."
fi

if [ -f requirements.txt ]; then
  echo "[install] Python dependencies"
  python3 -m pip install -r requirements.txt
fi

echo "[install] Done."
