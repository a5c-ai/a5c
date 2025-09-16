# Developer Log – Issue #252: Guard `.composed` in jq example

## Context

CLI docs `docs/cli/reference.md` currently show:

```
jq '[.composed[] | {key, reason}]'
```

This fails when `.composed` is null/undefined. We should guard with `(.composed // [])` and use `map(...)` to avoid null-indexing.

## Plan

- Update example to:

```
jq '(.composed // []) | map({key, reason})'
```

- Add note: `reason` may be omitted depending on rule configuration.
- Link to specs §6.1: `docs/specs/README.md#61-rule-engine-and-composed-events`.

## Notes

No code changes required; docs-only.
