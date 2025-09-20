# Task: Correct mentions CLI examples — Mentions (Issue #1056)

## Context

- Problem: `docs/user/product-flows.md` shows `events mentions` with `--flag mentions.*` which belongs to `events enrich` (code-comment scanning). This causes confusion and broken examples.

## Plan

1. Replace code-comment example with `events enrich` using sample PR payload and `--flag mentions.*` (offline-safe).
2. Keep `events mentions` example for stdin/file usage only (no `--flag mentions.*`).
3. Cross-link to `docs/cli/reference.md#events-enrich` and `docs/cli/code-comment-mentions.md`.
4. Add a “When to use which” note clarifying the two paths.
5. Verify examples execute without CLI errors on local repo samples.

## Notes

- Use `samples/pull_request.synchronize.json` for `enrich` example; stay offline (`--use-github` omitted). Add `--flag include_patch=true` to allow patch-based scan when patches are present.
- `events mentions` examples will use explicit stdin/--file to avoid blocking on empty stdin.
