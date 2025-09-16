# Issue #563 – Document offline GitHub enrichment contract

## Plan

- Clarify docs for offline vs online enrichment
- Add example JSON excerpt for offline stub and online fields
- Add a small test to assert offline stub shape (no PR/push details)

## Notes

- Implementation returns `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }` when `--use-github` is not set.
- CLI exits with code 3 when `--use-github` is set but token missing (no JSON output).

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
