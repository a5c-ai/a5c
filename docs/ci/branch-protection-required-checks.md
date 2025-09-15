# Branch Protection: Required Status Checks (a5c/main)

This guide documents the recommended Required Status Checks and how to configure them for the development branch `a5c/main` (and `main` if used as production).

## Summary — Required Checks

Use one of the following gating strategies for PRs targeting `a5c/main` (do not combine both):

- Option A — Individual checks (exact check-run names):
  - `lint` — workflow: `Lint`, job id: `lint`
  - `TypeScript Typecheck (20)` — workflow: `Typecheck`, job name: `TypeScript Typecheck (Node 20)`
  - `TypeScript Typecheck (22)` — workflow: `Typecheck`, job name: `TypeScript Typecheck (Node 22)`
  - `Unit Tests (PR)` — workflow: `PR Quick Tests`, job name: `Unit Tests (PR)`
  - `Conventional Commits validation` — workflow: `Commit Hygiene`, job name: `Conventional Commits validation`

- Option B — Aggregated single gate (faster feedback):
  - `Lint, Typecheck, Unit Tests, Filenames` — workflow: `Quick Checks`, job name: `Lint, Typecheck, Unit Tests, Filenames`

Pushes to `a5c/main` should have:

- Tests — workflow: `Tests`, job: `unit`
- Build — workflow: `Build` (main.yml), jobs: `build`, `test` as applicable
- Release — workflow: `Release` (optional; only on release tagging/policy)

Tip: Avoid redundant gating. Either gate on the individual checks in Option A or on the single aggregated job in Option B. Required status checks must match the exact check-run names shown in the PR UI (usually the job name, or job name plus matrix like `(... 20)`/`(... 22)`).

## Current Repository Workflows

From `.github/workflows`:

- Lint → `.github/workflows/lint.yml` (PR) — job id `lint` (check-run name: `lint`)
- Typecheck → `.github/workflows/typecheck.yml` (PR) — job name `TypeScript Typecheck` with matrix `20`/`22` (check-run names: `TypeScript Typecheck (20)`, `TypeScript Typecheck (22)`)
- PR Quick Tests → `.github/workflows/pr-tests.yml` (PR) — job name `Unit Tests (PR)`
- Commit Hygiene → `.github/workflows/commit-hygiene.yml` (PR) — job name `Conventional Commits validation`
- Quick Checks → `.github/workflows/quick-checks.yml` (PR) — job name `Lint, Typecheck, Unit Tests, Filenames`
- Tests → `.github/workflows/tests.yml` (push) — job `unit` (Unit Tests)
- Build → `.github/workflows/main.yml` (push) — jobs `build`, `test`
- Release → `.github/workflows/release.yml`

## Recommended Branch Protection Settings

- Require status checks to pass before merging: enabled
- Required checks — choose one set:
  - Option A (individual checks):
    - `lint`
    - `TypeScript Typecheck (20)`
    - `TypeScript Typecheck (22)`
    - `Unit Tests (PR)`
    - `Conventional Commits validation`
  - Option B (aggregated):
    - `Lint, Typecheck, Unit Tests, Filenames`
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

Examples (PATCH):

- Option A (individual checks)

```bash
OWNER=a5c-ai
REPO=events
BRANCH=a5c/main

jq -n '{
  required_status_checks: {
    strict: true,
    checks: [
      { context: "lint" },
      { context: "TypeScript Typecheck (20)" },
      { context: "TypeScript Typecheck (22)" },
      { context: "Unit Tests (PR)" },
      { context: "Conventional Commits validation" }
    ]
  },
  enforce_admins: true,
  required_pull_request_reviews: null,
  restrictions: null
}' > /tmp/protection.json

# gh api -X PUT \
#   -H "Accept: application/vnd.github+json" \
#   repos/$OWNER/$REPO/branches/$BRANCH/protection \
#   --input /tmp/protection.json
```

- Option B (aggregated)

```bash
OWNER=a5c-ai
REPO=events
BRANCH=a5c/main

jq -n '{
  required_status_checks: {
    strict: true,
    checks: [
      { context: "Lint, Typecheck, Unit Tests, Filenames" }
    ]
  },
  enforce_admins: true,
  required_pull_request_reviews: null,
  restrictions: null
}' > /tmp/protection.json

# gh api -X PUT \
#   -H "Accept: application/vnd.github+json" \
#   repos/$OWNER/$REPO/branches/$BRANCH/protection \
#   --input /tmp/protection.json
```

Notes:

- Check run names must match what appears in the PR UI for each job. Inspect via: `gh api repos/$OWNER/$REPO/commits/$SHA/check-runs`.
- Matrix jobs create per-matrix check names (e.g., `TypeScript Typecheck (20)`, `TypeScript Typecheck (22)`). Select each one if using Option A.

## Verification

- Open a PR targeting `a5c/main` with a failing lint to confirm merges are blocked
- Repeat for type errors and unit tests
- Confirm “Require branches to be up to date” blocks merges when base branch advances

## References

- Workflows in `.github/workflows/*.yml`
- GitHub Docs: Branch protection rules and required status checks
- Issue: #385
