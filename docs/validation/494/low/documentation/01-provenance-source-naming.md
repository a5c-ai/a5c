# [Validator] [Documentation] - Provenance source naming consistency

### Context

- PR: #494 (docs/readme): unify composed validation guidance
- Schema: `docs/specs/ne.schema.json` enforces `provenance.source` enum: `action | webhook | cli`.
- README currently references `--source actions` in a couple of examples/notes.

### Observation

- Minor naming inconsistency: README mentions `actions` (plural) while schema and code prefer `action` (singular) for `provenance.source`.
- CLI option accepts `actions` as a user-facing convenience in `normalize` notes, but persisted NE should use `action`.

### Recommendation

- Update README to consistently prefer `action` for the persisted `provenance.source` value.
- Where referring to GitHub Actions as a platform, keep "GitHub Actions" text; but for the flag/value examples and persisted field, use `action` (singular).

### Priority

- low priority (documentation clarity)

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
