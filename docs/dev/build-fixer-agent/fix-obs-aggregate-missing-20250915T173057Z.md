# Task: Fix failing Tests workflow - missing local action `.github/actions/obs-aggregate`

## Context
- Failed run: https://github.com/a5c-ai/events/actions/runs/17741113339
- Job: "Aggregate Observability"
- Error: Can't find 'action.yml', 'action.yaml' or 'Dockerfile' under '.github/actions/obs-aggregate'.
- Branch: a5c/main

## Plan
- Add composite action at `.github/actions/obs-aggregate`.
- Download job artifacts and emit an aggregated summary + JSON.
- Keep behavior graceful if artifacts are absent.
- Open PR against `a5c/main` with details and links.

## Notes
- Repo already has `.github/actions/obs-summary` and `.github/actions/obs-collector`.
- This action complements them and unblocks the failing job.
