#!/usr/bin/env bash
set -euo pipefail

echo "[precommit] Running checks..."

# Allow skipping via env variable for CI overrides or emergency bypass
if [ -n "${A5C_SKIP_PRECOMMIT:-}" ] || [ -n "${SKIP_PRECOMMIT:-}" ]; then
  echo "[precommit] Skipped by env flag."
  exit 0
fi

# Collect staged files (added/copied/modified/renamed) excluding deletions
STAGED=$(git diff --cached --name-only --diff-filter=ACMR || true)
if [ -z "$STAGED" ]; then
  echo "[precommit] No staged files."
  exit 0
fi

fail() {
  echo "[precommit] \033[31mFAIL\033[0m: $1" >&2
  exit 1
}

warn() {
  echo "[precommit] \033[33mWARN\033[0m: $1" >&2
}

# 1) Guard against Windows-invalid filenames (e.g., ':')
if echo "$STAGED" | grep -E ':' >/dev/null 2>&1; then
  echo "$STAGED" | grep -E ':' || true
  fail "Staged filenames contain ':' which breaks Windows checkouts. Please rename (use '-' instead)."
fi

# 2) Trailing whitespace and EOF newline check for text files
TEXT_FILES=$(echo "$STAGED" | grep -E '\.(ts|tsx|js|jsx|json|md|yml|yaml|sh|cjs|mjs)$' || true)
if [ -n "$TEXT_FILES" ]; then
  TW_BAD=0
  for f in $TEXT_FILES; do
    [ -f "$f" ] || continue
    if grep -n -P "\s$" "$f" >/dev/null 2>&1; then
      echo "[precommit] Trailing whitespace: $f"
      TW_BAD=1
    fi
    if [ -s "$f" ] && [ -n "$(tail -c1 "$f" | tr -d '\n')" ]; then
      echo "[precommit] Missing EOF newline: $f"
      TW_BAD=1
    fi
  done
  if [ "$TW_BAD" -eq 1 ]; then
    fail "Fix trailing whitespace and ensure files end with a newline."
  fi
fi

# 3) Lint staged TS/JS (fast)
if command -v npm >/dev/null 2>&1 && [ -f package.json ]; then
  if echo "$STAGED" | grep -E '\.(ts|tsx|js|jsx)$' >/dev/null 2>&1; then
    echo "[precommit] Linting..."
    npm run -s lint || fail "ESLint violations found. Run 'npm run lint' to fix."
  fi

  # 4) Typecheck (fast)
  if [ -f tsconfig.build.json ]; then
    echo "[precommit] Typechecking..."
    npm run -s typecheck || fail "Type errors detected. Run 'npm run typecheck'."
  fi

  # 5) Run related or minimal tests for changed files when possible
  if echo "$STAGED" | grep -E '\.(ts|tsx|js|jsx)$' >/dev/null 2>&1; then
    if [ -f scripts/prepush-related.js ]; then
      echo "[precommit] Related tests (vitest)..."
      A5C_BASE_REF="origin/a5c/main" node scripts/prepush-related.js || {
        warn "Related tests failed; running vite st fallback."
        npx vitest run --passWithNoTests || fail "Tests failed."
      }
    else
      echo "[precommit] Running minimal tests (vitest)..."
      npx vitest run --passWithNoTests || fail "Tests failed."
    fi
  fi
fi

echo "[precommit] All checks passed."
exit 0

