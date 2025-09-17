# [Low] Refactoring — Deduplicate coverage gate logic

The hard coverage gate logic is duplicated in both `.github/workflows/pr-tests.yml` and `.github/workflows/tests.yml`.

Suggestion:

- Extract the gate into a small composite action (e.g., `.github/actions/coverage-gate`) or a reusable script under `scripts/` (e.g., `scripts/coverage-gate.cjs`) and invoke it from both workflows.
- Keep thresholds source as `scripts/coverage-thresholds.json` and preserve current table + step summary output.

Rationale: reduces maintenance overhead and risk of drift across workflows.
