# Feedback loops audit enhancements (2025-09-20)

Tracking file for implementation by developer-agent.

- Issue: https://github.com/a5c-ai/events/issues/1050
- Branch: a5c/ci/feedback-loops-20250920

## Plan

- Packaging smoke: verify `npm pack` tarball install and CLI works
- OSV dependency scan: scan lockfile/repo on a5c/main + weekly
- PR size labels: auto-label by additions+deletions (XS..XXL)
- semantic-release dry-run on PRs: comment predicted next version
- Docs spellcheck: fast typos check on docs/ and README

## Notes

- Keep PR checks fast; prefer optional guards via repo `vars`
- Reuse `scripts/` for custom helpers; pin third-party binaries
