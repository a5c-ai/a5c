# [Dev] Align offline GitHub enrich reason to `github_enrich_disabled`

Issue: #550

## Plan

- Update src implementation: set offline stub reason to `github_enrich_disabled` when `--use-github` is not set.
- Update tests and golden fixtures to expect the new reason.
- Sweep and update docs (README, docs/cli/reference.md, user quickstart) and any references under docs/validation and docs/dev.
- Build and run tests locally; fix any snapshot/golden mismatches.
- Open PR linked to issue with labels, and request validator review.

## Notes

- Keep `token:missing` for the requested-but-no-token branch.
- Maintain no network behavior by default; only reason string changes.
