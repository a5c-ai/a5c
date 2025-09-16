# Work Log: Normalize --source actions -> provenance.source=action

Issue: #566

## Plan

- Add unit test: `tests/normalize.source-alias.test.ts`
- If failing, coerce `source` alias in `src/commands/normalize.ts`
- Run test suite and open PR

## Context

Schema enforces provenance.source enum: `action|webhook|cli`. CLI help supports `--source actions`. We should accept `actions` but store `action`.
