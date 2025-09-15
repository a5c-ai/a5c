# Branch Protection: Required Status Checks (a5c/main)

This guide documents the recommended Required Status Checks and how to configure them for the development branch `a5c/main` (and `main` if used as production).

## Summary — Required Checks

Pull requests targeting `a5c/main` must pass:

- Lint — workflow: `Lint`, job: `lint`
- Typecheck — workflow: `Typecheck`, job: `typecheck` (matrix Node 20, 22)
- PR Quick Tests — workflow: `PR Quick Tests`, job: `vitest` (Unit Tests (PR))
- Commit Hygiene — workflow: `Commit Hygiene`, job: `commit-hygiene` (title + conventional commits)
- Quick Checks — workflow: `Quick Checks`, job: `pr-fast` (aggregates lint, typecheck, tests)

Pushes to `a5c/main` should have:

- Tests — workflow: `Tests`, job: `unit`
- Build — workflow: `Build` (main.yml), jobs: `build`, `test` as applicable
- Release — workflow: `Release` (optional; only on release tagging/policy)

Tip: Avoid redundant gating. Either gate on individual checks (Lint, Typecheck, Unit Tests (PR), Commit Hygiene) or on `Quick Checks` if it fully covers them. Keep names consistent with workflow “name:” and job “name:” to match the check run names visible in PRs.

## Current Repository Workflows

From `.github/workflows`:

- Lint → `.github/workflows/lint.yml` (PR) — job `lint`
- Typecheck → `.github/workflows/typecheck.yml` (PR) — job `typecheck` (TypeScript Typecheck)
- PR Quick Tests → `.github/workflows/pr-tests.yml` (PR) — job `vitest` (Unit Tests (PR))
- Commit Hygiene → `.github/workflows/commit-hygiene.yml` (PR) — job `commit-hygiene` (Conventional Commits validation)
- Quick Checks → `.github/workflows/quick-checks.yml` (PR) — job `pr-fast`
- Tests → `.github/workflows/tests.yml` (push) — job `unit` (Unit Tests)
- Build → `.github/workflows/main.yml` (push) — jobs `build`, `test`
- Release → `.github/workflows/release.yml`

## Recommended Branch Protection Settings

- Require status checks to pass before merging: enabled
- Required checks (proposal):
  - Lint
  - Typecheck (TypeScript Typecheck)
  - Unit Tests (PR)
  - Commit Hygiene (Conventional Commits validation)
  - Quick Checks (if you prefer a single aggregated gate; otherwise omit to avoid duplication)
- Require branches to be up to date before merging: optional (recommended for stability)
- Require pull request reviews before merging: optional
- Dismiss stale approvals when new commits are pushed: optional

## How to Configure (GitHub UI)

1. Settings → Branches → Add rule
2. Branch name pattern: `a5c/main`
3. Check “Require status checks to pass before merging”
4. Search/select each required check by its check run name exactly as it appears in PRs
5. Optionally enable “Require branches to be up to date before merging”
6. Save changes

## How to Configure (API)

Example payload (PATCH):

```bash
OWNER=a5c-ai
REPO=events
BRANCH=a5c/main

jq -n '{
  required_status_checks: {
    strict: true,
    checks: [
      { context: "Lint" },
      { context: "Typecheck" },
      { context: "Unit Tests (PR)" },
      { context: "Conventional Commits validation" },
      { context: "Quick Checks" }
    ]
  },
  enforce_admins: true,
  required_pull_request_reviews: null,
  restrictions: null
}' > /tmp/protection.json

# Note: Requires admin privileges and appropriate token scopes
# gh api -X PUT \
#   -H "Accept: application/vnd.github+json" \
#   repos/$OWNER/$REPO/branches/$BRANCH/protection \
#   --input /tmp/protection.json
```

Notes:

- Check run names must match what appears in the PR UI for each job. You can inspect recent runs via: `gh api repos/$OWNER/$REPO/commits/$SHA/check-runs`.
- If using matrices (like Typecheck on Node 20/22), GitHub may expose per-matrix check names; prefer the overall job name if available.

## Verification

- Open a PR targeting `a5c/main` with a failing lint to confirm merges are blocked
- Repeat for type errors and unit tests
- Confirm “Require branches to be up to date” blocks merges when base branch advances

## References

- Workflows in `.github/workflows/*.yml`
- GitHub Docs: Branch protection rules and required status checks
- Issue: #385
