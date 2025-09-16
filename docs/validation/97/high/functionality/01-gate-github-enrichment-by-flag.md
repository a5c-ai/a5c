# [Validator] [Functionality] Gate GitHub enrichment behind `--use-github`

### Context

- PR: #97
- Area: `src/enrich.ts` and CLI `enrich` command

### Problem

The CLI exposes a `--use-github` flag, but `handleEnrich` currently invokes `enrichGithubEvent` unconditionally. When no token is present, this results in partial errors being attached even if the user did not opt in to GitHub API calls.

### Why it matters

- Users expect no network/API calls unless explicitly enabled.
- Reduces noisy `partial/errors` output and avoids wasted retries.

### Proposal

- Only call `enrichGithubEvent` when `flags.use_github` is truthy. Otherwise, skip GitHub API enrichment and leave `enriched.github` empty.

### Acceptance Criteria

- When `--use-github` is NOT passed, enrichment makes no GitHub API calls and `enriched.github` is absent (or an empty object).
- When `--use-github` is passed without a token, output sets `enriched.github.partial=true` and records an auth error (current behavior).
- Add a unit test capturing both cases.
