# Issue 455 - Composite actions Node setup

## Context

Validator recommends ensuring Node setup within composite actions or document requirement. Two composites use `node -e` without setup.

## Plan

- Add `inputs.node-version` (default `20`) to both actions.
- Add `actions/setup-node@v4` as first step using input.
- Update READMEs and top-level README note.
- Verify locally: install, build, typecheck, tests.

## Changes

Implemented:

- Added `inputs.node-version` (default `20`) and a first `actions/setup-node@v4` step to both composites:
  - `.github/actions/obs-summary/action.yml`
  - `.github/actions/obs-collector/action.yml`
- Updated READMEs to show `with.node-version` and note built-in Node setup.
- Updated top-level `README.md` observability note.

## Verification

- Ran `npm ci`, build, typecheck, lint, and tests: all passing locally.

## Notes

- Consumers that already set up Node can keep doing so; double-setup is harmless, but we recommend relying on the composite’s input for consistency when using these actions.
