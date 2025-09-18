# Build Fix: Gitleaks license failure and fallback scanner

## Context

- Failed workflow: `.github/workflows/gitleaks.yml` (Secret Scan (Gitleaks))
- Failing run: https://github.com/a5c-ai/events/actions/runs/17828576211
- Trigger: push to `main` at commit `be7e627cbc1225ad973022511852e0b3b3a9a5b8`
- Error observed:
  - `missing gitleaks license ... store it as a GitHub Secret named GITLEAKS_LICENSE`
  - `Unexpected input(s) 'args'` warning from `gitleaks/gitleaks-action@v2`

## Root Cause

- The repository belongs to an organization, and `gitleaks/gitleaks-action@v2` now requires a `GITLEAKS_LICENSE` secret for orgs. Secret is not configured, causing the job to fail.

## Changes Implemented

- Updated `.github/workflows/gitleaks.yml` to:
  - Use `gitleaks/gitleaks-action@v2` only when `secrets.GITLEAKS_LICENSE` is present (both PR and push paths).
  - Pass `GITLEAKS_LICENSE` via env when present.
  - Add a fallback that runs `trufflesecurity/trufflehog:latest` in Docker when no license is configured, preserving secret scanning coverage without blocking CI.
  - Keep SARIF upload when Gitleaks generates `gitleaks.sarif`.

## Verification Plan

- PR path: falls back to TruffleHog scan and should pass if no secrets are detected.
- Push path: falls back to TruffleHog scan and should pass if no secrets are detected.
- When `GITLEAKS_LICENSE` is later configured, workflow automatically resumes using Gitleaks and uploads SARIF.

## Notes

- The Gitleaks action now warns about the `args` input; the step still executes, but we pass license via env and retain args for compatibility. If warnings persist post-license, consider pinning a specific action version and migrating to its documented inputs.

— build-fixer-agent
