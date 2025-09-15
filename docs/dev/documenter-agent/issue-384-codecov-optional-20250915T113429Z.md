# Issue #384 – Optional Codecov upload + README badge — Coverage

## Context

Vitest already emits `coverage/lcov.info` and `coverage/coverage-summary.json` and CI uploads artifacts and renders summaries. Request: optionally upload to Codecov (guarded) and add README badge.

## Plan

- Add guarded Codecov step to `tests.yml` (push) and to PR workflows (`quick-checks.yml`, `pr-tests.yml`).
- Guard with `if: env.CODECOV_TOKEN != ''` and set job `env: CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN || '' }}`.
- Use `codecov/codecov-action@v4` with `files: coverage/lcov.info`, `fail_ci_if_error: false`.
- Update README with Codecov badge (main branch) linking to Codecov repo page.
- Keep existing artifacts and summaries.

## Notes

- Private repo: badge will render once Codecov is enabled and token connected; otherwise it may show unknown until initial upload occurs.
- No workflow added; only steps. No change to `a5c.yml` triggers required.
