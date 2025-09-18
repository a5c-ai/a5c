#!/bin/sh
echo "running agent"
GITHUB_REF=${GITHUB_REF:-main}
GITHUB_USERNAME=${GITHUB_USERNAME:-github-actions[bot]}
GITHUB_EMAIL=${GITHUB_EMAIL:-github-actions[bot]@users.noreply.github.com}
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if [ "$GITHUB_REF" != "main" ]; then
    git clone "https://github.com/${GITHUB_REPOSITORY}.git" repo --depth 1
    echo "Cloned repository to $PWD/repo"
    cd repo
    echo "Now in repository $PWD"
    # check if branch exists
    if git ls-remote --exit-code --heads origin "$GITHUB_REF" >/dev/null 2>&1; then
      git checkout "$GITHUB_REF"
    else
      git checkout -B "$GITHUB_REF"
    fi
  else
    git clone "https://github.com/${GITHUB_REPOSITORY}.git" repo --depth 1
    echo "Cloned repository to $PWD/repo"
    cd repo
    echo "Now in repository $PWD"
  fi
  # exit 0
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
