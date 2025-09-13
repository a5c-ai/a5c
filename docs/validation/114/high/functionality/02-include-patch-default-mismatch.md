# `include_patch` default mismatches specs (docs/specs/README.md §4.1)

Priority: high
Category: functionality

Specs state that `include_patch` default is `false`, but `handleEnrich` currently computes:

```ts
const includePatch = toBool(opts.flags?.include_patch ?? true)
```

This yields a default of `true` when the flag is omitted, contradicting the spec.

Options to resolve:
- Change default to `false` (preferred to align with docs and to keep outputs lighter by default), or
- Update the spec to reflect current behavior if we deliberately want patches by default.

Note: The PR verifies behavior for `include_patch=false` (patch omitted), which works, but default remains misaligned.
