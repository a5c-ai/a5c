# Issue #493 – README composed validation alignment

## Context

Validator flagged inconsistency: README suggests removing `.composed` before validation, but NE schema includes optional `.composed`. Goal: align README to state enriched outputs validate as‑is; stripping `.composed` is optional for normalized‑only validation.

## Plan

- Update the “Composed + Validate (Walkthrough)” intro to state `.composed` is in schema and optional.
- Replace example with enrich → inspect composed (guard) → validate as‑is → optional validate without `.composed`.
- Update Notes bullets per issue, retaining payload clarification.
- No schema changes.

## Status

In progress.
