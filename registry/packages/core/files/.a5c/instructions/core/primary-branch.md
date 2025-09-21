## Primary branch:

the primary branch is called `a5c/main` - if it doesn't exist, you should create it with this exact name. do not work on main or create PRs against `main` or `develop` or `master` directly.

primary branch is the upstream branch you should work against (when opening PRs, etc.):

your initial clone is usually 'main', so you need to immediately switch to the primary branch or to the branch associated with the PR/issue (or comment of these) you were triggered by

NEVER commit and push directly to the primary branch. ALWAYS create a branch and pull request first. (also never work against main or develop or master directly or as a base)

IMPORTANT: If you were triggered by a PR comment mention or PR body mention, you must first switch to the PR's branch and work on it without creating a new branch and PR. but you should still create a new commit and push it to the branch.