#!/usr/bin/env bash
set -euo pipefail

# npm pack smoke: verify the published artifact works when installed from tarball
# - Builds (if needed)
# - Packs the workspace
# - Runs the CLI from the tarball via npx -p file:./<pkg.tgz>

START_TS=$(date +%s%3N)

if [ ! -d dist ]; then
  echo "[pack-smoke] Building project (dist missing)"
  npm run -s build
else
  echo "[pack-smoke] Using existing build artifacts in ./dist"
fi

echo "[pack-smoke] Creating npm pack tarball"
PKG_JSON=$(npm pack --json)
PKG=$(echo "$PKG_JSON" | jq -r '.[0].filename')
if [ -z "${PKG:-}" ] || [ ! -f "$PKG" ]; then
  echo "[pack-smoke] Failed to produce pack tarball" >&2
  echo "$PKG_JSON" >&2 || true
  exit 1
fi
echo "[pack-smoke] Tarball: $PKG"

echo "[pack-smoke] Verify CLI runs from tarball (--version)"
npx -y -p "file:./$PKG" a5c --version

echo "[pack-smoke] Normalize sample and validate via CLI from tarball"
npx -y -p "file:./$PKG" a5c normalize \
  --in samples/workflow_run.completed.json \
  --out /tmp/out.ne.json
# Validate output using ajv-cli (independent of package contents)
npx -y ajv-cli@5.0.0 validate \
  -s docs/specs/ne.schema.json \
  -d /tmp/out.ne.json \
  --spec=draft2020 \
  -c ajv-formats

END_TS=$(date +%s%3N)
DUR=$((END_TS-START_TS))
echo "[pack-smoke] OK: $PKG (duration ${DUR}ms)" | tee -a "$GITHUB_STEP_SUMMARY" 2>/dev/null || true
