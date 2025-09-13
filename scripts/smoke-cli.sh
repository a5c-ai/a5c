#!/usr/bin/env bash
# Lightweight CLI smoke test for normalize + enrich
set -euo pipefail
ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

# Ensure deps and build once
if [ -f package.json ]; then
  if command -v corepack >/dev/null 2>&1; then corepack enable || true; fi
  if [ -f package-lock.json ]; then npm ci --silent || npm install --silent; else npm install --silent; fi
  npm run -s build
fi

CLI="node dist/cli.js"
SAMPLES_DIR="samples"
IN_PAYLOAD="$SAMPLES_DIR/push.json"
TMP_NE="/tmp/a5c-ne.json"
TMP_OUT="/tmp/a5c-out.json"

if [ ! -f "$IN_PAYLOAD" ]; then
  echo "[smoke] Missing sample payload: $IN_PAYLOAD" >&2
  exit 2
fi

# Normalize
set -x
$CLI normalize --in "$IN_PAYLOAD" --out "$TMP_NE"
set +x

# Verify NE exists and parses
if [ ! -s "$TMP_NE" ]; then echo "[smoke] NE file missing or empty" >&2; exit 3; fi
node -e "JSON.parse(require('fs').readFileSync('$TMP_NE','utf8')); console.log('OK: NE parses')"

# Enrich (without patches for speed)
set -x
$CLI enrich --in "$TMP_NE" --out "$TMP_OUT" --flag include_patch=false
set +x

# Verify OUT exists and parses, and includes expected fields
if [ ! -s "$TMP_OUT" ]; then echo "[smoke] OUT file missing or empty" >&2; exit 4; fi
node -e "const o=JSON.parse(require('fs').readFileSync('$TMP_OUT','utf8')); if(!o.provider||!o.payload){throw new Error('Missing core fields');} console.log('OK: OUT validates basic shape')"

echo "[smoke] CLI smoke test completed successfully."
