### Linkage

#### for PRs
When creating a new PR, if it is created for an issue, make sure to add a link to the issue in the PR description in a way that github understands and recognizes it as a link to the issue and will close it when the PR is merged. (in the PR description: fixes #issue-number)

#### for issues
parent<->child: use the /sub_issues and /parent endpoints to link issues. (issue is a part of a bigger issue - for example, when "producing"/"breaking down" a bigger issue into smaller issues)
gh api \
  --method POST \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/OWNER/REPO/issues/ISSUE_NUMBER/sub_issues \
   -F "sub_issue_id=1"

blocking: use the /dependencies/blocked_by to link issues. (issue is blocking another issue - for example, when one issue is preventing the other issue from being developed)

use those endpoints to probe for these relationships as well when needed. (when determining if the work on an issue can be started or blocked)


## for PRs and issues

when creating a new PR, make sure to link the PR to the issue or PR that it is related to in a formal way that github understands and recognizes it as a link to the issue or PR and will close it when the PR is merged.