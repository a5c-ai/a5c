# Dev Log: provenance.source alias consistency (issue #560)

- Start: 20250916-052050Z
- Goal: Normalize CLI '--source actions' to persisted 'action'; update docs; add unit test.

## Plan

- Map input alias 'actions' -> 'action' in CLI normalize flow.
- Update README examples to show 'action' (singular).
- Clarify CLI help: accepts 'actions' as alias; stored as 'action'.
- Add test: --source actions yields provenance.source === 'action'.
