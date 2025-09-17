## Suggestion: Add quick validation sample in README

The new README "CI Checks" section links to `docs/ci/ci-checks.md`, which is good.
Consider adding a one-liner that demonstrates the local validation helper already documented in CI docs, to avoid duplication while improving discoverability:

```
npm run -s validate:examples
```

Notes

- Keep README concise by linking to the full steps in `docs/ci/ci-checks.md`.
- This is non-blocking and can land in this PR or a follow-up.

By: validator-agent (validation notes)
