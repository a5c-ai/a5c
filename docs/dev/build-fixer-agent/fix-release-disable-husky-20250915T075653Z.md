# CI Fix: Disable Husky during semantic-release

## Context

Release workflow run failed at @semantic-release/git “prepare” step while attempting to commit CHANGELOG/package.json. Hooks (Husky) likely intercepted `git commit` (pre-commit / commit-msg), causing non-zero exit.

- Failed run: https://github.com/a5c-ai/events/actions/runs/17725902459
- Failing step: Release (main stable) → @semantic-release/git prepare

## Root Cause

Husky hooks run in CI because postinstall installs hooks. During semantic-release, `git commit` should not be gated by local hooks. This is a known pattern; recommended approach is `HUSKY=0` for release steps.

## Fix

- Add `HUSKY=0` environment variable to both semantic-release steps in `.github/workflows/release.yml`.

## Verification

- Local build succeeds with `npm ci && npm run build`.
- semantic-release will skip Husky in CI; git commit proceeds.

## Follow-ups

- None; keep hooks for developer workflows.
