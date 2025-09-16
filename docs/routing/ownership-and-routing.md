# Ownership and Routing

This repo uses GitHub CODEOWNERS to route changes, mentions, and automation:

- Per-file owners are resolved during enrichment and exposed under `enriched.github.pr.owners`.
- The deduplicated union of all owners across changed files is available at `enriched.github.pr.owners_union` for quick routing/mentions.

Maintain CODEOWNERS to reflect responsible teams:

```ini
# Example (see .github/CODEOWNERS)
src/**              @a5c-ai/agents
docs/**             @a5c-ai/docs
.github/workflows/** @a5c-ai/platform
*                   @a5c-ai/maintainers
```

Tips:

- Place more specific patterns higher; last match wins.
- Prefer team handles over individuals.
- Keep owners current to ensure accurate routing in CI and agent workflows.

## Semantics

Our enrichment intentionally diverges from GitHub’s CODEOWNERS review semantics:

- GitHub reviews: patterns are evaluated top-to-bottom and the last matching rule wins for a file (owners are replaced by the last rule).
- a5c enrichment: for each changed file, we take the union of all matching rules’ owners; then we compute `owners_union` as the sorted, de-duplicated union across all changed files.

This union-based approach fans out routing/notifications to all relevant owners who matched, not just the last rule.

### Example A: Overlapping patterns for the same file

```ini
# .github/CODEOWNERS (later rule is listed later in file)
docs/**                 @a5c-ai/docs
docs/routing/**         @a5c-ai/platform-docs
```

- Changed file: `docs/routing/ownership-and-routing.md`
- GitHub review semantics (last match wins): `@a5c-ai/platform-docs` only
- a5c enrichment per-file owners: `enriched.github.pr.owners["docs/routing/ownership-and-routing.md"] = ["@a5c-ai/docs", "@a5c-ai/platform-docs"]` (order not guaranteed)
- a5c enrichment union across files: `enriched.github.pr.owners_union` includes both `@a5c-ai/docs` and `@a5c-ai/platform-docs`

### Example B: Multiple files, different owners

```ini
# .github/CODEOWNERS
src/**                  @a5c-ai/agents
docs/**                 @a5c-ai/docs
```

- Changed files: `src/api/users.ts`, `docs/user/quickstart.md`
- GitHub review semantics: each file considered separately; owners differ per file
- a5c enrichment per-file owners:
  - `owners["src/api/users.ts"] = ["@a5c-ai/agents"]`
  - `owners["docs/user/quickstart.md"] = ["@a5c-ai/docs"]`
- a5c enrichment union across files: `owners_union = ["@a5c-ai/agents", "@a5c-ai/docs"]`

### Rationale and future toggle

- Rationale: Agent workflows benefit from wider, deterministic routing (labeling, mentions, auto-assign) across all matched owners. This reduces missed notifications when multiple rules legitimately apply.
- Parity option: We may add a toggle to switch to strict “last matching rule wins” parity for per-file owners if your process requires mirroring GitHub review semantics exactly.

See also:

- Ownership fields overview in `docs/ownership/README.md`.
- CLI reference for enrichment outputs in `docs/cli/reference.md`.
