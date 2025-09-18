#!/bin/bash
# set -euo pipefail
echo "running agent"
npx -y "$A5C_PKG_SPEC" generate_context \
    --in "$A5C_EVENT_PATH" \
    --template "$A5C_TEMPLATE_URI" \
    --out /tmp/prompt.md
cat /tmp/prompt.md
npx -y "$A5C_PKG_SPEC" run \
    --in /tmp/prompt.md \
    --out /tmp/out.json \
    --profile "$A5C_CLI_PROFILE" \
    --mcps "$A5C_MCPS_PATH"
cat /tmp/out.json
