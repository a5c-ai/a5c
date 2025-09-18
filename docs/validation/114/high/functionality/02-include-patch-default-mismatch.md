# Resolved: `include_patch` default alignment (docs/specs/README.md §4.1)

Priority: none (resolved)
Category: functionality

Status:

- Default is `false` in implementation and docs.
- Source of truth: CLI reference — `docs/cli/reference.md#events-enrich`.
- Implementation: `src/enrich.ts` computes `toBool(opts.flags?.include_patch ?? false)`.
- Resolution PR: #892

Notes:

- Keeping default `false` avoids leaking secrets and reduces payload size by default. Users may opt‑in with `--flag include_patch=true` when needed.

History (for context):

- Prior implementations computed `toBool(opts.flags?.include_patch ?? true)`, which effectively defaulted to `true` and conflicted with the spec. This is no longer the case.
