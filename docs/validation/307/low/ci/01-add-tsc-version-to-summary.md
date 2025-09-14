# [Validator] [CI] - Include tsc version in Typecheck summary

Including `tsc --version` in the Typecheck job step summary can aid debugging mismatches across the Node matrix.

- Non-blocking improvement: Add a step or append to the "Step summary" step: `echo "tsc: $(npx tsc --version)" >> "$GITHUB_STEP_SUMMARY"`.
