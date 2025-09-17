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

# Mode: advisory (default) vs strict (fail on findings)
# Accept values like: true/1/yes to enable strict mode
REQUIRE_ACTIONLINT_RAW=${REQUIRE_ACTIONLINT:-""}
to_lower() { echo "$1" | tr '[:upper:]' '[:lower:]'; }
REQUIRE_ACTIONLINT_NORM=$(to_lower "$REQUIRE_ACTIONLINT_RAW")
if [[ "$REQUIRE_ACTIONLINT_NORM" == "true" || "$REQUIRE_ACTIONLINT_NORM" == "1" || "$REQUIRE_ACTIONLINT_NORM" == "yes" ]]; then
  STRICT=1
else
  STRICT=0
fi

if [[ "$STRICT" -eq 1 ]]; then
  echo "::notice title=actionlint mode::Strict mode enabled via REQUIRE_ACTIONLINT=$REQUIRE_ACTIONLINT_RAW"
else
  echo "::notice title=actionlint mode::Advisory mode (default). Set REQUIRE_ACTIONLINT=true to fail on findings."
fi

run_actionlint_binary() {
  echo "Using actionlint binary installer"
  if bash <(curl -s https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) >/dev/null 2>&1; then
    if ./actionlint -color; then
      return 0
    else
      if [[ "$STRICT" -eq 1 ]]; then
        echo "::error title=actionlint::Found issues and REQUIRE_ACTIONLINT=true — failing." >&2
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
  docker run --rm -v "$PWD":/repo -w /repo ghcr.io/rhysd/actionlint:latest -color
}

if command -v curl >/dev/null 2>&1; then
  run_actionlint_binary
  rc=$?
  if [[ $rc -eq 0 ]]; then
    # Success or advisory-mode findings -> do not try Docker
    exit 0
  elif [[ $rc -eq 2 ]]; then
    # Strict mode findings -> fail immediately and DO NOT try Docker
    exit 2
  fi
  # rc=1 means binary unavailable; fall through to Docker
fi

if command -v docker >/dev/null 2>&1; then
  if run_actionlint_docker; then
    exit 0
  else
    if [[ "$STRICT" -eq 1 ]]; then
      echo "::error::actionlint via Docker failed to run. REQUIRE_ACTIONLINT=true set; failing." >&2
      exit 1
    else
      echo "::warning::actionlint via Docker failed. Proceeding without failing CI (advisory mode)." >&2
      exit 0
    fi
  fi
fi

if [[ "$STRICT" -eq 1 ]]; then
  echo "::error::actionlint not available (no curl or docker) while REQUIRE_ACTIONLINT=true; failing." >&2
  exit 1
else
  echo "::notice::actionlint not available (no curl or docker). Skipping (advisory mode)." >&2
  exit 0
fi
