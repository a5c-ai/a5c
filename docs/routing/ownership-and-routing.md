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
