Hi tmuskal

## 🚑 Fix release failure on a5c/main (semantic-release push blocked)

### Description

- Failed workflow run: https://github.com/a5c-ai/events/actions/runs/17742820758
- Job failed at step "Release (a5c/main prerelease)" during semantic-release prepare:
  - Error: protected branch update failed (GH006) when `@semantic-release/git` tried to push `HEAD:a5c/main`.
  - Message: "5 of 5 required status checks are expected" — direct pushes to protected branch are blocked.

### Plan

- Convert `.releaserc.json` to conditional CJS config.
- Disable `@semantic-release/git` on `a5c/main` prerelease channel to avoid branch pushes.
- Keep tags and package publishing behavior; retain git/changelog commit on `main`.
- Open PR against `a5c/main` with labels build, bug, and high priority.

### Progress

- Analyzed logs; isolated failure to protected branch push from `@semantic-release/git`.
- Prepared changes to conditionally exclude git plugin on `a5c/main`.

### Results (expected after merge)

- On `a5c/main`: semantic-release creates tags and publishes to GitHub Packages without attempting branch push; job passes.
- On `main`: semantic-release continues to update CHANGELOG and package.json via `@semantic-release/git` and publish as before.

### Follow Up

- If we want changelog on `a5c/main` as well, switch to PR-based changelog updates (separate automation) instead of direct pushes.

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
