# Issue 883 – Resolve stale notes about include_patch default

Status: in progress

Summary:

- Clean up validation notes claiming a spec/impl mismatch for `include_patch` default.
- Ensure single source of truth states default is `false` in README and CLI reference.

Plan:

- Update or deprecate docs under `docs/validation/114/**` related to include_patch mismatch/tests.
- Fix `docs/validation/200/low/documentation/01-clarify-cli-flags.md` to state default is `false` and point to CLI reference.
- Cross-check `README.md` and `docs/cli/reference.md#events-enrich` for consistency.
- Open PR linked to issue #883.

Notes:

- Current code: `src/enrich.ts` uses `opts.flags?.include_patch ?? false`.
- Tests cover both default `false` and explicit `true` cases.
