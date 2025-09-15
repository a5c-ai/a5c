## Workflow: Deduplicate JUnit upload step

Context: PR #338 adds JUnit emission to Vitest and uploads `junit.xml` as an artifact in `.github/workflows/tests.yml`. The workflow originally had two separate upload steps for the same `junit.xml` with different artifact names.

Recommendation (non-blocking): Keep a single upload step to avoid redundant artifacts. Current branch keeps `Upload JUnit report` once with name `vitest-junit`.


Rationale: Smaller artifacts footprint and clearer CI outputs.
