# [Resolved] `include_patch` default alignment (docs/specs/README.md §4.1)

Priority: resolved
Category: functionality → documentation note

Resolution:

- Current implementation defaults `include_patch` to `false` in `src/enrich.ts` and CLI docs reflect this default.
- Tests cover both default removal and explicit opt-in:
  - `tests/enrich.flags.test.ts` and `tests/cli.enrich.flags.test.ts`
- Specs and CLI Reference both state the default is `false`.

References:

- Code: `src/enrich.ts` (`const includePatch = toBool(opts.flags?.include_patch ?? false);`)
- Docs: `docs/cli/reference.md#events-enrich` (flags), `README.md` (CLI section)

Action:

- No code changes needed. This note remains for traceability and to avoid re-raising the concern.
