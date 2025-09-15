# [Validator] Documentation – Prevent Windows-invalid filenames

## Context

This PR fixes Windows clone failures caused by `:` in documentation filenames by renaming them to use `-`.

## Suggestion (non-blocking)

Add lightweight safeguards to prevent regressions:

- Repo lint script that fails on filenames containing Windows-invalid characters: `[:<>"\\|?*]`.
- CI job (quick) and/or pre-commit hook to run the check.
- Update `docs/contributing/windows-filenames.md` with the command used in CI.

## Acceptance Criteria

- `npm run lint:filenames` exists and scans the repo (or at least `docs/**`) for invalid characters.
- CI runs the filename lint on PRs.
- Contributing guide documents the rule and how to fix.

## Notes

- Keep intentional examples of bad filenames in docs by wrapping them in code blocks only; the linter should ignore inline code samples in markdown, but enforce actual filenames in the tree.
