# [Low] Tests: incorrect issue reference in comment

- Category: tests
- Priority: low
- Context: PR #633

### Observation

In `tests/normalize.source-alias.test.ts`, the header comment references issue `#566`:

```ts
// per the schema enum and product requirement in issue #566. Cover both API and CLI.
```

However, the work tracked here is for issue `#560`.

### Impact

Purely cosmetic; no functional impact. Might confuse traceability when skimming tests.

### Suggestion

Update the inline comment to reference `#560` for accuracy.
