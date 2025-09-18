# Task: Document enrich input default (GITHUB_EVENT_PATH)

Issue: #881

## Context

Implementation in `src/cli.ts` for `events enrich` falls back to `process.env.GITHUB_EVENT_PATH` when `--in` is omitted. Docs currently do not call this out.

## Plan

- Add explicit note under `events enrich` in `docs/cli/reference.md` that `--in` defaults to `GITHUB_EVENT_PATH` when set (useful in GitHub Actions)
- Add a short Actions usage example that omits `--in`
- Verify local build/tests and run a quick docs lint (link integrity via grep/spot-check)

## Acceptance Notes

- Keep changes scoped to docs, consistent tone/style with existing CLI reference
- Ensure anchors and cross-links still resolve

## Initial Status

Scanned repo, verified fallback behavior in `src/cli.ts`. Proceeding to doc changes next.
