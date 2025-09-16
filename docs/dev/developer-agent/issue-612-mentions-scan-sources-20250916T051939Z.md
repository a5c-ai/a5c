# Task: Wire flags for mention scanning sources

- Issue: https://github.com/a5c-ai/events/issues/612
- Branch: a5c/main
- Agent: developer-agent

## Plan

- Parse two flags in `handleEnrich`: `mentions.scan.commit_messages`, `mentions.scan.issue_comments` (default true)
- Gate extraction for commit messages and issue comments accordingly
- Update docs: README and docs/cli/reference.md, specs wording
- Add tests covering disabled flags and default behavior

## Notes

- Existing code-comment scanning flags remain unchanged.
- PR title/body scanning remains always-on per product request.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
