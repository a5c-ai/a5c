# NE Validation Exit Codes — Docs Sync

- Type: validation
- Priority: low

## Summary

Align CLI exit code on NE validation failure to `2` to match `docs/cli/reference.md` (validation/input error bucket). Previously, `src/cli.ts` returned `3` on `--validate` failures for `normalize` and `enrich`.

## Context

- PR: https://github.com/a5c-ai/events/pull/225
- Files: `src/cli.ts`
- Docs: `docs/cli/reference.md` — lists `2` for validation errors.

## Resolution

- Changed both call-sites to `process.exit(2)` when `res.valid === false`.

## Notes

- No behavior change for `events validate` command, which already uses `2` for invalid documents.
