# Issue #282 — Enforce Conventional Commits (commit hygiene)

## Plan

- Add `scripts/commit-verify.ts` to validate commit messages and PR titles.
- Add Husky `commit-msg` hook to run local checks.
- Add CI workflow `commit-hygiene.yml` to validate PR commits and title.
- Update `CONTRIBUTING.md` with Conventional Commits guidance and examples.

## Notes

- Primary branch: `a5c/main`. Workflow should trigger on PRs targeting `a5c/main`.
- Keep checks fast; avoid heavy installs. Use `tsx` to run TS script without build.

## Progress

- Branch created.
- Initial doc committed before adding hooks.
