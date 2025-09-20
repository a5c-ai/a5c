#!/usr/bin/env bash
set -euo pipefail

# Labels a PR based on size (additions + deletions) using GitHub API.
# Requires: GH_TOKEN in env (provided by GitHub Actions), and repo context.

REPO_FULL=${GITHUB_REPOSITORY:?missing}
PR_NUMBER=${1:-${PR_NUMBER:-}}

if [[ -z "$PR_NUMBER" ]]; then
  echo "Usage: pr-size-labels.sh <pr-number>" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI is required" >&2
  exit 2
fi

# Fetch PR stats
json=$(gh api repos/${REPO_FULL}/pulls/${PR_NUMBER})
additions=$(echo "$json" | jq -r '.additions // 0')
deletions=$(echo "$json" | jq -r '.deletions // 0')
changed=$(( additions + deletions ))

# Size buckets (can be overridden via env)
XS_MAX=${XS_MAX:-9}
S_MAX=${S_MAX:-49}
M_MAX=${M_MAX:-199}
L_MAX=${L_MAX:-499}

label="size:XL" # default to XL for >= 500
if (( changed <= XS_MAX )); then label="size:XS";
elif (( changed <= S_MAX )); then label="size:S";
elif (( changed <= M_MAX )); then label="size:M";
elif (( changed <= L_MAX )); then label="size:L";
fi

# Ensure labels exist (idempotent)
declare -A COLORS=(
  ["size:XS"]="0e8a16"
  ["size:S"]="2cbe4e"
  ["size:M"]="fbca04"
  ["size:L"]="f66a0a"
  ["size:XL"]="e11d21"
)

for L in "${!COLORS[@]}"; do
  if ! gh label view "$L" --repo "$REPO_FULL" >/dev/null 2>&1; then
    gh label create "$L" --color "${COLORS[$L]}" --description "PR size bucket $L" --repo "$REPO_FULL" >/dev/null 2>&1 || true
  fi
done

# Remove size:* labels then add the desired one
existing=$(gh pr view "$PR_NUMBER" --repo "$REPO_FULL" --json labels --jq '.labels[].name' | grep -E '^size:' || true)
for L in $existing; do
  if [[ "$L" != "$label" ]]; then
    gh pr edit "$PR_NUMBER" --repo "$REPO_FULL" --remove-label "$L" || true
  fi
done
gh pr edit "$PR_NUMBER" --repo "$REPO_FULL" --add-label "$label"
echo "Labeled PR #$PR_NUMBER with '$label' (changed=$changed)"
