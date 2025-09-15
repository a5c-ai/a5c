# [Validator] [CI] - Make upload step always in obs-collector

## Context
Composite action `.github/actions/obs-collector/action.yml` uploads the generated `observability.json` artifact. Unlike `obs-summary`, its upload step currently lacks `if: always()`. If the collection step fails (e.g., JSON parse error), the artifact will be skipped, reducing observability on failures.

## Recommendation
- Set `if: always()` on the "Upload observability.json" step in `.github/actions/obs-collector/action.yml` to ensure artifact upload even when prior steps fail.

## Priority
low

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)

