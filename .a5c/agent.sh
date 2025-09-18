#!/bin/sh
set -eu
echo "running agent"
GITHUB_REF=${GITHUB_REF:-main}
GITHUB_USERNAME=${GITHUB_USERNAME:-github-actions[bot]}
GITHUB_EMAIL=${GITHUB_EMAIL:-github-actions[bot]@users.noreply.github.com}
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_DIR=repo
  REMOTE_URL="https://github.com/${GITHUB_REPOSITORY}.git"
  if [ "${GITHUB_TOKEN:-}" != "" ]; then
    REMOTE_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
  elif [ "${GH_TOKEN:-}" != "" ]; then
    REMOTE_URL="https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"
  fi

  rm -rf "$REPO_DIR"
  if git clone "$REMOTE_URL" "$REPO_DIR" --depth 1 >/dev/null 2>&1; then
    echo "Cloned repository to $PWD/$REPO_DIR"
  else
    echo "Clone failed; ensure GITHUB_TOKEN or GH_TOKEN is available and has repo scope." >&2
    exit 0
  fi
  cd "$REPO_DIR" || { echo "Cannot cd to $REPO_DIR" >&2; exit 1; }
  echo "Now in repository $PWD"
  if [ "$GITHUB_REF" != "main" ]; then
    if git ls-remote --exit-code --heads origin "$GITHUB_REF" >/dev/null 2>&1; then
      git checkout "$GITHUB_REF"
    else
      git checkout -B "$GITHUB_REF"
    fi
  fi
  # stay in cloned repo for subsequent commands
fi
git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"

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
