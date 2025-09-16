# Redundant `include_patch=false` in docs/user/quickstart.md

Context: PR #602 clarifies that `include_patch` defaults to `false` and examples should rely on the default unless demonstrating an explicit opt-in (`--flag include_patch=true`).

Observation:

- docs/user/quickstart.md shows an example that explicitly passes `--flag include_patch=false` even though `false` is the default.

Why change:

- Keeping examples minimal avoids mixed signals and reinforces the default behavior.

Recommendation:

- Remove `--flag include_patch=false` from the quickstart example. Retain explicit `--flag include_patch=true` examples only where diffs are required.
