#!/usr/bin/env bash
set -euo pipefail

# Guard against focused or skipped tests committed to the repo.
# Fails when any of the following are found under test directories:
#   - describe.only(  it.only(  test.only(
#   - describe.skip(  it.skip(  test.skip(
#
# Usage:
#   scripts/lint-tests-focused.sh               # scan default test dirs
#   scripts/lint-tests-focused.sh <paths...>    # scan only given paths (filtered to test dirs)

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$ROOT_DIR"

has_rg() { command -v rg >/dev/null 2>&1; }

# Build list of globs/paths to scan
TARGETS=()
if [ "$#" -gt 0 ]; then
  # Filter provided args to test directories/files only
  for p in "$@"; do
    case "$p" in
      test/*|tests/*|*/test/*|*/tests/*)
        TARGETS+=("$p")
        ;;
    esac
  done
else
  # Default: scan canonical test directories
  TARGETS+=("test" "tests")
fi

# If nothing to scan, exit 0 (best-effort)
if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "[lint-tests-focused] No test paths to scan (skipping)"
  exit 0
fi

PATTERNS=(
  'describe\.only\s*\('
  'it\.only\s*\('
  'test\.only\s*\('
  'describe\.skip\s*\('
  'it\.skip\s*\('
  'test\.skip\s*\('
)

FOUND=0
REPORT=""

scan_with_rg() {
  local target="$1"
  for pat in "${PATTERNS[@]}"; do
    # Exclude common generated dirs
    if rg -n -S -e "$pat" \
        -g '!node_modules/**' -g '!dist/**' -g '!coverage/**' \
        "$target"; then
      FOUND=1
    fi
  done
}

scan_with_grep() {
  local target="$1"
  for pat in "${PATTERNS[@]}"; do
    # Fallback grep (recursive, ignore binary); may be noisier
    if grep -R -n -E "$pat" --exclude-dir node_modules --exclude-dir dist --exclude-dir coverage -- "$target"; then
      FOUND=1
    fi
  done
}

for t in "${TARGETS[@]}"; do
  [ -e "$t" ] || continue
  if has_rg; then
    scan_with_rg "$t" || true
  else
    scan_with_grep "$t" || true
  fi
done

if [ "$FOUND" -ne 0 ]; then
  echo "::error title=Focused/Skipped tests detected::Found '.only(' or '.skip(' in test files. Remove these before committing."
  echo "Patterns checked: describe/it/test .only/.skip"
  exit 1
fi

echo "[lint-tests-focused] OK: no focused/skipped tests found"
