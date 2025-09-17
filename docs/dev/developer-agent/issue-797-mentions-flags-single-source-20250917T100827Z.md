# Work Log — Consolidate mentions flags docs — Single Source (Issue #797)

## Context
- Goal: Make CLI reference the single source for mentions flags.
- Update: README.md and docs/specs/README.md to link to docs/cli/reference.md#events-enrich.

## Plan
1. Inventory mentions flags across docs.
2. In README.md, replace any flag lists with a link to the CLI reference.
3. In docs/specs/README.md (section 4.2 mentions schema), link to CLI reference and trim duplicate flag enumerations.
4. Ensure there are no conflicting defaults.
5. Run lint/format and open a draft PR.

## Notes
- Keep brief summaries but avoid duplicating canonical flag tables.

