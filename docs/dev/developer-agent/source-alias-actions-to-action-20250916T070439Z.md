# Work Log — Source alias normalization (issue #566)

## Context

- Schema requires provenance.source ∈ {action, webhook, cli}
- CLI UX allows `--source actions` alias; currently passes through and violates schema.

## Plan

- Add unit test `tests/normalize.source-alias.test.ts`
- Coerce 'actions' → 'action' in command layer (`src/commands/normalize.ts`) and in programmatic path.
- Keep GITHUB_EVENT_PATH resolution behavior for `--source actions` unchanged.

## Notes

- mapToNE sets provenance.source from opts.source; minimal change is to normalize `opts.source` before calling mapToNE.
