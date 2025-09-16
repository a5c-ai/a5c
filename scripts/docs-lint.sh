#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Docs Lint: scanning for outdated payload types..."

FOUND=0

# Build list of files to scan: README.md and docs/**/*.md excluding dev and validation logs
mapfile -t FILES < <(\
  find "$ROOT_DIR/docs" -type f -name "*.md" \
    -not -path "*/dev/*" \
    -not -path "*/validation/*" \
    -print; \
  printf "%s\n" "$ROOT_DIR/README.md" \
)

scan_file() {
  local file="$1"
  # Disallow generic 'payload?: any' wording
  if grep -nE "payload\?:\s*any" "$file" > /dev/null 2>&1; then
    echo "error: $file contains 'payload?: any' which is disallowed for composed[].payload (use 'object | array | null')."
    grep -nE "payload\?:\s*any" "$file" || true
    FOUND=1
  fi
  # Disallow describing composed[].payload as any
  if grep -nE "composed\\[\\]\\.payload.*any" "$file" > /dev/null 2>&1; then
    echo "error: $file mentions composed[].payload as 'any'. It must be 'object | array | null'."
    grep -nE "composed\\[\\]\\.payload.*any" "$file" || true
    FOUND=1
  fi
}

for f in "${FILES[@]}"; do
  [ -f "$f" ] || continue
  scan_file "$f"
done

if [ "$FOUND" -ne 0 ]; then
  echo
  echo "Docs Lint failed. Update docs to state composed[].payload is 'object | array | null'."
  exit 1
fi

echo "Docs Lint passed."
