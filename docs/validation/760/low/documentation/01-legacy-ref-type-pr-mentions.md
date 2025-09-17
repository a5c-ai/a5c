# [Validator] [Documentation] - Legacy mentions of `ref.type: "pr"`

Some historical dev/validation notes still reference `ref.type: "pr"` as expected output. Current schema (`docs/specs/ne.schema.json`) and implementation (`src/providers/github/map.ts`) align on `ref.type: "branch"` for pull_request events, with `ref.base`/`ref.head` populated.

- Non-blocking: no changes required for this PR. Consider opportunistic cleanup of legacy mentions under `docs/dev/` when editing those notes next.
- Rationale: Specs and code are consistent; tests validate behavior. Historical notes are informational.
