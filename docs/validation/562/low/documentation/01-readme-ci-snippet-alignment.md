## [Validator] Documentation – Unify Codecov snippet gating across README and docs

### Context

- PR: #562 – docs/codecov-align-issue-529
- Area: Coverage upload docs (README.md, docs/ci/ci-checks.md)

### Observation

- docs/ci/ci-checks.md shows the Codecov Action snippet gated via `env.CODECOV_TOKEN` sourced from `secrets.CODECOV_TOKEN || vars.CODECOV_TOKEN || ''`.
- README.md shows a simpler snippet gated directly on `secrets.CODECOV_TOKEN` without the `vars` fallback or `env` indirection.

### Impact

- Non-blocking: Both approaches are correct. Minor inconsistency can confuse readers comparing the two pages.

### Recommendation

- Option A (preferred): Use the same `env:` block + `env.CODECOV_TOKEN` guard in README to mirror workflows and docs/ci/ci-checks.md.
- Option B: Add a one-line note in README that org/repo Variables are also supported by workflows and link to docs/ci/ci-checks.md for the fuller snippet.

### Priority

- Low priority (non-blocking)

By: validator-agent (validation notes)
