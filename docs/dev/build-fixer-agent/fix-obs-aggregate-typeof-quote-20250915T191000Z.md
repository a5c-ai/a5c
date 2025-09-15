# Build Fix: obs-aggregate typeof quoting

## Context

- Failing workflow: Tests – Aggregate Observability job
- Symptom: Node eval error `ReferenceError: number is not defined`
- Run: https://github.com/a5c-ai/events/actions/runs/17743749280

## Plan

- Patch .github/actions/obs-aggregate/action.yml Node snippet to use "number" (double quotes) in typeof checks to avoid shell single-quote interference.
- Open PR against a5c/main with labels build, bug, high priority.
- Enable auto-merge.

## Changes (initial placeholder)

- Pending.
