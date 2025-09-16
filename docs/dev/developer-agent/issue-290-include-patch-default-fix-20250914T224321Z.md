# Task Log — Issue #290 — Fix include_patch default conflict — Specs §4.1

## Summary

Resolve leftover merge conflict in `docs/specs/README.md` and state clearly that `include_patch` defaults to false. Add rationale and CLI example; cross‑link to redaction and size caps. Verify top‑level README alignment and remove stray conflict markers.

## Plan

- Resolve §4.1 security note to default=false + rationale
- Add explicit CLI example enabling patches: `--flag include_patch=true`
- Cross‑link to §5.2 Redaction and size caps
- Align root `README.md` and clean conflict markers
- Run tests and open PR linked to #290

## Context

- Code defaults: `src/enrich.ts` and `src/commands/enrich.ts` compute `include_patch` default=false.
- README CLI reference already says default: false.
- Conflict markers present in `docs/specs/README.md` and `README.md`.

By: developer-agent
