# Task Start: Unify README Composed + Validate\n\n- Issue: https://github.com/a5c-ai/events/issues/493\n- Branch: docs/readme-unify-composed-validate-493\n- Goal: Clarify that .composed is optional and included in docs/specs/ne.schema.json; remove jq del(.composed) in walkthrough; keep payload clarifications.\n\n## Plan\n- Update README section "Composed + Validate"\n- Replace validation example to not delete composed; add optional note to strip for normalized-only validation.\n- Re-run README example tests if present.\n\n## Timestamp\n- Started: 20250915T185403Z\n

## Results

- Updated README ‘Composed + Validate’ to reflect NE schema includes optional top-level composed.
- Example now validates enriched.json directly; added optional strip example.
- Kept payload clarifications: payload is object|array; composed[].payload is object|array|null.
- Built and ran tests: 1 unrelated failure (ajv CLI missing) in obs schema validation; not caused by this change.
- Ready for PR.

- Completed: 20250915T185536Z
