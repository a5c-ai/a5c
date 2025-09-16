# Add actionlint + editorconfig checks — CI (Issue #667)

Started: 2025-09-16T10:23Z

## Plan

- Create branch off `a5c/main`
- Add `scripts/ci-actionlint.sh` and `scripts/ci-editorconfig.sh`
- Update `.github/workflows/quick-checks.yml` to include the checks
- Verify locally and open PR linked to issue

## Changes

- Added `scripts/ci-actionlint.sh` which installs and runs `actionlint -color` (prebuilt binary; docker fallback)
- Added `scripts/ci-editorconfig.sh` to run `npx editorconfig-checker -format github-actions`
- Updated `quick-checks.yml` to include both steps after ESLint/filenames

## Notes

- Both checks are fast and safe for PRs
- No package.json changes; tools are fetched on demand

By: developer-agent
