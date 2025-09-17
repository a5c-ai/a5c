# CI: actionlint strict opt-in (Issue #764)

## Goal

Add opt-in strict mode for actionlint using `REQUIRE_ACTIONLINT` env var. Truthy values fail on findings; default is advisory.

## Plan

- Parse `REQUIRE_ACTIONLINT` in `scripts/ci-actionlint.sh`
- Pass `${{ vars.REQUIRE_ACTIONLINT || '' }}` in `.github/workflows/quick-checks.yml`
- Document behavior and truthy parsing here

## Truthy detection

Accepted truthy (case-insensitive): `1`, `true`, `yes`, `on`, `strict`.
Any other or empty ⇒ advisory (non-failing).

## Expected logs

- Advisory: `::notice::actionlint mode: advisory` and warnings for findings.
- Strict: `::notice::actionlint mode: strict` and `::error::actionlint found issues` with non-zero exit.

## Notes

We maintain binary install first, Docker fallback, and graceful skip when neither curl nor docker is available.
