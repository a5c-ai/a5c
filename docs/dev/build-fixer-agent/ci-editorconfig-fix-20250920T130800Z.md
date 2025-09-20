## Task

Fix Quick Checks failure due to EditorConfig non-compliance in `.a5c/scripts/agent.sh` (missing final newline).

## Plan

- Analyze failing run logs (17880191514) to identify failing step
- Verify offending file and rule locally
- Add final newline to file; keep LF line endings
- Run `scripts/ci-editorconfig.sh` locally to confirm pass
- Open PR from `a5c/main` to `main`

## Actions

- Added trailing newline to `.a5c/scripts/agent.sh`
- Verified locally: `scripts/ci-editorconfig.sh` passes

## Run Context

- Workflow: Quick Checks
- Run URL: https://github.com/a5c-ai/events/actions/runs/17880191514
- Head: 247b3a652f17776fc37b8643e2552fcb9f1d227f on `a5c/main`

## Notes

- actionlint reported advisory warnings unrelated to this failure (unknown label `ubuntu-latest-m`, unknown permission scope `models`, and invalid `uses: /action.yml` format). These did not fail the job but should be addressed separately.
