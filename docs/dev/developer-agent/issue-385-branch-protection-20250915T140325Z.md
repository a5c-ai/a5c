# Enforce required status checks on a5c/main (Issue #385)

## Plan

- Inventory workflows and exact check names
- Configure branch protection via gh api
- Document required checks and verification

## Notes

Started at 20250915T140325Z UTC.

## Configured required checks

- Lint: context `lint` (workflow: Lint)
- Typecheck: contexts `TypeScript Typecheck (20)`, `TypeScript Typecheck (22)` (workflow: Typecheck)
- PR tests: context `Unit Tests (PR)` (workflow: PR Quick Tests)
- Commit hygiene: context `Conventional Commits validation` (workflow: Commit Hygiene)
- Commit message lint: context `commitlint` (workflow: Commitlint)
- Strict up-to-date before merge: enabled
- Enforce admins: enabled

Verification command:

```
gh api repos/a5c-ai/events/branches/a5c/main/protection \
  --jq '{strict:.required_status_checks.strict,contexts:.required_status_checks.contexts,enforce_admins:.enforce_admins.enabled}'
```
