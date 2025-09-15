#!/usr/bin/env bash
set -euo pipefail

# Optional Codecov upload helper
# - No-op when CODECOV_TOKEN is unset or coverage file missing
# - Tries to use the Codecov uploader (downloads locally if absent)
# - Never fails the build: exits 0 on uploader errors
#
# Env vars:
#   CODECOV_TOKEN   (required to upload; otherwise script no-ops)
#   CODECOV_SLUG    (owner/repo; defaults to $GITHUB_REPOSITORY or derived from git remote)
#   CODECOV_URL     (base URL; defaults to https://codecov.io)
#   CODECOV_FLAGS   (comma-separated flags, e.g., "tests,vitest")
#   CODECOV_NAME    (upload name; defaults to CI job name if available)
#   CODECOV_FILE    (path to lcov; defaults to coverage/lcov.info)

log() { echo "[coverage-upload] $*"; }
warn() { echo "[coverage-upload] WARN: $*" >&2; }

CODECOV_FILE=${CODECOV_FILE:-coverage/lcov.info}
CODECOV_URL=${CODECOV_URL:-https://codecov.io}

if [[ -z "${CODECOV_TOKEN:-}" ]]; then
  log "CODECOV_TOKEN not set; skipping upload."
  exit 0
fi

if [[ ! -f "$CODECOV_FILE" ]]; then
  log "Coverage file not found at '$CODECOV_FILE'; skipping upload."
  exit 0
fi

# Derive slug (owner/repo)
if [[ -n "${CODECOV_SLUG:-}" ]]; then
  slug="$CODECOV_SLUG"
elif [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
  slug="$GITHUB_REPOSITORY"
else
  # Try from git remote
  if url=$(git config --get remote.origin.url 2>/dev/null); then
    # supports git@github.com:owner/repo.git and https urls
    slug=$(echo "$url" | sed -E 's#(git@|https?://)([^/:]+)[:/](.+)(\.git)?#\3#')
  else
    slug=""
  fi
fi

name=${CODECOV_NAME:-${GITHUB_JOB:-local}}
flags=${CODECOV_FLAGS:-}

# Find or download the Codecov uploader
uploader=""
if command -v codecov >/dev/null 2>&1; then
  uploader=$(command -v codecov)
else
  # Attempt to download latest uploader for linux; fallback to bash uploader if needed
  tmpdir=$(mktemp -d)
  trap 'rm -rf "$tmpdir"' EXIT
  os=$(uname -s | tr '[:upper:]' '[:lower:]')
  arch=$(uname -m)
  case "$arch" in
    x86_64|amd64) arch="x86_64" ;;
    aarch64|arm64) arch="arm64" ;;
    *) arch="x86_64" ;;
  esac
  url_bin="https://uploader.codecov.io/latest/${os}/${arch}/codecov"
  log "Downloading Codecov uploader from ${url_bin} ..."
  if curl -fsSL "$url_bin" -o "$tmpdir/codecov"; then
    chmod +x "$tmpdir/codecov"
    uploader="$tmpdir/codecov"
  else
    warn "Failed to download Codecov uploader binary; trying legacy bash uploader."
    if curl -fsSL https://codecov.io/bash -o "$tmpdir/codecov.bash"; then
      chmod +x "$tmpdir/codecov.bash"
      uploader="$tmpdir/codecov.bash"
    else
      warn "Could not obtain any Codecov uploader. Skipping."
      exit 0
    fi
  fi
fi

args=(
  -t "$CODECOV_TOKEN"
  -f "$CODECOV_FILE"
)

if [[ -n "$slug" ]]; then
  args+=( -r "$slug" )
fi

if [[ -n "$name" ]]; then
  args+=( -n "$name" )
fi

if [[ -n "$flags" ]]; then
  args+=( -F "$flags" )
fi

log "Uploading coverage: file='$CODECOV_FILE' repo='${slug:-unknown}' name='$name' flags='${flags:-}'"

set +e
"$uploader" "${args[@]}"
code=$?
set -e

if [[ $code -ne 0 ]]; then
  warn "Codecov upload exited with status $code; continuing without failing the build."
else
  log "Codecov upload completed successfully."
fi

exit 0
