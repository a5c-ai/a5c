# [Low] Coverage guidance — clarify scope sentence

Category: documentation

Summary

`docs/ci/coverage.md` mentions that some entrypoints may be excluded or lightly tested. Consider clarifying that exclusions are aligned with `vitest.config.ts` and CI practice (e.g., `src/cli.ts` excluded to avoid instrumentation skew), with a short link to the config for quick reference.

Suggested text addition:

> Exclusions align with `vitest.config.ts` (e.g., `src/cli.ts`) to avoid skew from non-instrumented paths. See repository `vitest.config.ts`.

Notes

- Non-blocking; current note is directionally correct.
