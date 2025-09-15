# Non-blocking: JS tests strategy and future alignment

Observed:

- Vitest `include` targets only TS tests; legacy `.js` tests were excluded.
- PR #260 migrates `tests/enrichGithubEvent.test.js` to TS, which restores coverage without destabilizing CI.

Recommendations:

- Keep test inclusion TS-first to match `src/` TypeScript sources.
- If additional JS test files are discovered, prefer migrating them to TS rather than broadening `include` to `**/*.js`.
- Longer-term option: if JS tests must remain, introduce path aliases or a prebuild step to ensure imports resolve to `dist/` safely (but this adds CI complexity and is not necessary now).

Status: non-blocking. No action required to approve PR once conflicts are resolved.
