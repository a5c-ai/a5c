# Spec default vs implementation: include_patch

Priority: medium
Category: documentation

Observation:

- Specs state `include_patch` default is `false` (docs/specs/README.md §4.1 and §4.1 notes).
- Current implementation defaults to `true` in `src/enrich.ts`:
  ```ts
  const includePatch = toBool(opts.flags?.include_patch ?? true);
  ```
  Impact:
- Users following specs may expect patches omitted unless explicitly enabled; current behavior includes patches by default.

Options:

1. Align code to specs: change default to `false` and update any affected docs/tests.
2. Adjust specs/docs: document that default is `true` and highlight `--flag include_patch=false` to omit patches.

Recommendation:

- Prefer Option 1 for security: diffs can contain secrets; safer default is to omit `patch` fields.

Status: non-blocking for PR #114.
