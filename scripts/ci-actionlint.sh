#!/usr/bin/env bash
set -euo pipefail

# Run actionlint against .github/workflows with colorized GitHub Actions output.
# Strategy: for PRs, only check changed workflow files to avoid legacy failures.
# Prefers prebuilt binary via shell installer; falls back to Docker if available.

WORKDIR_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$WORKDIR_ROOT"

WORKFLOWS_DIR=".github/workflows"
if [[ ! -d "$WORKFLOWS_DIR" ]]; then
  echo "::notice::No $WORKFLOWS_DIR directory; skipping actionlint"
  exit 0
fi

BASE_REF="${GITHUB_BASE_REF:-}"
if [[ -z "$BASE_REF" ]]; then
  # Default to a5c/main if present, else main
  if git ls-remote --exit-code --heads origin a5c/main >/dev/null 2>&1; then
    BASE_REF="a5c/main"
  else
    BASE_REF="main"
  fi
fi

# Ensure base ref is available for diff
git fetch --no-tags --depth=1 origin "$BASE_REF" >/dev/null 2>&1 || true

# Determine changed workflow files for PRs
CHANGED_WORKFLOWS=$(git diff --name-only --diff-filter=ACMR "origin/$BASE_REF"...HEAD -- "$WORKFLOWS_DIR" | tr '\n' ' ')

if [[ -z "$CHANGED_WORKFLOWS" ]]; then
  echo "::notice::No changed workflow files relative to $BASE_REF; skipping actionlint"
  exit 0
fi

run_actionlint_binary() {
  echo "Using actionlint binary installer"
  bash <(curl -s https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) >/dev/null 2>&1
  ./actionlint -color $CHANGED_WORKFLOWS
}

run_actionlint_docker() {
  echo "Using actionlint via Docker"
  docker run --rm -v "$PWD":/repo -w /repo ghcr.io/rhysd/actionlint:latest -color $CHANGED_WORKFLOWS
}

if command -v curl >/dev/null 2>&1; then
  if run_actionlint_binary; then
    exit 0
  fi
fi

if command -v docker >/dev/null 2>&1; then
  run_actionlint_docker
  exit 0
fi

echo "::error::actionlint not available (no curl or docker)." >&2
exit 2
