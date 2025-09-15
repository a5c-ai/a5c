# [Medium] Documentation – README should include CLI usage

Context: PR #59 on branch `feat/sdk-cli-scaffold-issue43`

Observation

- CLI and SDK are scaffolded and working (`events normalize`, `events enrich`).
- README does not yet include quickstart usage for the new CLI.

Why it matters

- Improves developer experience and discoverability.

Acceptance

- README contains minimal Quickstart:
  - Install (local dev): `npm i` then `npm run build`.
  - Run: `node dist/cli.js --help`.
  - Examples for `normalize` and `enrich`.
