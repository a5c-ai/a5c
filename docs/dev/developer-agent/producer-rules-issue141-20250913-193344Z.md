# [Producer] Rules – Evaluate rules and produce composed events (issue #141)

## Context

Implement minimal rules evaluator per docs/specs §6.1 and issue #141.

## Plan

- Loader: YAML/JSON rules from --rules
- Predicates: all/any, `==`, `!=`, `contains(path,value)`
- Paths: `$.` dot paths with `[*]` for arrays
- Match: `on` against event `type`, optional `labels[]`
- Emit: push to `output.composed[]` as `{ key, targets, criteria }`
- Errors: wrap in try/catch, set `enriched.metadata.rules_status`
- Tests: two example rules from specs; assertions for keys/targets

## Notes

- Avoid network; rely on payload fields (and fallback when enriched.github.\* missing)
- Keep implementation minimal and typed
