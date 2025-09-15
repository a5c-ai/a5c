# [Validator] [Documentation] CONTRIBUTING pre-commit section out of date

## Context

`CONTRIBUTING.md` states that pre-commit runs `lint`, `typecheck`, and optionally tests. Current implementation in `scripts/precommit.sh` now uses `lint-staged` only (plus whitespace/filename guards). This misalignment can confuse contributors and increase local friction.

## Recommendation

- Update `CONTRIBUTING.md` to describe the new flow: lint-staged on staged files, with skip envs (`A5C_SKIP_PRECOMMIT`/`SKIP_PRECOMMIT`).
- Keep notes about full `lint`/`typecheck`/tests as manual commands or CI responsibilities.

## Acceptance Criteria

- CONTRIBUTING reflects lint-staged pre-commit behavior accurately.
- Examples for bypass and manual runs are updated accordingly.
