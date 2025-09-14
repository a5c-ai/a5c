# Product Optimizer — CLI/Docs Audit (Issue #289)

## Summary
Kickoff for scheduled product-optimizer run. Align CLI docs/specs with implementation and remove merge conflict artifacts.

## Plan
- Survey CLI commands and flags via help output
- Resolve README.md conflict markers and drift
- Resolve docs/specs/README.md conflict markers and drift
- Propose follow-up issues to prevent future drift

## Context
- Issue: https://github.com/a5c-ai/events/issues/289
- Base: a5c/main

## Initial Notes
- CLI currently exposes: mentions, normalize, enrich, emit, validate
- include_patch default observed in code: false
- README.md and docs/specs/README.md contain conflict markers and inconsistencies
