# OSV-Scanner Weekly — Implementation Log

Issue: https://github.com/a5c-ai/events/issues/1052

## Summary

Add a scheduled OSV-Scanner job to detect vulnerable dependencies. Provide weekly schedule + manual dispatch, summarize findings in the run summary, optionally upload SARIF, and do not fail by default. Allow failing on high/critical via `vars.OSV_FAIL_ON`.

## Plan

- Create workflow `.github/workflows/osv-scan.yml`
- Triggers: `schedule` (weekly) + `workflow_dispatch`
- Implement scanning of workspace (recursive) and `package-lock.json`
- Generate JSON and SARIF reports, upload artifact and SARIF to code scanning
- Summarize results in `$GITHUB_STEP_SUMMARY`
- Add optional fail gate controlled by `vars.OSV_FAIL_ON` (values: `high`, `critical`)
- Update `.github/workflows/a5c.yml` to include new workflow in `workflow_run` list

## Notes

- Primary branch: `a5c/main` (develop). PR will target this branch.
- Uses `actions/setup-go` + `go install` to install `osv-scanner` CLI for determinism.

## Progress

- Branch created: `ci/osv-scanner-weekly`
- Dependencies installed to enable hooks

## Results

- Added `.github/workflows/osv-scan.yml` with weekly + manual triggers
- Scans workspace and `package-lock.json`, outputs JSON+SARIF, uploads artifacts and SARIF
- Summarizes findings in `$GITHUB_STEP_SUMMARY`
- Optional failure gate via `vars.OSV_FAIL_ON` (high/critical)
- Updated `.github/workflows/a5c.yml` to include "OSV Scanner" in `workflow_run.workflows`
- PR: https://github.com/a5c-ai/events/pull/1065
