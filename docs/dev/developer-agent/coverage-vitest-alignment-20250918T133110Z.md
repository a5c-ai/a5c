# Align Vitest and Coverage Plugin Versions

## Context

Dependabot PR #917 bumped `@vitest/coverage-v8` to `3.2.4` which peers on `vitest@3.2.4`. Repo currently uses `vitest@^2.1.1`, causing ERESOLVE on install.

## Plan

- Bump `vitest` to `^3.2.4` and `@vitest/coverage-v8` to `^3.2.4`.
- Adjust `vitest.config.ts` if needed.
- Run tests and coverage locally and fix any breakages.

## Start

Work started.
