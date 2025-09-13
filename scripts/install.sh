#!/usr/bin/env bash
set -euo pipefail

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
fi

if [ -f requirements.txt ]; then
  echo "[install] Python dependencies"
  python3 -m pip install -r requirements.txt
fi

