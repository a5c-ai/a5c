# Developer Log – Compose Events Rules (Issue #191)

## Plan
- Add lightweight rule evaluator (YAML/JSON) with simple predicates
- Wire to `events enrich --rules FILE` to produce `composed[]`
- Provide sample rule matching conflicted PR + low priority label
- Add unit tests and sample data
- Update CLI docs and README

## Notes
- Keep evaluator minimal: equality, contains(), and logical all/any
- Project payload fields into emitted event per spec

