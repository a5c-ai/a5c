# Prepush related tests robustness – notes

Non-blocking observations for PR #771:

- Using local `node_modules/.bin/vitest` first with fallback to `npx --yes vitest` is good for PATH consistency. Consider adding `--no-install` to `npx` to avoid network fetches when not needed (non-blocking).
- The git pathspecs in `scripts/prepush-related.js` use shell-quoted globs passed to Git, which is safe across POSIX shells; good choice. Optional: use `--diff-filter=AM` to limit to added/modified files.
- `.husky/pre-push` uses `set -eu` to keep POSIX compatibility; avoid `pipefail` which is bash-only; good.
- Minor: `package.json` defines both `prepush` and `prepush:full`. Since the `.husky/pre-push` already falls back, the `|| npx --yes vitest run` in `prepush` script is redundant. Not harmful.
