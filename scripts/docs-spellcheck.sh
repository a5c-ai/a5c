#!/usr/bin/env bash
set -euo pipefail

# Fast spellcheck using typos (https://github.com/crate-ci/typos)
# - Pinned version, cached in runner home
# - Scans README.md and docs/**/*.md (excluding docs/dev and docs/validation)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TYPOS_VERSION="${TYPOS_VERSION:-v1.23.6}"
CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
BIN_DIR="$CACHE_HOME/typos/${TYPOS_VERSION}"
BIN_PATH="$BIN_DIR/typos"
CONFIG_PATH="$ROOT_DIR/typos.toml"

mkdir -p "$BIN_DIR"

if [[ ! -x "$BIN_PATH" ]]; then
  OS="$(uname -s)"; ARCH="$(uname -m)"
  case "$OS:$ARCH" in
    Linux:x86_64)   ASSET="typos-${TYPOS_VERSION}-x86_64-unknown-linux-musl.tar.gz" ;;
    Linux:aarch64)  ASSET="typos-${TYPOS_VERSION}-aarch64-unknown-linux-musl.tar.gz" ;;
    Darwin:arm64)   ASSET="typos-${TYPOS_VERSION}-aarch64-apple-darwin.tar.gz" ;;
    Darwin:x86_64)  ASSET="typos-${TYPOS_VERSION}-x86_64-apple-darwin.tar.gz" ;;
    *) echo "Unsupported platform: $OS $ARCH"; exit 0 ;;
  esac
  URL="https://github.com/crate-ci/typos/releases/download/${TYPOS_VERSION}/${ASSET}"
  TMP_TGZ="$(mktemp)"
  echo "==> Download $URL"
  curl -fsSL "$URL" -o "$TMP_TGZ"
  tar -xzf "$TMP_TGZ" -C "$BIN_DIR"
  chmod +x "$BIN_DIR/typos" || true
fi

export PATH="$BIN_DIR:$PATH"
echo "==> typos version: $(typos --version || true)"

mapfile -t FILES < <(
  find "$ROOT_DIR/docs" -type f -name "*.md" \
    -not -path "*/dev/*" \
    -not -path "*/validation/*" | sort; \
  printf "%s\n" "$ROOT_DIR/README.md"
)

FILTERED=()
for f in "${FILES[@]}"; do
  [[ -f "$f" ]] && FILTERED+=("$f")
done

if [[ ${#FILTERED[@]} -eq 0 ]]; then
  echo "No markdown files to check"
  exit 0
fi

typos --config "$CONFIG_PATH" "${FILTERED[@]}"
