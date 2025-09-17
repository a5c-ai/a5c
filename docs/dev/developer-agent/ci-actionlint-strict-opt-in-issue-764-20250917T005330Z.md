# CI: actionlint strict opt‑in (Issue #764)

## Goal

Add opt‑in strict mode controlled by env var `REQUIRE_ACTIONLINT` to fail CI on actionlint findings. Default remains advisory (non‑blocking), preserving existing network/docker skip behavior.

## Plan

- Update `scripts/ci-actionlint.sh` to detect truthy `REQUIRE_ACTIONLINT` (`1,true,yes,on,strict`) and:
  - Log mode: `::notice::actionlint mode: advisory` or `::notice::actionlint mode: strict`.
  - In strict mode, exit non‑zero if actionlint reports findings; otherwise zero.
  - Keep binary‑first, docker fallback, and graceful skip with notices.
- In `.github/workflows/quick-checks.yml`, pass `REQUIRE_ACTIONLINT: ${{ vars.REQUIRE_ACTIONLINT || '' }}` to the actionlint step.
- Document modes and expected logs here.

## Notes

- Advisory mode emits `::warning::actionlint found issues. Proceeding without failing CI.`
- Strict mode emits `::error title=Actionlint Findings::...` and returns non‑zero.
