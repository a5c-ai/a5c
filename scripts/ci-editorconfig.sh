#!/usr/bin/env bash
set -euo pipefail

# Run editorconfig-checker using npx so we don't add a devDependency.
# Use github-actions output format for better annotations.
# Allow pinning the version via env var EDITORCONFIG_CHECKER_VERSION
# to avoid breakages from `@latest`.

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT"

if ! [ -f .editorconfig ]; then
  echo "::notice::.editorconfig not found; skipping editorconfig-checker"
  exit 0
fi

# Exclude non-source and generated/log files that don't need strict EditorConfig conformance
# - LICENSE: preserve upstream formatting
# - docs/dev/**: development logs/plans produced by agents
# - *.out, run.log, run.view.err: local/output logs
# - actionlint: bundled binary
# Also exclude docs and all Markdown files to avoid false positives on prose/code fences
# Note: use single backslashes in regex; passed as-is to the tool
EXCLUDE_REGEX='(^LICENSE$|^docs/|\.out$|^run\.log$|^run\.view\.err$|^actionlint$|\.md$|^tmp\.|^\.editorconfig-checker\.json$)'

# Ensure stray config file from local/dev does not affect CI
rm -f .editorconfig-checker.json || true

# Resolve version: allow override via EDITORCONFIG_CHECKER_VERSION, default pinned
EC_VERSION="${EDITORCONFIG_CHECKER_VERSION:-5.1.9}"
echo "Using editorconfig-checker@${EC_VERSION}"

# Detect support for github-actions formatter; older versions may not support -format
FORMAT_ARGS=""
if npx --yes "editorconfig-checker@${EC_VERSION}" -help 2>&1 | grep -q -- "-format"; then
  FORMAT_ARGS="-format github-actions"
fi

# Execute with consistent flags for CI annotations when available. Avoid forcing color flags
# to keep compatibility with older versions that only support -no-color.
npx --yes editorconfig-checker@"${EC_VERSION}" \
  ${FORMAT_ARGS} \
  -exclude "$EXCLUDE_REGEX" || exit $?
