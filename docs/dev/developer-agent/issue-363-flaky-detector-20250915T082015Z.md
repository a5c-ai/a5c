# Issue 363 – Flaky test detector (JUnit + retries)

## Plan
- Parser: read `junit.xml`, mark tests with retries or fail->pass in run.
- Workflow: step after tests to collect flakies; comment + `flaky-test` label on PRs.
- Optional per-test issues (behind env flag), aggregate history via issue updates.
- Unit tests: sample JUnit fixtures; parser returns structured summary.

## Notes
- Vitest config already emits `junit.xml` and enables retries on CI.
- Tests workflow uploads `junit.xml`; we will also parse it inline.
