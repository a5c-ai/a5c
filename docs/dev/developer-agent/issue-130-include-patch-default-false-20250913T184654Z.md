# Issue 130: Flip default for include_patch to false

## Context
Specs state `include_patch` should default to false to reduce payload size and avoid leaking secrets in diffs. Current code defaults to true in `src/enrich.ts`.

## Plan
- Change default to false in `handleEnrich` flag parsing.
- Verify behavior with existing tests and add a test ensuring omission of `patch` by default.
- Update docs (README/specs) to reflect default and usage.

## Notes
- Users can opt-in via `--flag include_patch=true`.
- Behavior is enforced post-enrichment by stripping `patch` from `pr.files` and `push.files` when disabled.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
