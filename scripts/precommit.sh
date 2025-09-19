#!/usr/bin/env bash
set -euo pipefail

echo "[precommit] Running checks..."

# Allow bypass for emergencies
if [[ "${SKIP_CHECKS:-0}" == "1" ]] || [[ -n "${A5C_SKIP_PRECOMMIT:-}" ]] || [[ -n "${SKIP_PRECOMMIT:-}" ]]; then
  echo "[precommit] Skip requested via A5C_SKIP_PRECOMMIT=1 or SKIP_PRECOMMIT=1 (or SKIP_CHECKS=1) — skipping all checks"
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

# 2) Block common generated artifacts and large files in staged changes
#    - Ban coverage/** and dist/** anywhere in the path
#    - Fail if any single staged file exceeds the size threshold (default 1 MiB)

# default to 1 MiB; allow override via PRECOMMIT_MAX_SIZE_BYTES
MAX_SIZE_BYTES_DEFAULT=1048576
MAX_SIZE_BYTES="${PRECOMMIT_MAX_SIZE_BYTES:-$MAX_SIZE_BYTES_DEFAULT}"

blocked_paths=()
oversized=()

while IFS= read -r f; do
  [ -z "$f" ] && continue
  # Ignore deletions (already filtered), and only consider regular files
  if [ ! -f "$f" ]; then
    continue
  fi
  # coverage/** or dist/** anywhere in the path
  case "$f" in
    */coverage/*|coverage/*|*/dist/*|dist/*)
      blocked_paths+=("$f")
      ;;
  esac
  # Size check (portable using wc -c)
  bytes=$(wc -c <"$f" | tr -d '[:space:]' || echo 0)
  if [ "$bytes" -gt "$MAX_SIZE_BYTES" ]; then
    oversized+=("$f ($bytes bytes)")
  fi
done <<EOF
$STAGED
EOF

if [ ${#blocked_paths[@]} -gt 0 ]; then
  printf "[precommit] The following staged paths are blocked (generated artifacts):\n" >&2
  for p in "${blocked_paths[@]}"; do printf "  - %s\n" "$p" >&2; done
  fail "Generated output is not committed. Remove coverage/** and dist/** from the commit."
fi

if [ ${#oversized[@]} -gt 0 ]; then
  printf "[precommit] Max allowed file size: %s bytes (override with PRECOMMIT_MAX_SIZE_BYTES)\n" "$MAX_SIZE_BYTES" >&2
  printf "[precommit] The following staged files exceed the size limit:\n" >&2
  for p in "${oversized[@]}"; do printf "  - %s\n" "$p" >&2; done
  fail "One or more staged files are too large. Consider using Git LFS or add to .gitignore if generated."
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

# Optional local secret scan with Gitleaks (opt-in)
# Enable by setting A5C_PRECOMMIT_GITLEAKS=1 or PRECOMMIT_GITLEAKS=1
if [[ "${A5C_PRECOMMIT_GITLEAKS:-0}" == "1" || "${PRECOMMIT_GITLEAKS:-0}" == "1" ]]; then
  if command -v gitleaks >/dev/null 2>&1; then
    echo "[precommit] Running Gitleaks on staged changes (opt-in)"
    # Use verbose output; rely on default repo config if present
    if ! gitleaks protect --staged --no-git -v; then
      echo -e "\n\033[31m[precommit] Gitleaks detected potential secrets in staged changes.\033[0m"
      echo "Review the findings and commit again."
      echo "- To bypass temporarily: unset A5C_PRECOMMIT_GITLEAKS/PRECOMMIT_GITLEAKS or commit with A5C_SKIP_PRECOMMIT=1"
      echo "- For allowlisting guidance, see docs/dev/precommit-hooks.md"
      exit 1
    fi
  else
    echo "[precommit] Gitleaks enabled but 'gitleaks' binary not found; skipping (install to enable)."
  fi
fi

echo "[precommit] All checks passed"
