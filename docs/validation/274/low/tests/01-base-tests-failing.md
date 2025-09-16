# Base branch tests failing (non-blocking)

- Context: Re-run validations for PR #274.
- Observation: Unit tests fail on PR branch and also on base branch (a5c/main), indicating failures are not introduced by this PR.
- Scope of PR: Docs renames and `.husky/pre-commit` guard only; no runtime code changes.

Failed areas observed (sample from vitest output):

- tests/enrich.basic.test.ts
- tests/enrich.flags.test.ts (2 cases)
- tests/enrich.handle.test.ts
- tests/cli.rules-composed.test.ts
- tests/enrichGithubEvent.test.ts (syntax error duplicate identifier)
- tests/golden.enrich.test.ts (golden mismatch)

Impact on this PR: Non-blocking; unrelated to filename normalization and pre-commit guard.

Suggestion (separate task): Stabilize enrich/flags and composed rules tests, resolve duplicate identifier, and update goldens.
