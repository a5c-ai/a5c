# [Low] Documentation – Clarify default to GITHUB_EVENT_PATH for `--source action|actions`

Category: documentation
Priority: low

### Summary

The CLI now accepts `--source actions` as an alias and normalizes to `provenance.source: "action"`. When `--source action|actions` is used without `--in`, the CLI auto-uses `GITHUB_EVENT_PATH` if available, otherwise exits with code 2 and a clear error.

### Suggestion

- In `README.md` and `docs/cli/reference.md`, explicitly state that omitting `--in` with `--source action|actions` will default to `GITHUB_EVENT_PATH` (when set). The exit-code section already mentions the missing-env error; adding a brief note under usage/examples would improve discoverability.

### Rationale

Improves UX for GitHub Actions users and reduces confusion about when `--in` is required.

### Scope

- `README.md` (CLI normalize section)
- `docs/cli/reference.md` (`events normalize` usage/examples)

No code changes required.
