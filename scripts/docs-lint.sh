#!/usr/bin/env bash
set -euo pipefail

echo "Scanning documentation for banned phrases..."

# Restrict scope to docs and README; exclude generated schema file
if rg -n "composed\\[\\]\\.payload\\s*[:=]\\s*any" README.md docs -S --glob '!docs/specs/ne.schema.json'; then
  echo "Found banned phrase: 'composed[].payload: any' in documentation."
  exit 1
fi

echo "Docs lint passed."
