# Redundant `include_patch=false` in example

Priority: low

Context: PR #602 clarifies that `include_patch` defaults to `false` and examples should rely on the default unless demonstrating an explicit opt-in.

Finding:

- File: `docs/user/quick-start.md`
- Line ~65 shows an example that explicitly passes `--flag include_patch=false` even though `false` is the default.

Recommendation:

- Remove `--flag include_patch=false` from the example to keep examples concise and consistent with the clarified default behavior. Retain explicit `--flag include_patch=true` examples where diffs are required.

Rationale:

- Reduces redundancy and potential confusion. Default is clearly documented across specs and CLI reference.

Scope: documentation only; no code change required.
