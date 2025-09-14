# [Validator] Refactoring – Deduplicate enrich logic and helpers

### Summary
`src/commands/enrich.ts` and `src/enrich.ts` currently implement near-identical logic with small behavioral differences:

- `toBool` accepted values differ (`yes/y` vs `on`).
- `toInt` parsing differs (`parseInt` vs `Number`).

This duplication risks divergence between the CLI path (`cmdEnrich`) and the legacy SDK API (`handleEnrich`).

### Recommendation
- Extract `toBool`/`toInt` into a shared utility (e.g., `src/utils/flags.ts`).
- Make `handleEnrich` a thin delegate to `cmdEnrich` (as done for `handleNormalize`) to guarantee identical behavior and reduce maintenance.

### Acceptance
- Single source of truth for enrich implementation.
- Existing tests (21/21) remain green; add focused unit tests for flag parsing edge cases.

