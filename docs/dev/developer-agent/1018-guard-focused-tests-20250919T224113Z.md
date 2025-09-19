# Work Log — Guard against focused/skipped tests (.only/.skip)

Issue: https://github.com/a5c-ai/events/issues/1018

## Plan

- Add `scripts/lint-tests-focused.sh` to detect `describe/it/test .only(` and `.skip(` under `test/` and `tests/`.
- Wire script into CI `Quick Checks` before unit tests.
- Integrate optional guard in `scripts/precommit.sh` (best-effort; only when script present).
- Document integration in `docs/dev/precommit-hooks.md`.

## Notes

- Uses ripgrep if available; falls back to grep.
- Ignores `node_modules/`, `dist/`, and `coverage/`.
- Pre-commit passes only staged paths; the script self-filters to test directories.

## Results

Initial commit: scaffolding script, CI step, precommit hook call, docs.
