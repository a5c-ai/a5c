#!/usr/bin/env bash
set -euo pipefail

echo "[precommit] Running checks..."

# Allow bypass for emergencies or CI overrides
if [[ "${SKIP_CHECKS:-0}" == "1" ]] || [[ -n "${A5C_SKIP_PRECOMMIT:-}" ]] || [[ -n "${SKIP_PRECOMMIT:-}" ]]; then
  echo "[precommit] Skipped by env flag."
  exit 0
fi

# Whitespace and EOF newline checks using git's built-in checker
if ! git diff --cached --check; then
  echo -e "\n\033[31mError: whitespace/newline issues detected in staged changes.\033[0m"
  echo "Fix trailing whitespace and ensure files end with a newline."
  exit 1
fi

# Run lint-staged for fast, targeted lint+format on staged files
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
exit 0
