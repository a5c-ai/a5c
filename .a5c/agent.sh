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
  git remote set-url origin "$REMOTE_URL" >/dev/null 2>&1 || true
  # Proactively fetch ref to avoid shallow missing refs
  CLEAN_REF="$GITHUB_REF"
  case "$CLEAN_REF" in
    refs/heads/*) CLEAN_REF=${CLEAN_REF#refs/heads/} ;;
  esac
  if [ -n "$CLEAN_REF" ]; then
    git fetch --no-tags --depth=1 origin "+refs/heads/$CLEAN_REF:refs/remotes/origin/$CLEAN_REF" >/dev/null 2>&1 || true
  fi
  REF_BRANCH="$GITHUB_REF"
  case "$REF_BRANCH" in
    refs/heads/*) REF_BRANCH=${REF_BRANCH#refs/heads/} ;;
  esac
  if [ -n "$REF_BRANCH" ] && [ "$REF_BRANCH" != "main" ]; then
    if git ls-remote --exit-code --heads origin "$REF_BRANCH" >/dev/null 2>&1; then
      git checkout -B "$REF_BRANCH" "origin/$REF_BRANCH"
    else
      git checkout -B main origin/main || git checkout main
      git checkout -B "$REF_BRANCH" main
    fi
  else
    git checkout -B main origin/main || git checkout main
  fi
  # stay in cloned repo for subsequent commands
fi
git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"

npx -y "$A5C_PKG_SPEC" generate_context \
    --in "$A5C_EVENT_PATH" \
    --template "$A5C_TEMPLATE_URI" \
    --out /tmp/prompt.md | tee /tmp/prompt.md | npx -y "$A5C_PKG_SPEC" run \
    --profile "$A5C_CLI_PROFILE" \
    --mcps "$A5C_MCPS_PATH" > /tmp/out.txt
echo "Output:"
cat /tmp/out.txt
cat /tmp/out.txt | npx -y "$A5C_PKG_SPEC" parse --type codex | tee /tmp/out.json
echo "Events:"
cat /tmp/out.json
echo "Prompt:"
cat /tmp/prompt.md
