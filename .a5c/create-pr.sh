#!/bin/bash
set -euo pipefail

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
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not in a git repository; skipping branch and PR creation."
  exit 0
fi

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

      DRAFT_FLAG=()
      if [ "${PR_DRAFT}" = "true" ]; then
        DRAFT_FLAG=(--draft)
      fi

      LABEL_ARGS=()
      if [ -n "${PR_LABELS}" ]; then
        LABEL_ARGS=(--label "$PR_LABELS")
      fi

      gh pr create --base "$BASE_BRANCH" --head "$HEAD_BRANCH" --title "$PR_TITLE" --body-file "$PR_BODY_FILE" "${DRAFT_FLAG[@]}" "${LABEL_ARGS[@]}"
      rm -f "$PR_BODY_FILE"
    fi
  else
    echo "gh CLI not authenticated; skipping PR creation."
  fi
else
  echo "gh CLI not installed; skipping PR creation."
fi
