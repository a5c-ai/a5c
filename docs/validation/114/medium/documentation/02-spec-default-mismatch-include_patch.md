# Resolved: Spec vs implementation (include_patch)

Priority: none (resolved)
Category: documentation

Status:

- Specs and implementation both default `include_patch` to `false`.
- Source of truth: `docs/cli/reference.md#events-enrich`.
- Implementation: `src/enrich.ts` uses `opts.flags?.include_patch ?? false`.
- Resolution PR: #892

Rationale:

- Defaulting to `false` is safer (diffs can contain secrets) and produces smaller outputs. Users may opt‑in as needed with `--flag include_patch=true`.
