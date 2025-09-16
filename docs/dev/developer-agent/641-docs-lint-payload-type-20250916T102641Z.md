# Task Log — Align composed[].payload docs and add docs-lint (Issue #641)

## Plan

- Fix docs/specs/README.md §6.1: `payload?: object | array | null`
- Update validation note to mark resolved
- Add fast docs-lint job to catch `composed[].payload: any`
- Open PR against a5c/main linking to issue #641

## Context

Schema `docs/specs/ne.schema.json` constrains `composed[].payload` to `object | array | null`.
