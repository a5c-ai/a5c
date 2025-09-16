#!/usr/bin/env bash
set -euo pipefail

# Optional Codecov uploader wrapper.
# - No-op (exit 0) if CODECOV_TOKEN is missing/empty.
# - No-op (exit 0) if coverage file is missing.
# - Supports optional envs: CODECOV_FLAGS, CODECOV_BUILD, CODECOV_URL, CODECOV_DRY

main() {
  local lcov_file="${1:-coverage/lcov.info}"

  if [[ "${CODECOV_DRY:-0}" != "0" ]]; then
    echo "[coverage-upload] DRY RUN enabled (CODECOV_DRY=${CODECOV_DRY})" >&2
  fi

  if [[ -z "${CODECOV_TOKEN:-}" ]]; then
    echo "[coverage-upload] CODECOV_TOKEN not set — skipping upload." >&2
    exit 0
  fi

  if [[ ! -f "$lcov_file" ]]; then
    echo "[coverage-upload] File not found: $lcov_file — skipping upload." >&2
    exit 0
  fi

  # Default Codecov URL (can be overridden for self-hosted)
  local base_url="${CODECOV_URL:-https://codecov.io}"
  local uploader_url="$base_url/bash"

  echo "[coverage-upload] Uploading $lcov_file to $base_url (flags='${CODECOV_FLAGS:-}' build='${CODECOV_BUILD:-}')" >&2

  if [[ "${CODECOV_DRY:-0}" != "0" ]]; then
    echo "curl -sSf $uploader_url | bash -s -- -t ******** -f $lcov_file ${CODECOV_FLAGS:+-F $CODECOV_FLAGS} ${CODECOV_BUILD:+-B $CODECOV_BUILD}" >&2
    exit 0
  fi

  # shellcheck disable=SC2086
  curl -sSf "$uploader_url" | bash -s -- \
    -t "$CODECOV_TOKEN" \
    -f "$lcov_file" \
    ${CODECOV_FLAGS:+-F "$CODECOV_FLAGS"} \
    ${CODECOV_BUILD:+-B "$CODECOV_BUILD"}
}

main "$@"
