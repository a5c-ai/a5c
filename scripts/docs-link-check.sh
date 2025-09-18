#!/usr/bin/env bash
set -euo pipefail

# Lightweight docs links check using lychee
# - Installs a pinned lychee binary and caches it between runs
# - Scans README.md and docs/**/*.md (excluding docs/dev and docs/validation)
# - Fails only on definite broken links; tolerates common false positives via lychee.toml

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LYCHEE_VERSION="${LYCHEE_VERSION:-v0.15.1}"
CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
LYCHEE_CACHE_DIR="$CACHE_HOME/lychee/${LYCHEE_VERSION}"
LYCHEE_BIN="$LYCHEE_CACHE_DIR/lychee"
OUT_DIR="$ROOT_DIR/.tmp/lychee"
OUT_LOG="$OUT_DIR/run.log"
OUT_SUMMARY="$OUT_DIR/summary.md"

mkdir -p "$LYCHEE_CACHE_DIR" "$OUT_DIR"

echo "==> Docs Links: preparing lychee ${LYCHEE_VERSION}"

if [[ ! -x "$LYCHEE_BIN" ]]; then
  OS="$(uname -s)"; ARCH="$(uname -m)"
  case "$OS:$ARCH" in
    Linux:x86_64)
      TARBALL="lychee-${LYCHEE_VERSION}-x86_64-unknown-linux-gnu.tar.gz" ;;
    Linux:aarch64)
      TARBALL="lychee-${LYCHEE_VERSION}-aarch64-unknown-linux-gnu.tar.gz" ;;
    Darwin:arm64)
      TARBALL="lychee-${LYCHEE_VERSION}-aarch64-apple-darwin.tar.gz" ;;
    Darwin:x86_64)
      TARBALL="lychee-${LYCHEE_VERSION}-x86_64-apple-darwin.tar.gz" ;;
    *)
      echo "Unsupported platform: $OS $ARCH" >&2
      exit 0 # do not fail docs checks for unsupported runners
      ;;
  esac
  URL="https://github.com/lycheeverse/lychee/releases/download/${LYCHEE_VERSION}/${TARBALL}"
  TMP_TGZ="$(mktemp)"
  echo "==> Downloading $URL"
  curl -fsSL "$URL" -o "$TMP_TGZ"
  tar -xzf "$TMP_TGZ" -C "$LYCHEE_CACHE_DIR"
  # The tar contains a 'lychee' binary; ensure it exists and is executable
  if [[ ! -f "$LYCHEE_CACHE_DIR/lychee" ]]; then
    # Sometimes binaries are nested in a directory; find and move
    FOUND="$(tar -tzf "$TMP_TGZ" | grep -E '/?lychee$' | head -n1 || true)"
    if [[ -n "$FOUND" ]]; then
      tar -xzf "$TMP_TGZ" -C "$LYCHEE_CACHE_DIR" "$FOUND"
      mv -f "$LYCHEE_CACHE_DIR/${FOUND}" "$LYCHEE_CACHE_DIR/lychee"
    fi
  fi
  chmod +x "$LYCHEE_CACHE_DIR/lychee"
fi

export PATH="$LYCHEE_CACHE_DIR:$PATH"

if ! command -v lychee >/dev/null 2>&1; then
  echo "lychee binary not available; skipping docs links check" >&2
  exit 0
fi

echo "==> lychee version: $(lychee --version || true)"

# Build the file list
echo "==> Collecting markdown files"
mapfile -t FILES < <(
  find "$ROOT_DIR/docs" -type f -name "*.md" \
    -not -path "*/dev/*" \
    -not -path "*/validation/*" | sort; \
  printf "%s\n" "$ROOT_DIR/README.md"
)

FILTERED_FILES=()
for f in "${FILES[@]}"; do
  [[ -f "$f" ]] && FILTERED_FILES+=("$f")
done

if [[ ${#FILTERED_FILES[@]} -eq 0 ]]; then
  echo "No markdown files found; nothing to check."
  exit 0
fi

CONFIG_PATH="$ROOT_DIR/lychee.toml"
if [[ ! -f "$CONFIG_PATH" ]]; then
  echo "Missing lychee.toml at repo root; using defaults"
fi

echo "==> Running lychee on ${#FILTERED_FILES[@]} files"

set +e
lychee --no-progress ${CONFIG_PATH:+--config "$CONFIG_PATH"} "${FILTERED_FILES[@]}" 2>&1 | tee "$OUT_LOG"
RC=${PIPESTATUS[0]}
set -e

# Prepare a short summary
BROKEN_COUNT=$(grep -E "^\s*[0-9]+\s+Errors" -i "$OUT_LOG" | awk '{print $1}' | tail -n1 || true)
BROKEN_COUNT=${BROKEN_COUNT:-0}

{
  echo "# Docs Links Check"
  echo
  echo "- lychee: ${LYCHEE_VERSION}"
  echo "- files checked: ${#FILTERED_FILES[@]}"
  echo "- result: $([[ $RC -eq 0 ]] && echo "success" || echo "failure")"
  if [[ "$BROKEN_COUNT" != "0" ]]; then
    echo
    echo "## Broken Links"
    # Extract the error section from lychee output for quick triage
    awk '/Errors \(/,/====================/ {print}' "$OUT_LOG" | sed 's/^/  /'
  fi
} > "$OUT_SUMMARY"

if [[ -n "${GITHUB_STEP_SUMMARY:-}" && -f "$OUT_SUMMARY" ]]; then
  cat "$OUT_SUMMARY" >> "$GITHUB_STEP_SUMMARY"
fi

# Exit with lychee's status (non-zero only for definite broken links per config)
exit "$RC"
