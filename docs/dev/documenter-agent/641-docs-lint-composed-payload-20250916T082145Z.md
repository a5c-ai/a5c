# Issue #641 – Docs/Lint: Align composed[].payload types and add docs-lint

## Plan

- Update `docs/specs/README.md` §6.1 to `payload?: object | array | null`.
- Update `docs/validation/311/low/documentation/01-align-readme-payload-type.md` to reflect resolved drift.
- Add `docs-lint` CI: fail on `composed[]\.payload\s*[:=]\s*any` in docs.

## Notes

- Schema `docs/specs/ne.schema.json` already enforces the union.
- README already mentions the correct types in two locations.
