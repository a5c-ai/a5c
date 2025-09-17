# Pin editorconfig-checker version in CI (Issue #720)

## Plan

- Pin editorconfig-checker to a vetted default (3.4.0) in `scripts/ci-editorconfig.sh` with env override.
- Expose `EDITORCONFIG_CHECKER_VERSION` in `Quick Checks` workflow using repo variable default.
- Update docs to state pinning policy and override/bump instructions.

## Rationale

Using `@latest` in CI can introduce flakiness when upstream releases change behavior. Pinning ensures reproducibility with an explicit path to upgrade via a repo Variable.

## Changes

- scripts/ci-editorconfig.sh: resolve version from `$EDITORCONFIG_CHECKER_VERSION` or default to `3.4.0`; log chosen version; keep exclude regex intact.
- .github/workflows/quick-checks.yml: add job env `EDITORCONFIG_CHECKER_VERSION: ${{ vars.EDITORCONFIG_CHECKER_VERSION || '3.4.0' }}`.
- docs/ci/ci-checks.md: document pinning + override, include snippet.

## Notes

Default aligns with prior validation guidance. Override by setting repo Variable `EDITORCONFIG_CHECKER_VERSION`.
