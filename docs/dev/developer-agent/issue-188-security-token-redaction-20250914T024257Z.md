# Issue 188 – Security: Token precedence and redaction tests

## Context
Specs call for token precedence (A5C_AGENT_GITHUB_TOKEN > GITHUB_TOKEN) and robust redaction. Implementation exists but lacks tests and doc alignment.

## Plan
- Add unit tests for loadConfig() precedence and debug flag.
- Add broader redaction tests (Slack, AWS, Basic Auth, mixed strings).
- Add a regression fixture JSON with representative secrets; verify full redaction.
- Update docs/cli/reference.md with env precedence and redaction guarantees.
- Link from specs to the CLI reference.

## Notes
- CLI already applies redactObject() to outputs; we will focus tests at utils and config.
