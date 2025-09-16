# Issue #81: Packages Npx Test Workflow

## Context

Create a GitHub Actions workflow that authenticates to GitHub Packages and runs `npx @a5c-ai/events` to validate install + execution from the org registry.

## Plan

- Add `.github/workflows/packages-npx-test.yml` with:
  - triggers: push on `a5c/main`, manual `workflow_dispatch`
  - auth: `actions/setup-node@v4` with `registry-url` and scope, `NODE_AUTH_TOKEN`
  - run: `npx -y @a5c-ai/events --help` and print version
- Update `.github/workflows/a5c.yml` to include workflow in `on.workflow_run.workflows`
- Open PR linking to issue #81
- After CI, mark ready and request validator review

## Notes

- Auth follows GitHub Packages guide. Uses `${{ secrets.A5C_AGENT_GITHUB_TOKEN || secrets.GITHUB_TOKEN }}` with `packages: read`.
