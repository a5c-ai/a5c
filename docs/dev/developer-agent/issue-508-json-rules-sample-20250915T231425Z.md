# Issue 508 — JSON rules sample + docs link

## Context

Add a JSON rules sample mirroring `samples/rules/conflicts.yml` and update CLI docs to reference both formats for composed events rules.

## Plan

- Create `samples/rules/conflicts.json` equivalent to YAML.
- Update `docs/cli/reference.md` to mention JSON/YAML support and add JSON invocation example.
- Verify tests/build; open PR linked to #508.

## Notes

Rules are loaded via `loadRules()` in `src/rules.ts` which supports `.yml/.yaml` and JSON files.
