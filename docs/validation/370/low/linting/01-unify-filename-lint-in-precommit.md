# Unify filename lint in pre-commit

Priority: low
Category: linting

The new filename linter (`scripts/lint-filenames.cjs`) is comprehensive (reserved names, invalid chars, trailing dot/space). Our pre-commit currently flags only `:` via a simple grep. Consider invoking the linter on staged files from pre-commit to align local enforcement with CI and catch more cases earlier.

Suggested approach:

- In `scripts/precommit.sh`, replace the `:` grep with a call to `node scripts/lint-filenames.cjs` limited to staged files (or run full-repo when small). This keeps a single source of truth for rules.
- Keep a fast path to avoid slowing pre-commit on large repos (e.g., pass only `git diff --cached --name-only` to the linter when feasible).

Non-blocking: CI already covers this via Quick Checks.
