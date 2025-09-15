# [Validator] [Documentation] - Document mentions scan flags in README

Priority: low priority
Labels: validator, documentation

## Context

PR #175 adds config flags for scanning code-comment mentions in changed files during enrichment:

- `mentions.scan.changed_files` (default: true)
- `mentions.max_file_bytes` (default: 200KB)
- `mentions.languages` (optional allowlist like `ts,tsx,js,jsx`)

## Ask

- Add a short section to `README.md` (Enrichment > Mentions) describing these flags with examples (CLI and programmatic usage).
- Include note on performance guardrails (binary patches skipped, size limit) and language allowlist.

## Rationale

Clarifies usage and prevents confusion when scanning is disabled or restricted via flags.
