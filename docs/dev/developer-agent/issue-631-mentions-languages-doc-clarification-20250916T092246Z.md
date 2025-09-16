# Issue #631 – Clarify mentions.languages input format

## Context

Validator noted mismatch between docs and implementation for `mentions.languages` under `events enrich`. Implementation compares language codes (js, ts, py, go, yaml, md) while docs/examples sometimes show extensions (tsx, jsx, yml) which are mapped to ts/js/yaml.

## Plan

- Normalize user-provided `mentions.languages` to canonical language codes.
- Update README and CLI reference to clearly state accepted codes and note extension normalization.
- Keep backward-friendly behavior by accepting common extensions (`tsx`→`ts`, `jsx`→`js`, `yml`→`yaml`).
- Add a brief test or validation note if needed.

## Notes

- Code touchpoints: src/enrich.ts (flag parsing), src/utils/commentScanner.ts (EXT_TO_LANG mapping).
- Docs touchpoints: README.md, docs/cli/reference.md.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
