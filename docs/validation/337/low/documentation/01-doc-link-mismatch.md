# [Low] Docs link mismatch: filename vs PR description

The PR description references `docs/dev/precommit-local-tooling.md`, but the actual
document added is `docs/dev/precommit-hooks.md`.

## Why it matters

- Minor confusion for reviewers/users following the PR description.

## Recommendation

- Either update the PR description to link `docs/dev/precommit-hooks.md`, or
- Add a short alias doc `docs/dev/precommit-local-tooling.md` that points to
  `precommit-hooks.md`.

This is non-blocking and can be addressed post-merge.
