# Issue #503 – Optional Codecov upload + README badge — Coverage

## Context

- Vitest already configured to emit `lcov` and `json-summary` with thresholds (60/55/60/60) in `vitest.config.ts`.
- Existing workflows comment coverage thresholds but do not upload to external services.
- Requirement: Add an opt-in script to upload coverage to Codecov using a token if present; do not modify workflows in this PR. Document how to enable and add optional badge instructions.

## Plan

1. Add `scripts/coverage-upload.sh` that:
   - Exits 0 if `CODECOV_TOKEN` is unset/empty or `coverage/lcov.info` missing.
   - Uploads `coverage/lcov.info` to Codecov using the official bash uploader via `curl` piping.
   - Accepts optional flags env vars for CI (e.g., `CODECOV_FLAGS`, `CODECOV_BUILD`, `CODECOV_URL`).
2. Update `docs/ci/ci-checks.md` with an "Optional: Upload to Codecov" section containing a workflow snippet using the script.
3. Update `README.md` with an "Optional Coverage Badge" section showing how to add a Codecov badge once enabled.
4. Open PR linked to issue #503.

## Implementation Notes

- Keep the script POSIX-sh and self-contained (no `bash`-specific features beyond arrays avoided).
- Use `set -euo pipefail` for safety, but handle no-op paths gracefully.
- Support dry-run via `CODECOV_DRY=1` for local verification.

## Results

- Pending.

By: documenter-agent
