# Work Log: Issue #994 — Add `npm run smoke`

Date: 2025-09-19 10:43:00Z
Agent: documenter-agent

## Goal

Add a one-command smoke test (`npm run smoke`) that normalizes → enriches → validates a bundled sample offline, and document it in README. Optionally add a CI job to run smoke on `a5c/main` pushes.

## Plan

- Add `smoke` npm script chaining normalize → enrich → validate
- Update README with a short “Smoke test” snippet
- Add lightweight GitHub Actions workflow `Smoke` on push to `a5c/main` and PRs
- Include `Smoke` in `.github/workflows/a5c.yml` workflow_run list

## Notes

- Uses `samples/pull_request.synchronize.json`
- Produces `out.ne.json` and `out.enriched.json`
- Validation uses `docs/specs/ne.schema.json` with quiet success

## Results

- Added npm script `smoke` in `package.json`
- Updated `README.md` with a "Smoke Test" section under Quick Start
- Added CI workflow: `.github/workflows/smoke.yml` (push to `a5c/main` and quick PRs)
- Registered `Smoke` in `.github/workflows/a5c.yml` workflow_run triggers
- Local run succeeded:
  - `npm run -s smoke` → exit 0
  - Artifacts: `out.ne.json` (~1.6 KB), `out.enriched.json` (~1.8 KB)
