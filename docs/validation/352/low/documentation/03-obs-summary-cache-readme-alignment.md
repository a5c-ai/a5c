# [Validator] [Documentation] - Ensure README examples match compose output

## Context

Files:

- `.github/actions/obs-summary/README.md`
- `.github/actions/obs-summary/compose.cjs`

The README documents `CACHE_<KIND>_{HIT|MISS|KEY|PRIMARY|RESTORED|SAVED}` and mentions boolean parsing of `true|1|yes|y`. The composer supports the same plus optional `BYTES`. Examples largely match, but there is no explicit sample for `BYTES` in README.

## Suggested change

- Add a brief example snippet in README showing `CACHE_<KIND>_BYTES` usage and how it contributes to `metrics.cache.summary.bytes_restored_total`.

## Acceptance criteria

- README includes `BYTES` example and notes aggregation field `bytes_restored_total`.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
