# Raise unit test coverage: validate.ts, emit.ts branches, reactor.ts

## Context
- Issue: #1088
- Goal: Increase coverage thresholds to Lines/Statements/Branches ≥ 65% and Functions ≥ 75% by adding targeted tests.

## Plan
1. Baseline coverage with `REQUIRE_COVERAGE=true npm run -s test:ci`.
2. Add tests for `src/validate.ts`: `loadSchema`, `validateNE`, `formatErrors` (happy & error paths).
3. Add tests for `src/emit.ts`: cover `resolveOwnerRepo` branches and safe side-effect paths (`script` without labels to avoid token).
4. Add tests for `src/reactor.ts`: exercise handler matching (labels/types/skip/filter_out/metadata) via temporary YAML.
5. Rerun tests and iterate to meet acceptance thresholds.
6. Try removing coverage exclusion for `src/commands/run.ts` if feasible, else keep as-is.

## Notes
- Use Vitest. Avoid network/token dependencies in unit tests.
- Prefer fixtures under `tests/fixtures` and ephemeral temp files.

## Progress Log
- [ ] Baseline coverage
- [ ] Tests added for validate.ts
- [ ] Tests added for emit.ts
- [ ] Tests added for reactor.ts
- [ ] Thresholds met
- [ ] Exclusion revisit for `run.ts`

