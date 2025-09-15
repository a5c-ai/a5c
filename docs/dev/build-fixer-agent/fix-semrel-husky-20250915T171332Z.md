# CI fix: prevent Husky commit-msg hook from blocking semantic-release on a5c/main

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17740882406
- Failure: @semantic-release/git commit failed due to Husky commit-msg hook enforcing commitlint on generated release commit.

## Plan

- Disable Husky only for semantic-release steps via environment variable `HUSKY=0`.
- Keep Husky active for local dev and other steps.

## Changes

- Patch `.github/workflows/release.yml` to export `HUSKY=0` for the two semantic-release steps.

## Verification

- Run local install/build to ensure no breakage.
- CI should pass the release job on a5c/main.
