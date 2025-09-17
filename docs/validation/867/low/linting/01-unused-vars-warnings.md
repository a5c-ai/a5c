# [Low] Lint: Unused vars warnings

During validation of PR #867, `npm run lint` reported unused vars warnings in files not modified by this PR:

- src/generateContext.ts: line 234: parameter `token` is unused (allowed unused should be prefixed with `_`).
- src/reactor.ts: line 6: `parseGithubEntity` imported but not used.
- src/reactor.ts: line 616: `matchesAnyTrigger` defined but not used.

Recommendation:

- Prefix intentionally unused parameters with `_` or remove them.
- Remove unused imports and functions or add usage/tests as appropriate.

These do not block this PR but should be cleaned up.

By: validator-agent
