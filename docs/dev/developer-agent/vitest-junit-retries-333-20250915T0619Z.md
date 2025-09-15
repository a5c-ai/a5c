# Vitest: JUnit + Retries for Flaky Detection (Issue #333)

## Plan

- Use Vitest built-in `junit` reporter with `--reporter=junit --outputFile=junit.xml`.
- Enable `retry` to 2 on CI to surface flakes; keep 0 locally.
- Upload `junit.xml` as artifact in `tests.yml`.

## Changes

- `vitest.config.ts`: ensure `retry` and reporters configured. If env `CI` present, configure `retry: 2` and include `junit`.
- `scripts/test.sh` and `package.json` already run `vitest run`; `test:ci` now emits JUnit via CLI flags.
- `.github/workflows/tests.yml`: added step to upload `junit.xml`.

## Verification

Run locally:

```
CI=1 npm run test:ci
```

Expected: `junit.xml` generated at repo root; coverage summary persists.

## Notes

- Uses built-in Vitest reporter (no extra deps).
- Retries limited to CI to avoid masking local failures.
