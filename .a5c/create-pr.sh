#!/bin/sh

set -eu

HEAD_BRANCH=${HEAD_BRANCH:-a5c/main}
BASE_BRANCH=${BASE_BRANCH:-main}
PR_TITLE=${PR_TITLE:-"merge $HEAD_BRANCH into $BASE_BRANCH"}
PR_BODY=${PR_BODY:-"merge $HEAD_BRANCH into $BASE_BRANCH"}
PR_DRAFT=${PR_DRAFT:-true}
PR_LABELS=${PR_LABELS:-}
INITIAL_COMMIT_MESSAGE=${INITIAL_COMMIT_MESSAGE:-"Initial commit for $PR_TITLE"}
INITIAL_COMMIT_FILE_CONTENT=${INITIAL_COMMIT_FILE_CONTENT:-"Initial commit for $PR_TITLE"}
# default to a relative path inside the repo
INITIAL_COMMIT_FILE_NAME=${INITIAL_COMMIT_FILE_NAME:-docs/prs/$HEAD_BRANCH/initial.md}

# Ensure we're inside a git repository
GITHUB_REF=${GITHUB_REF:-$BASE_BRANCH}
GITHUB_USERNAME=${GITHUB_USERNAME:-github-actions[bot]}
GITHUB_EMAIL=${GITHUB_EMAIL:-github-actions[bot]@users.noreply.github.com}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  REPO_DIR=repo
  # Prefer token-authenticated URL to avoid interactive prompts
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

  # Check out requested ref if provided
  if [ "$GITHUB_REF" != "main" ]; then
    if git ls-remote --exit-code --heads origin "$GITHUB_REF" >/dev/null 2>&1; then
      git checkout "$GITHUB_REF"
    else
      git checkout -B "$GITHUB_REF"
    fi
  fi
fi

git config user.name "$GITHUB_USERNAME"
git config user.email "$GITHUB_EMAIL"


# Guard against unresolved template variables
if printf '%s' "$HEAD_BRANCH" | grep -q '{{'; then
  echo "HEAD_BRANCH contains unresolved template variables: $HEAD_BRANCH"
  echo "Skipping until variables are rendered by the event runner."
  exit 0
fi

# Create branch if it doesn't exist (idempotent)
git fetch origin "$BASE_BRANCH" >/dev/null 2>&1 || true

if git ls-remote --exit-code --heads origin "$HEAD_BRANCH" >/dev/null 2>&1; then
  echo "Branch $HEAD_BRANCH already exists on origin"
else
  git checkout -B "$BASE_BRANCH" "origin/$BASE_BRANCH" || git checkout "$BASE_BRANCH"
  git pull --ff-only origin "$BASE_BRANCH" || true
  git checkout -B "$HEAD_BRANCH" "$BASE_BRANCH"

  # Ensure directory exists for the initial file
  mkdir -p "$(dirname "$INITIAL_COMMIT_FILE_NAME")"
  printf "%s\n" "$INITIAL_COMMIT_FILE_CONTENT" > "$INITIAL_COMMIT_FILE_NAME"

  git add -- "$INITIAL_COMMIT_FILE_NAME"
  git commit -m "$INITIAL_COMMIT_MESSAGE" || echo "Nothing to commit"
  git push -u origin "$HEAD_BRANCH"
fi

# Create PR if it doesn't exist
if command -v gh >/dev/null 2>&1; then
  if gh auth status >/dev/null 2>&1; then
    # Check if PR exists
    if [ "$(gh pr list --base "$BASE_BRANCH" --head "$HEAD_BRANCH" --json number --jq 'length' 2>/dev/null || echo 0)" -gt 0 ]; then
      echo "PR for $HEAD_BRANCH -> $BASE_BRANCH already exists"
    else
      PR_BODY_FILE=$(mktemp 2>/dev/null || echo "./pr-body.$$.md")
      printf "%s\n" "$PR_BODY" > "$PR_BODY_FILE"

      DRAFT_OPT=""
      if [ "${PR_DRAFT}" = "true" ]; then
        DRAFT_OPT="--draft"
      fi

      if [ -n "${PR_LABELS}" ]; then
        gh pr create --base "$BASE_BRANCH" --head "$HEAD_BRANCH" --title "$PR_TITLE" --body-file "$PR_BODY_FILE" ${DRAFT_OPT} --label "$PR_LABELS"
      else
        gh pr create --base "$BASE_BRANCH" --head "$HEAD_BRANCH" --title "$PR_TITLE" --body-file "$PR_BODY_FILE" ${DRAFT_OPT}
      fi
      rm -f "$PR_BODY_FILE"
    fi
  else
    echo "gh CLI not authenticated; skipping PR creation."
    exit 0
  fi
else
  echo "gh CLI not installed; skipping PR creation."
  exit 0
fi
