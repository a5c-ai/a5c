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

## Semantics: Union vs. Last-Rule

GitHub CODEOWNERS applies matching rules top-to-bottom per file; the last matching rule determines that file’s owners and thus review requirements.

Event enrichment for routing computes both per-file owners and an `owners_union` across all changed files:

- `enriched.github.pr.owners`: map of `file -> [owners]` using CODEOWNERS last-match per file.
- `enriched.github.pr.owners_union`: sorted, de-duplicated union of all owners across changed files.

Why union? Routing and notifications often need a superset of stakeholders for downstream agents (triage, review pings, labeling). Union minimizes surprise where multiple areas are touched.

### Examples

Example A (overlapping specific vs broad):

```ini
# CODEOWNERS
src/**          @team-src
src/feature/**  @team-feature
```

- File: `src/feature/util.ts` → per-file owners: `[@team-feature]` (last rule wins)
- File: `src/common/helpers.ts` → per-file owners: `[@team-src]`
- PR changes both → `owners_union = [@team-feature, @team-src]` (sorted, deduped)

Example B (users and teams; markdown):

```ini
*.md            @docs-bot @a5c-ai/docs
docs/**         @a5c-ai/docs
```

- Files: `README.md`, `docs/guide.md` → union: `[@a5c-ai/docs, @docs-bot]`

Rationale:

- Routing favors broader notification to avoid missing stakeholders when multiple areas are touched.
- Downstream agents can still implement stricter strategies if needed (e.g., use per-file last-rule owners only).

Future toggle (tracking): a configuration flag may allow switching between union-based routing and strict last-rule parity for PR-level owners.
