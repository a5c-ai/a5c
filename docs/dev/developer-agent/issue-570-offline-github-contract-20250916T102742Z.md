# Dev Log — Issue #570: Finalize offline GitHub enrichment contract

## Summary

Align docs to the decided offline enrichment contract for GitHub when `--use-github` is not set: `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }`. Confirm CLI exit code `3` when `--use-github` is set without a token. Tests already cover these behaviors; no code change expected.

## Plan

- Update docs/cli/reference.md to remove `github_enrich_disabled`/`skipped` variants
- Keep README wording aligned (currently correct)
- Verify tests for offline stub and token-missing paths
- Open PR and request validation review
