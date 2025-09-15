#!/usr/bin/env bash
set -euo pipefail

echo "[precommit] Running checks..."

# Allow bypass for emergencies
if [[ "${SKIP_CHECKS:-0}" == "1" ]] || [[ -n "${A5C_SKIP_PRECOMMIT:-}" ]] || [[ -n "${SKIP_PRECOMMIT:-}" ]]; then
  echo "[precommit] SKIP_CHECKS=1 set — skipping all checks"
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

# Whitespace and EOF newline checks using git's built-in checker
if ! git diff --cached --check; then
  echo -e "\n\033[31mError: whitespace/newline issues detected in staged changes.\033[0m"
  echo "Fix trailing whitespace and ensure files end with a newline."
  exit 1
fi

if command -v npx >/dev/null 2>&1 && [[ -f package.json ]]; then
  echo "[precommit] Running lint-staged on staged files"
  if ! npx --yes lint-staged; then
    echo -e "\n\033[31m[precommit] lint-staged reported issues.\033[0m"
    echo "Fix the reported problems or run 'npm run lint' for full context."
    exit 1
  fi
else
  echo "[precommit] npx or package.json not found; skipping lint-staged"
fi

echo "[precommit] All checks passed"
