# Tests/Coverage: Explicit TS-only scope

- Category: tests
- Priority: low

Vitest config keeps coverage includes to `src/**/*.{ts,tsx}` and test inclusion to TS files only. This aligns with the rationale to avoid pulling legacy JS tests that import non-existent JS sources.

Suggestion: Add a short comment in `vitest.config.ts` noting the intent (TS-first tests and coverage) and the reason (legacy JS tests rely on build artifacts), to make this a conscious, documented choice.
