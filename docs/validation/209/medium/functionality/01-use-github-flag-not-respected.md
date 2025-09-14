# [Validator] [Functionality] - `--use-github` flag not wired

- Priority: medium
- Category: functionality

## Summary
`src/cli.ts` accepts `--use-github` and sets `flags.use_github = 'true'`, but `enrichCommand` does not read this flag and GitHub enrichment is attempted regardless. This is confusing and prevents opting out without other flags.

## Recommendation
Plumb a `use_github` boolean flag through `enrichCommand` and guard the GitHub enrichment block accordingly. Default should preserve current behavior when the flag is not specified.

## Suggested Follow-up
- Add tests covering enrichment enabled/disabled by flag.
- Update docs to reflect behavior and environment variable requirements.
