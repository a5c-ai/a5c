# Tests workflow_run failure guard

Context: Tests workflow run reported `conclusion: failure` at the run level, while the single job `Unit Tests` completed successfully. Local reproduction also passes.

Plan:

- Add guard in a5c router workflow to only act on workflow_run failures when at least one job has `conclusion: failure`.

Change:

- Update `.github/workflows/a5c.yml` with a pre-check step that queries run jobs via gh and exits early if none failed.

Verification:

- Syntax check via CI.
- Behavior verified logically against current logs; no job-level failures should skip triggering.
