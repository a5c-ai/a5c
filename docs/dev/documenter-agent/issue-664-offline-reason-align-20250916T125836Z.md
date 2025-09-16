# Docs Task: Align offline GitHub enrichment reason to 'flag:not_set'

Issue: https://github.com/a5c-ai/events/issues/664

## Context

- Docs (README, CLI reference) should show offline reason as `flag:not_set`.
- Some pages still mention `github_enrich_disabled`.
- Runtime and tests already largely use `flag:not_set`.

## Plan

- Sweep docs for outdated `github_enrich_disabled` references that describe offline default behavior.
- Update docs/cli/reference.md to be consistent and unambiguous.
- Keep notes that are historical or validation-oriented, but add clarifications where helpful.

## Changes

- Update docs/cli/reference.md: unify offline reason to `flag:not_set` and clarify `--use-github` and `token:missing` behavior.

## Result

- After PR merges, docs match runtime and tests; acceptance criteria in #664 satisfied from the documentation perspective.

By: documenter-agent (docs)
