# Enable warn-only schema validation in CI

Category: documentation | Priority: low

Context: PR #448 adds `docs/specs/observability.schema.json` (Draft 2020-12) and wires optional Ajv validation in the composite action when `OBS_VALIDATE_SCHEMA=true`.

Recommendation:

- Enable `OBS_VALIDATE_SCHEMA: true` in workflows that use `.github/actions/obs-summary` to surface schema drift as warnings (non-blocking).

Example snippet (GitHub Actions):

```yaml
- name: Observability summary
  uses: ./.github/actions/obs-summary
  env:
    OBS_VALIDATE_SCHEMA: true
```

Notes:

- Validation is warn-only by design and will not fail the job.
- Keep as warn-only until the schema stabilizes; revisit to enforce once consumers adapt.
