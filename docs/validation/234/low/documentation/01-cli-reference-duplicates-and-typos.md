# [Low] Documentation – CLI reference duplicates and typos

Category: documentation
Severity: low priority

Findings in `docs/cli/reference.md` (non-blocking):
- Duplicated bullets under “5) Configuration” for CLI flags lines (appears 2–3 times).
- Stray text in bullets: ``--filter expr` expr``` (extra backtick and repeated word).

Suggested fixes:
- Keep a single authoritative bullet list for implemented/planned CLI flags in section 5, remove duplicates.
- Normalize the bullet to: `--select paths`, `--filter expr` without extra backticks/duplication.

Rationale:
- Improves clarity and prevents user confusion when reading the CLI reference.

No code changes required.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
