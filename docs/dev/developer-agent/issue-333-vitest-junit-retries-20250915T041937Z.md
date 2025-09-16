# Issue #333 – Vitest: JUnit + retries

## Context

Add JUnit XML reporting and configure retries to help identify flaky tests. CI should upload the JUnit artifact.

## Plan

- Set Vitest reporters to include `junit` with file output
- Configure `test.retry` (default 2; can gate on CI)
- Ensure `npm run test:ci` emits JUnit
- CI: upload `junit.xml` artifact

## Notes

- Vitest v2 provides built-in `junit` reporter with `outputFile`.
- Keep coverage reporters as-is; add JUnit reporting alongside.
