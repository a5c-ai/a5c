Title: Include patch behavior tests stabilize

Category: tests
Priority: low

Context:

- Adjusted tests to ensure `include_patch` gating is validated after adding GitHub API gating.
- Fixed stray test description that led to unexpected EOF in `tests/enrich.basic.test.ts`.

Details:

- Ensure that when `--use-github` is not set, no `enriched.github` key is present.
- When `--use-github` is set without a token, `enriched.github` is present with `partial: true` and no network calls happen.
- With injected `octokit`, `include_patch` true/false toggles the presence of `patch` fields under PR/push files.

Suggested follow-up:

- Consider adding a dedicated unit around rules evaluation metadata to assert `rules_status` shape more strictly.
