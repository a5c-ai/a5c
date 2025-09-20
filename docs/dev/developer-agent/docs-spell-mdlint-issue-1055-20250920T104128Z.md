# Docs spellcheck & markdownlint — implementation notes

## Context

Issue: https://github.com/a5c-ai/events/issues/1055
Goal: Add quick docs quality checks (codespell, markdownlint) for PRs.

## Plan

- Add `.codespellrc` and `.markdownlint.json` with tuned ignores.
- Extend existing `Docs Lint` workflow with two new jobs:
  - `codespell` via Python `codespell`
  - `markdownlint` via `markdownlint-cli2`
- Keep triggers focused on docs paths for speed.
- Ensure `a5c.yml` picks it up via existing `Docs Lint` workflow name.

## Notes

- Codespell ignores: dist, coverage, node_modules, lockfiles, svg/minified, etc.; ignore words: `crate, aks, te, a5c`.
- Markdownlint relaxes MD013/MD033/MD041 and tweaks list rules to match repo style.

End.
