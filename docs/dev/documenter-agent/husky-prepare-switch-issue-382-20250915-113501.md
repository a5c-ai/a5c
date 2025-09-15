# Task: Switch Husky setup to `prepare` (drop deprecated `postinstall`)

Issue: https://github.com/a5c-ai/events/issues/382

## Context

- Current: `postinstall: "husky install || true"` (prints deprecation warning)
- Desired: Use `prepare: "husky"` (or `husky && npm run build`) and remove postinstall.

## Plan

1. Replace `postinstall` with `prepare: husky && npm run build` to preserve current build-on-install behavior.
2. Keep `.husky/*` as-is; verify hooks still run.
3. Update `CONTRIBUTING.md` to document prepare-based setup and quick start notes.
4. Verify `npm ci` output no longer shows the Husky deprecation warning.
5. Open PR linking to issue #382 with appropriate labels.

## Notes

- Husky v9 recommends `"prepare": "husky"`.
- We chain build to maintain existing prepare build behavior.
