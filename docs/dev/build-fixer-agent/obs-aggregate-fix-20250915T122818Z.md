# CI Fix: Aggregate Observability job fails (local action missing)

- Affected job: Aggregate Observability in `.github/workflows/tests.yml`
- Error: missing local action `.github/actions/obs-aggregate`

## Change

- Add `.github/actions/obs-aggregate/action.yml` composite action that downloads the `observability` artifact and writes a short summary.

## Verification

- Syntax-only; no runtime reproduction in this run. The job will find the local action in subsequent runs.
