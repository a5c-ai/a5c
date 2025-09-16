# Vitest: JUnit + Retries for flaky detection (Issue #333)

## Plan

- Add `test.reporters` including `junit` in `vitest.config.ts`
- Configure `test.outputFile.junit` => `junit.xml`
- Set `test.retry` to a small number (e.g., 2)
- Update `package.json` `test:ci` to include `--reporter=junit --outputFile=junit.xml`
- Update `.github/workflows/tests.yml` to upload `junit.xml` as artifact
- Verify locally via `npm run test:ci`

## Notes

Keeping existing coverage reporters and thresholds intact.
