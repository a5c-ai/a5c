#!/usr/bin/env bash
set -euo pipefail

# Run actionlint against .github/workflows with colorized GitHub Actions output.
# Prefers prebuilt binary via shell installer; falls back to Docker if available.
# Supports opt-in strict mode via env var REQUIRE_ACTIONLINT (truthy → fail on findings).

WORKDIR_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$WORKDIR_ROOT"

WORKFLOWS_DIR=".github/workflows"
if [[ ! -d "$WORKFLOWS_DIR" ]]; then
  echo "::notice::No $WORKFLOWS_DIR directory; skipping actionlint"
  exit 0
fi

is_truthy() {
  local v
  v=$(echo "${1:-}" | tr '[:upper:]' '[:lower:]')
  case "$v" in
    1|true|yes|on|strict) return 0 ;;
    *) return 1 ;;
  esac
}

# Determine mode from REQUIRE_ACTIONLINT
STRICT=false
if is_truthy "${REQUIRE_ACTIONLINT:-}"; then
  STRICT=true
  echo "::notice::actionlint mode: strict"
else
  echo "::notice::actionlint mode: advisory"
fi

run_actionlint_binary() {
  echo "Using actionlint binary installer"
  if bash <(curl -s https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) >/dev/null 2>&1; then
    set +e
    ./actionlint -color
    rc=$?
    set -e
    if [[ $rc -eq 0 ]]; then
      return 0
    else
      if [[ "$STRICT" == true ]]; then
        echo "::error title=Actionlint Findings::actionlint reported issues in workflow files (.github/workflows). Failing due to REQUIRE_ACTIONLINT being truthy."
        return 2
      else
        echo "::warning::actionlint found issues. Proceeding without failing CI (advisory mode)." >&2
        return 0
      fi
    fi
  fi
  return 1
}

run_actionlint_docker() {
  echo "Using actionlint via Docker"
  set +e
  docker run --rm -v "$PWD":/repo -w /repo ghcr.io/rhysd/actionlint:latest -color
  rc=$?
  set -e
  if [[ $rc -eq 0 ]]; then
    return 0
  fi
  # Docker returns 125 for runtime errors (e.g., pull denied, network issues). Treat as advisory skip.
  if [[ $rc -eq 125 ]]; then
    echo "::warning::actionlint via Docker failed (likely no network/registry access). Proceeding without failing CI." >&2
    return 0
  fi
  if [[ "$STRICT" == true ]]; then
    echo "::error title=Actionlint Findings (Docker)::actionlint reported issues when run via Docker. Failing due to REQUIRE_ACTIONLINT being truthy."
    return 2
  else
    echo "::warning::actionlint found issues (Docker). Proceeding without failing CI (advisory mode)." >&2
    return 0
  fi
}

if command -v curl >/dev/null 2>&1; then
  run_actionlint_binary
  rc=$?
  if [[ $rc -eq 0 ]]; then
    exit 0
  fi
  if [[ $rc -eq 2 ]]; then
    # Strict mode: fail CI on findings
    exit 2
  fi
fi

if command -v docker >/dev/null 2>&1; then
  run_actionlint_docker
  rc=$?
  if [[ $rc -eq 0 ]]; then
    exit 0
  fi
  if [[ $rc -eq 2 ]]; then
    # Strict mode via Docker: fail CI on findings
    exit 2
  fi
fi

echo "::notice::actionlint not available (no curl or docker). Skipping." >&2
exit 0
