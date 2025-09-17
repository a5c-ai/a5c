# Task: Reconcile mentions.languages docs vs behavior — Enrich Mentions (issue #729)

- Context: Docs contradict behavior. Implementation accepts canonical IDs and common extensions (with/without dots) and normalizes to IDs.
- Goal: Align docs and add tests for extension inputs.

## Plan

- Update docs/cli/reference.md Mentions section: single contract; concise mapping list; remove contradictions.
- Update README Mentions flags quick reference to state extension acceptance and link to CLI reference.
- Update docs/specs/README.md §4.2 to clarify acceptance + normalization.
- Extend tests/mentions.flags.e2e.test.ts with extension inputs (.ts, tsx, .yml, jsx) → normalized to ts/yaml/js.

## Notes

- Behavior already implemented in src/enrich.ts normalizeLanguageFilters().
