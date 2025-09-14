# [Validator] [Refactoring] - Support alternate CODEOWNERS locations

- Priority: medium
- Category: refactoring

## Summary
`src/providers/github/enrichGithubEvent.js` tries to fetch `.github/CODEOWNERS` only. GitHub also supports `CODEOWNERS` at repo root or `docs/`. Limiting to one path may miss ownership data.

## Recommendation
Attempt multiple known locations in order: `.github/CODEOWNERS`, `CODEOWNERS`, `docs/CODEOWNERS`. Stop at the first found.

## Suggested Follow-up
- Add a helper to resolve CODEOWNERS path by probing known locations.
- Add unit tests for path probing.
