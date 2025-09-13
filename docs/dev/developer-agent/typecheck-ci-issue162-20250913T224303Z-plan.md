# Add TypeScript type-check gate on PRs — Plan

## Context
Issue: #162 — Add quick `tsc --noEmit` job on PRs.

## Approach
- Reuse `.github/workflows/lint.yml` and add a separate `typecheck` job.
- Use Node 22 with npm cache.
- Command: `npm ci && npm run typecheck`.
- Scope: trigger on PRs to `a5c/main` and `main`.

## Acceptance
- Job fails on TS errors; runs in < 1 min warm cache.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
