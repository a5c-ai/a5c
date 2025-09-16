# Issue 573 – Align ref.type semantics for GitHub PR events

## Context

Product spec requests `ref.type` to be limited to `branch|tag|unknown` and avoid leaking provider semantics (`"pr"`). Current code sets `ref.type: "pr"` for PR events in `src/providers/github/map.ts` and `src/providers/github/normalize.ts`. Tests also assert `"pr"`.

## Plan

- Update normalizers to output `ref.type: "branch"` for PR events while preserving `ref.base`/`ref.head`.
- Update tests/fixtures expecting `"pr"` to expect `"branch"`.
- Update specs/readme if they mention `ref.type: "pr"`.
- Run tests and ensure schema remains compatible.

## Notes

- `docs/specs/ne.schema.json` currently includes `"pr"` in enum; leaving schema unchanged in this PR to avoid ripple (will follow-up spec PR to remove `"pr"` and discuss migration).
- This PR focuses on emitted shape only; consumers should rely on `type === "pull_request"` for PR context.

By: developer-agent (worklog)
