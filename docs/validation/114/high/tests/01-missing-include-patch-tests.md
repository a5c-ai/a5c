# Resolved: include_patch flag tests present

Priority: none (resolved)
Category: tests

Status:

- Tests exist for both default `false` and explicit `true` cases.
- Representative files:
  - `tests/enrich.flags.test.ts`
  - `tests/cli.enrich.flags.test.ts`
  - `tests/enrich.basic.test.ts`
  - `tests/enrich.handle.test.ts`
- Resolution PR: #892

Notes:

- Coverage includes asserting absence/presence of `patch` under PR/push flows with `include_patch=false/true` respectively.
