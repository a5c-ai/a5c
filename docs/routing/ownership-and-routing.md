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

- GitHub CODEOWNERS (reference): for a given file, the last matching rule wins.
- Enrichment here: compute `owners_union` = union of all owners across all changed files, then sort and de‑duplicate for routing.

Examples:

```ini
# CODEOWNERS
src/**          @team-src
src/utils/**    @team-utils
```

- File: `src/app.ts` -> owners per file: `[@team-src]`
- File: `src/utils/math.ts` -> owners per file: `[@team-utils]` (last rule wins for this file)
- PR changes both files -> `owners_union = [@team-src, @team-utils]`

```ini
# Overlapping with users and teams
*.md            @docs-bot @a5c-ai/docs
docs/**         @a5c-ai/docs
```

- Files: `README.md`, `docs/guide.md` -> union dedupes and sorts: `[@a5c-ai/docs, @docs-bot]`

Rationale:

- Routing favors broader notification to avoid missing stakeholders when multiple areas are touched.
- Downstream agents can still implement stricter strategies if needed (e.g., per-file last-rule owners).

Future toggle (tracking):

- A configuration flag may allow switching between union-based routing and strict last-rule parity for PR-level owners.
