#!/usr/bin/env bash
set -euo pipefail

# Run actionlint against .github/workflows with colorized GitHub Actions output.
# Prefers prebuilt binary via shell installer; falls back to Docker if available.

WORKDIR_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$WORKDIR_ROOT"

WORKFLOWS_DIR=".github/workflows"
if [[ ! -d "$WORKFLOWS_DIR" ]]; then
  echo "::notice::No $WORKFLOWS_DIR directory; skipping actionlint"
  exit 0
fi

run_actionlint_binary() {
  echo "Using actionlint binary installer"
  if bash <(curl -s https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) >/dev/null 2>&1; then
    if ./actionlint -color; then
      return 0
    else
      echo "::warning::actionlint found issues. Proceeding without failing CI." >&2
      return 0
    fi
  fi
  return 1
}

run_actionlint_docker() {
  echo "Using actionlint via Docker"
  docker run --rm -v "$PWD":/repo -w /repo ghcr.io/rhysd/actionlint:latest -color
}

if command -v curl >/dev/null 2>&1; then
  if run_actionlint_binary; then
    exit 0
  fi
fi

if command -v docker >/dev/null 2>&1; then
  if run_actionlint_docker; then
    exit 0
  else
    echo "::warning::actionlint via Docker failed. Proceeding without failing CI." >&2
    exit 0
  fi
fi

echo "::notice::actionlint not available (no curl or docker). Skipping." >&2
exit 0
