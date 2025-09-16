# Issue #168 – Gate GitHub API behind --use-github

## Plan

- Add opt-in gate in `src/enrich.ts`: require `flags.use_github` AND a token/octokit to import/call `enrichGithubEvent`.
- Record `skipped` reason when not enabled or token missing; still add mentions.
- Keep `include_patch`, `commit_limit`, `file_limit` behavior unchanged.
- Update CLI docs: default is no network; `--use-github` required; token required.
- Add tests for: skipped path; enabled path via injected octokit stub.

## Notes

- `src/cli.ts` already sets `flags.use_github` when `--use-github` is provided.
- Tests should avoid network by stubbing the module or injecting octokit.
