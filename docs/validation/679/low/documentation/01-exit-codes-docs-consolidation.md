# [Validator] [Documentation] - Consolidate CLI exit codes

### Summary

The CLI reference and README mention exit codes in multiple places. Consider adding a consolidated "Exit codes" subsection in `docs/cli/reference.md` that lists common codes across commands:

- `0` — success
- `2` — filter non‑match (no output)
- `3` — provider/network error (e.g., `--use-github` without token)

Then link to it from command sections (`normalize`, `enrich`) instead of repeating.

### Rationale

Reduces duplication and makes behavior easier to discover. Aligns with current additions for `--filter` non‑match examples.

### Suggested Fix

- Add an "Exit codes" subsection at the top of CLI Reference after the intro.
- Replace per‑section sentences with "See Exit codes" where appropriate.

### Priority

low

### Status

Proposed (non‑blocking for PR #679).

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
