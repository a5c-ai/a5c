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

### Example

CODEOWNERS:

```ini
# Specific feature area
src/feature/**   @team-a
# Broader ownership later in file
src/**           @team-b
```

Changes in PR:

```
src/feature/util.ts
src/common/helpers.ts
```

Per-file owners (last rule wins per file):

- `src/feature/util.ts` → `@team-a` (specific rule wins)
- `src/common/helpers.ts` → `@team-b`

Union for routing:

- `owners_union` → [`@team-a`, `@team-b`]

Agents can mention or route to `owners_union` to ensure both teams are notified, while GitHub’s native reviewers still follow last-rule per file.
