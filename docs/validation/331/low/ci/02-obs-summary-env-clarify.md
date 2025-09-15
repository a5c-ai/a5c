# [Validator] [CI] - Clarify env inputs for obs-summary

Priority: low

## Context

The composite action `.github/actions/obs-summary` supports optional env overrides (`OBS_FILE`, `JOB_NAME`, `WORKFLOW_NAME`, etc.). The README shows `OBS_FILE` and `JOB_NAME` briefly, but not the rest.

## Recommendation

- Expand the README to list supported env overrides with defaults (resolved from GitHub-provided envs).

## Suggested Addendum (README)

```
Inputs via env (all optional):
- OBS_FILE (default: `observability.json`)
- JOB_NAME (default: `$GITHUB_JOB`)
- WORKFLOW_NAME (default: `$GITHUB_WORKFLOW`)
- RUN_ID (default: `$GITHUB_RUN_ID`)
- RUN_ATTEMPT (default: `$GITHUB_RUN_ATTEMPT`)
- REPO (default: `$GITHUB_REPOSITORY`)
- SHA (default: `$GITHUB_SHA`)
- BRANCH_REF (default: `$GITHUB_REF`)
- CONCLUSION (default: empty)
```

## Rationale

Documents behavior without changing code; helps reusers in mono-repos and matrix jobs.
