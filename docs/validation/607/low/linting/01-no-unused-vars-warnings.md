# [Low] Lint: no-unused-vars warnings

Category: linting
Priority: low priority

During validation, running `npm run lint` produced 3 warnings:

```
src/cli.ts:142:14  '_' is defined but never used (@typescript-eslint/no-unused-vars)
src/cli.ts:191:19  'output' is assigned a value but never used (@typescript-eslint/no-unused-vars)
src/enrich.ts:527:10  'normalizeCodeCommentLocation' is defined but never used (@typescript-eslint/no-unused-vars)
```

Notes:

- Non-blocking for this PR; unrelated to the change scope.
- Consider removing unused bindings or prefix with `_` only when intentional.

Repro:

- `npm run lint`
