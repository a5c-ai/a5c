#!/bin/bash
# set -euo pipefail
HEAD_BRANCH=${HEAD_BRANCH:-a5c/main}
BASE_BRANCH=${BASE_BRANCH:-main}
PR_TITLE=${PR_TITLE:-"merge $HEAD_BRANCH into $BASE_BRANCH"}
PR_BODY=${PR_BODY:-"merge $HEAD_BRANCH into $BASE_BRANCH"}
PR_DRAFT=${PR_DRAFT:-true}
PR_LABELS=${PR_LABELS:-}
INITIAL_COMMIT_MESSAGE=${INITIAL_COMMIT_MESSAGE:-"Initial commit for $PR_TITLE"}
INITIAL_COMMIT_FILE_CONTENT=${INITIAL_COMMIT_FILE_CONTENT:-"Initial commit for $PR_TITLE"}
INITIAL_COMMIT_FILE_NAME=${INITIAL_COMMIT_FILE_NAME:-/docs/prs/$HEAD_BRANCH/initial.md}

# create branch if it doesn't exist , but does not fail if it does
# check if branch exists
if gh branch list | grep -q $HEAD_BRANCH; then
  echo "Branch $HEAD_BRANCH already exists"
else
  git fetch origin
  git pull origin $BASE_BRANCH
  git checkout $BASE_BRANCH
  git checkout -b $HEAD_BRANCH
  cat > $INITIAL_COMMIT_FILE_NAME << EOF
$INITIAL_COMMIT_FILE_CONTENT
EOF
  git add $INITIAL_COMMIT_FILE_NAME
  git commit -m "$INITIAL_COMMIT_MESSAGE"
  git push origin $HEAD_BRANCH
fi

# check if PR already exists
if gh pr list --base $BASE_BRANCH --head $HEAD_BRANCH | grep -q $HEAD_BRANCH; then
  echo "PR $HEAD_BRANCH already exists"
else
  PR_BODY_FILE=/tmp/pr-body.md
  cat > $PR_BODY_FILE << EOF
$PR_BODY
EOF
  gh pr create --base $BASE_BRANCH --head $HEAD_BRANCH --title "$PR_TITLE" --body-file $PR_BODY_FILE --draft --label "$PR_LABELS"
  rm $PR_BODY_FILE
fi