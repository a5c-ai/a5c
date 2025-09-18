#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Guard 1: Fail if legacy file exists
if [ -f docs/schemas/observability.schema.json ]; then
  echo "::error title=Observability Schema Duplicate::Found legacy docs/schemas/observability.schema.json. Remove it and use docs/specs/observability.schema.json."
  exit 1
fi

# Guard 2: Ensure only one observability.schema.json under docs and it's in specs
mapfile -t OBS_FILES < <(find docs -type f -name 'observability.schema.json' | sort)
ALLOWED='docs/specs/observability.schema.json'
if [ ${#OBS_FILES[@]} -eq 0 ]; then
  echo "::error title=Observability Schema Missing::Expected $ALLOWED but none found."
  exit 1
fi
for f in "${OBS_FILES[@]}"; do
  if [ "$f" != "$ALLOWED" ]; then
    echo "::error title=Observability Schema Duplicate::Unexpected schema file: $f (only $ALLOWED is allowed)."
    exit 1
  fi
done

# Guard 3: Ensure no references to the legacy exact path string exist in repo
if rg -n -S 'docs/schemas/observability\.schema\.json' \
  -g '!*package-lock.json' \
  -g '!scripts/lint-obs-paths.sh' \
  . >/dev/null; then
  echo "::error title=Legacy Path Reference Found::References to docs/schemas/observability.schema.json detected; update to $ALLOWED."
  rg -n -S 'docs/schemas/observability\.schema\.json' -g '!*package-lock.json' . || true
  exit 1
fi

echo "Observability schema path lint passed."
