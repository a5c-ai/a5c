# Task Log – Issue #229: Enrichment – Implement rules engine for composed events

## Plan

- Wire rules evaluation into `src/commands/enrich.ts` (CLI path)
- Reuse `src/rules.ts` loader/evaluator
- Add sample rules under `samples/rules/conflicts.yml`
- Add CLI unit test validating `.composed[]` population via `--rules`
- Run tests and open PR (fixes #229)

## Context

Specs §6.1 define composed events via YAML/JSON rules. `handleEnrich` already evaluates rules; CLI `cmdEnrich` does not yet.
