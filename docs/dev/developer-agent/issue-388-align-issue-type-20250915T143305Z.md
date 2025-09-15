# Align NE type: "issue" (not "issues")

## Context

Issue #388 reports normalization emits `type: "issues"` for GitHub Issues events while schema (`docs/specs/ne.schema.json`) and Zod expect `"issue"`.

## Plan

- Update `src/providers/github/map.ts` → `detectTypeAndId()` to return `"issue"`.
- Add tests:
  - Provider normalization for Issues fixture
  - Schema validation using Ajv for Issues
- Build + run tests locally
- Open PR against `a5c/main` (fixes #388)

## Notes

- Existing fixtures: `tests/fixtures/github/issues.opened.json`
- Schema already enumerates `"issue"`.
