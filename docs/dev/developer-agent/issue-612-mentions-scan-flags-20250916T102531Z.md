# Task: Wire flags for mention scanning sources (commit messages, issue comments)

Issue: #612

## Plan

- Parse flags in `handleEnrich`: `mentions.scan.commit_messages`, `mentions.scan.issue_comments` (default true)
- Gate mention extraction from commit messages and issue comments accordingly
- Update CLI docs and README with flags and examples
- Add tests verifying disabled behavior and defaults

## Notes

- Do not change PR title/body scanning.
- Maintain code-comment scanning behavior and existing flags.
- Tests to target `samples/push.json` and `samples/issue_comment.created.json` fixtures.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
