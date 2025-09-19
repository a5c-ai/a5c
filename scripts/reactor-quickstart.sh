#!/usr/bin/env bash
set -euo pipefail

# Reactor quickstart: normalize → enrich (offline) → reactor → emit (stdout)
# Usage: scripts/reactor-quickstart.sh [INPUT_JSON]
# If INPUT_JSON is omitted, uses samples/pull_request.synchronize.json

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
INPUT=${1:-"$ROOT_DIR/samples/pull_request.synchronize.json"}
OUT_NE="${TMPDIR:-/tmp}/out.ne.json"
OUT_ENRICHED="${TMPDIR:-/tmp}/out.enriched.json"
OUT_EVENTS="${TMPDIR:-/tmp}/out.events.json"

echo "[quickstart] normalize: $INPUT -> $OUT_NE" >&2
npx -y @a5c-ai/events normalize --in "$INPUT" --out "$OUT_NE"

echo "[quickstart] enrich (offline): $OUT_NE -> $OUT_ENRICHED" >&2
npx -y @a5c-ai/events enrich --in "$OUT_NE" --out "$OUT_ENRICHED"

RULES=".a5c/events/reactor.yaml"
if [[ ! -f "$RULES" ]]; then
  echo "[quickstart] no $RULES; using sample rules at samples/reactor/sample.yaml" >&2
  RULES="$ROOT_DIR/samples/reactor/sample.yaml"
fi

echo "[quickstart] reactor: $OUT_ENRICHED + $RULES -> $OUT_EVENTS" >&2
npx -y @a5c-ai/events reactor --in "$OUT_ENRICHED" --file "$RULES" --out "$OUT_EVENTS"

echo "[quickstart] emit to stdout (redacted)" >&2
npx -y @a5c-ai/events emit --in "$OUT_EVENTS"
