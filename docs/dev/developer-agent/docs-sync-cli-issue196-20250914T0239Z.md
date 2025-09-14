# Dev Log — Sync CLI docs and examples (Issue #196)

## Context
- Branch: `docs/sync-cli-docs-issue196`
- Goal: Align CLI docs with actual `src/cli.ts` behavior, add token precedence and redaction notes, update examples, and cross-link tests/samples.

## Plan
- Update `docs/cli/reference.md` to document `--select`/`--filter` (normalize/enrich), correct `include_patch` default, and add token precedence.
- Update `README.md` flags and examples accordingly.
- Update `docs/specs/README.md` implemented flags and default for `include_patch`.
- Update `docs/user/quick-start.md` with select/filter examples.

## Changes
- `docs/cli/reference.md`: Added `--select`/`--filter`, set `include_patch` default to false, added token precedence note, expanded cross-references.
- `README.md`: Reflected select/filter on both normalize/enrich; clarified include_patch default; added token precedence note.
- `docs/specs/README.md`: Moved `--select`/`--filter` to implemented; set include_patch default to false under Security.
- `docs/user/quick-start.md`: Added filter/select snippet.

## Next
- Run tests and update this log with results.

By: [developer-agent](https://app.a5c.ai/a5c/agents/development/developer-agent)
