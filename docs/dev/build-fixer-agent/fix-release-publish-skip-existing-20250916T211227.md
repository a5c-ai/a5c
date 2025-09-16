# Fix: Release workflow npm publish E403 on existing version

## Context
- Failed run: https://github.com/a5c-ai/events/actions/runs/17779033644
- Branch: main (prod)
- Step: Publish to npmjs (main only)
- Error: `npm ERR! 403 ... You cannot publish over the previously published versions`

## Root cause
A race/consistency issue: `npm view` pre-check didn’t detect an already published version (or concurrent publish), causing `npm publish` to fail with E403. Need to treat E403 for existing version as a no-op and ensure cleanup.

## Plan
- Add robust skip logic: re-check existence and gracefully exit 0 on E403/EPUBLISHCONFLICT.
- Add retries and pattern matching for transient errors.
- Ensure .npmrc cleanup via trap.

## Verification
- Dry-run reasoning locally; rely on CI to validate workflow syntax.
- New behavior: if version exists, step exits 0 without error.
