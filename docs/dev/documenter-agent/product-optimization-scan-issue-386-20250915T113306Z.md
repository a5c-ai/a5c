[Note] Updated semantics: offline reason is `flag:not_set` (replaced prior `github_enrich_disabled`). See `docs/cli/reference.md` for canonical behavior.

# Product Optimization Scan — Docs Updates

- Issue: https://github.com/a5c-ai/events/issues/386
- Branch: docs/product-optimization-386
- Start: 20250915T113306Z

## Plan

- Add CLI Quick Start page with copy-paste flows.
- Align CLI reference with actual flags and defaults.
- Cross-link mentions, NE schema, enrich behavior.

## Notes

- include_patch default is false per src/enrich.ts.
- Offline enrich marks reason=github_enrich_disabled.
