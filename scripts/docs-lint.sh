#!/usr/bin/env bash
set -euo pipefail

# Simple docs linter for outdated composed[].payload type references.
# Exits with non-zero status if violations found, unless A5C_DOCS_LINT_WARN=1.

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT_DIR"

# Flag only the explicit outdated phrasing in the same line as composed[].payload
violations=$(rg -n --no-heading --color never "composed\[\]\.payload[^\n]*\bany\b" docs README.md || true)

if [[ -n "$violations" ]]; then
  echo "[docs-lint] Found outdated 'any' references for composed[].payload:" >&2
  echo "$violations" >&2
  if [[ "${A5C_DOCS_LINT_WARN:-0}" == "1" ]]; then
    echo "[docs-lint] WARN mode enabled; not failing CI." >&2
    exit 0
  fi
  exit 1
else
  echo "[docs-lint] OK — no outdated 'any' references found."
fi
