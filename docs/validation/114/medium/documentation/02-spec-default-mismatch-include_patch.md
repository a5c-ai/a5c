# [Resolved] Spec default vs implementation: include_patch

Priority: resolved
Category: documentation

Outcome:

- Implementation and docs both default `include_patch` to `false`.
- Users must opt-in via `--flag include_patch=true` to include diff patches.

References:

- Code: `src/enrich.ts` (default false)
- Docs: `docs/cli/reference.md#events-enrich`
- Tests: `tests/enrich.flags.test.ts`, `tests/cli.enrich.flags.test.ts`
