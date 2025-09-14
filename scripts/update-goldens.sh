#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
OUT_DIR="$ROOT_DIR/tests/fixtures/goldens"

mkdir -p "$OUT_DIR"

# Build first
"$ROOT_DIR/scripts/build.sh"

echo "[goldens] Generating normalize/enrich goldens from samples/*.json"

gen_normalize() {
  local in_file="$1"
  local base
  base=$(basename "$in_file" .json)
  node "$ROOT_DIR/dist/cli.js" normalize --in "$in_file" --out "$OUT_DIR/${base}.normalize.json" >/dev/null 2>&1 || true
  # Stabilize
  node -e "const f=process.argv[1];const o=require('node:fs').readFileSync(f,'utf8');const j=JSON.parse(o);import(process.cwd()+'/dist/utils/stable.js').then(m=>{const s=m.stable(j);require('node:fs').writeFileSync(f,JSON.stringify(s,null,2)+'\n')});" "$OUT_DIR/${base}.normalize.json"
}

gen_enrich() {
  local in_file="$1"
  local base
  base=$(basename "$in_file" .json)
  node "$ROOT_DIR/dist/cli.js" enrich --in "$in_file" --out "$OUT_DIR/${base}.enrich.json" >/dev/null 2>&1 || true
  node -e "const f=process.argv[1];const o=require('node:fs').readFileSync(f,'utf8');const j=JSON.parse(o);import(process.cwd()+'/dist/utils/stable.js').then(m=>{const s=m.stable(j);require('node:fs').writeFileSync(f,JSON.stringify(s,null,2)+'\n')});" "$OUT_DIR/${base}.enrich.json"
}

for f in "$ROOT_DIR"/samples/*.json; do
  [ -f "$f" ] || continue
  echo "[goldens] $f"
  gen_normalize "$f"
  gen_enrich "$f"
done

echo "[goldens] Done -> $OUT_DIR"
