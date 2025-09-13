#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

if [ -f "$ROOT_DIR/package.json" ]; then
  echo "Detected package.json – running npm ci (or npm install)"
  if command -v npm >/dev/null 2>&1; then
    (cd "$ROOT_DIR" && (npm ci || npm install))
  else
    echo "npm not available; skipping Node deps" >&2
  fi
else
  echo "No package.json found – skipping npm install"
fi

if [ -f "$ROOT_DIR/requirements.txt" ]; then
  echo "Detected requirements.txt – running pip install -r requirements.txt"
  if command -v pip >/dev/null 2>&1; then
    (cd "$ROOT_DIR" && pip install -r requirements.txt)
  else
    echo "pip not available; skipping Python deps" >&2
  fi
else
  echo "No requirements.txt found – skipping pip install"
fi
