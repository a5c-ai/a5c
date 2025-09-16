# Task Log — Issue #555 — Clarify include_patch default in docs

## Context

- Goal: ensure `include_patch` default is documented as `false` consistently.
- References: docs/specs/README.md (§4.1), README.md (CLI Reference > enrich), docs/validation/114/\* notes.

## Findings

- Code default: `src/enrich.ts` uses `toBool(opts.flags?.include_patch ?? false)` — default is false.
- Specs: §7 Security explicitly reiterates `include_patch defaults to false`.
- README: shows flag with `(default: false)` but examples still pass `include_patch=false`.
- CLI reference: mentions default=false; will tweak examples to show enabling when needed.

## Plan

1. Update README enrich examples to either omit the flag (relying on default) or demonstrate enabling with `--flag include_patch=true`.
2. Ensure docs/cli/reference.md mirrors that pattern.
3. Leave specs as-is; already consistent.

## Verification

- Build succeeds; no code changes required.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
