# Dev Log — README: Logging + Troubleshooting (Issue #1029)

## Scope

- Add a Logging section: `--log-level`, `--log-format`, with link to CLI reference.
- Add a Troubleshooting section: offline vs `--use-github`, exit codes 2/3, token/rate-limit guidance.

## Plan

1. Update README.md with concise sections.
2. Cross-link to `docs/cli/reference.md` and `docs/observability.md`.
3. Validate content aligns with CLI reference (global flags + enrich behavior).

## Notes

- Canonical defaults: log level `info`, format `pretty`.
- Offline reason is `flag:not_set`; exit code `3` on `--use-github` without a token.
- Exit code `2` for input/validation errors (e.g., missing `--in` outside Actions).

## Done

- [ ] Sections drafted
- [ ] PR opened
- [ ] Ready for review
