# Issue 551 — Clarify --use-github token-missing behavior in CLI docs

- Branch: docs/clarify-cli-token-missing-551
- Scope: README.md, docs/cli/reference.md
- Goal: Align docs with actual CLI behavior when `--use-github` is set without a token: CLI exits with code `3` and prints an error; it does not emit JSON.

## Plan

1. Update docs/cli/reference.md — adjust `events enrich` behavior bullets:
   - Explicitly state exit code 3 and no JSON body when `--use-github` without token.
   - Remove or relabel the JSON snippet for `{ provider: 'github', skipped: true, reason: 'token:missing' }` as programmatic example only (not CLI output).
2. Update README.md — mirror the clarification in the CLI section.
3. Run tests locally to verify exit code semantics remain (tests/cli.exit-codes.test.ts).
4. Open a draft PR linked to #551.

## Notes

- tests/cli.exit-codes.test.ts already asserts exit code 3 for this scenario.
- Runtime token precedence: `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN`.
