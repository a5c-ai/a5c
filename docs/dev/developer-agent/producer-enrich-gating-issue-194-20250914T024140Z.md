[Note] Updated semantics: offline reason is `flag:not_set` (replaced prior `github_enrich_disabled`). See `docs/cli/reference.md` for canonical behavior.

# [Developer] Producer – Enrichment flag gating (Issue #194)

## Intent

Respect `--use-github` to enable network enrichment. In offline/default mode, return `enriched.github.partial=true` with a clear reason.

## Plan

- Gate network calls in `handleEnrich` behind `flags.use_github`
- If disabled, set partial with `reason: 'github_enrich_disabled'`
- Pass through limits: `commit_limit`, `file_limit`, `include_patch`
- Tests: disabled path; existing missing-token stays partial
- Docs: README CLI flags and behavior notes

## Notes

Initial scan confirms enrichment path in `src/enrich.ts` and CLI flag in `src/cli.ts`.
