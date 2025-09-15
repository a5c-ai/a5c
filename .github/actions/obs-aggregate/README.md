# Observability Aggregate (composite action)

Aggregates artifacts from prior jobs in the same workflow run and emits a compact summary and JSON.

It will:

- Download artifacts (coverage, junit, observability) into `artifacts/`
- Summarize coverage and junit counts to the step summary
- Produce `observability.aggregate.json`
- Upload an `observability-aggregate` artifact with the JSON

Inputs are optional; by default it downloads all artifacts in the run.
