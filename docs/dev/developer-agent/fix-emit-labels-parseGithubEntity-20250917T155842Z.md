# Fix: export parseGithubEntity from src/emit.ts

## Context

- Issue: #832 — PR Quick Tests failing: `fn.parseGithubEntity is not a function` in `test/emit.labels.test.ts`.
- Root cause: `parseGithubEntity` defined but not exported from `src/emit.ts`.

## Plan

1. Export `parseGithubEntity` from `src/emit.ts` (named export)
2. Run `npm test` to validate locally
3. Open PR linked to the issue with labels

## Notes

- Similar helper exists in `src/reactor.ts` with optional `number`; tests target the `emit.ts` version that requires `number`.

## Results

- Implemented export in `src/emit.ts`
- Ran `npm test`: all tests passing (162/162)
