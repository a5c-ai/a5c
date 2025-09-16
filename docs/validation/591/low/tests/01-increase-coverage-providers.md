# [Validator] [Tests] - Improve coverage in providers and validate module

## Findings

- Coverage report shows low or zero coverage in some provider entry points (e.g., `src/providers/index.ts`, `src/providers/github/normalize.ts`) and `src/validate.ts`.

## Recommendation

- Add focused unit tests hitting provider entry points and the validate path to raise coverage and guard regressions.

## Priority

- low priority
