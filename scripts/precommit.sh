#!/usr/bin/env bash
set -euo pipefail

echo "[precommit] Starting checks"

# Allow bypass for emergencies
if [[ "${SKIP_CHECKS:-0}" == "1" ]]; then
  echo "[precommit] SKIP_CHECKS=1 set — skipping all checks"
  exit 0
fi

# Ensure we're in a git repo and have staged files list
if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "[precommit] Not a git repository; skipping"
  exit 0
fi

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACMR || true)

# Guard against Windows-invalid filenames (e.g., ':')
if echo "$STAGED_FILES" | grep -E ':' >/dev/null 2>&1; then
  echo -e "\n\033[31mError: staged filenames contain ':' which breaks Windows checkouts.\033[0m"
  echo "Please rename to use '-' instead."
  echo "$STAGED_FILES" | grep -E ':' || true
  exit 1
fi

# Whitespace and EOF newline checks using git's built-in checker
if ! git diff --cached --check; then
  echo -e "\n\033[31mError: whitespace/newline issues detected in staged changes.\033[0m"
  echo "Fix trailing whitespace and ensure files end with a newline."
  exit 1
fi

# Run lint and typecheck if Node project
if command -v npm >/dev/null 2>&1 && [[ -f package.json ]]; then
  echo "[precommit] Running lint"
  npm run -s lint
  echo "[precommit] Running typecheck"
  npm run -s typecheck

  # Run targeted tests when feasible (if tests or src touched)
  if echo "$STAGED_FILES" | grep -E '^(test|tests|src)/.*\.(ts|tsx|js)$' >/dev/null 2>&1; then
    echo "[precommit] Running unit tests (passWithNoTests)"
    npm run -s test -- --passWithNoTests
  else
    echo "[precommit] No test/source changes detected; skipping unit tests"
  fi
else
  echo "[precommit] npm or package.json not found; skipping Node checks"
fi

echo "[precommit] All checks passed"

