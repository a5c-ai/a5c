# Issue #1030 – Programmatic normalize: avoid invalid NE on error

## Context

`runNormalize` currently returns a fabricated NE with `type: "error"` on failures, which violates the NE schema and can confuse consumers. CLI `cmdNormalize` already returns `{ code, errorMessage }` without an `output` on error.

## Plan

- Refactor `runNormalize` to return `{ code, errorMessage }` on error (no `output`).
- Keep successful behavior unchanged (`{ code: 0, output }`).
- Add a small shared helper to reduce duplication with `cmdNormalize` (optional).
- Update/add tests to cover error path for programmatic API.
- Document SDK contract in `docs/user/sdk-quickstart.md` notes.

## Acceptance

- No fabricated NE objects with `type: "error"` from `runNormalize`.
- Callers/tests handle `code !== 0` via `errorMessage`.
