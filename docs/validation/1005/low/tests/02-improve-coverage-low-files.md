# [Validator] [Tests] - Improve coverage in low/zero-covered modules

### Summary

Several modules remain with very low or zero coverage. Not required for this PR, but we should add unit tests to improve maintainability and confidence.

### Candidates (from local run)

- `src/commands/run.ts` — 0%
- `src/validate.ts` — 0%
- `src/providers/types.ts` — 0%
- `src/providers/github/index.ts` — low
- `src/emit.ts` — low lines/branches
- `src/reactor.ts` — low lines/branches

### Acceptance Criteria

- Add targeted unit tests for at least the zero-covered files.
- Raise overall coverage headroom by ~1–2% without flaky tests.
