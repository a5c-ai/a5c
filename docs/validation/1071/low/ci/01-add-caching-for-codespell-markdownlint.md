# [Low][CI] Add caching for Codespell/Markdownlint

## Context
Docs CI jobs install `codespell` (pip) and run `markdownlint-cli2` via `npx`.
Adding caches can shave seconds and reduce flakiness.

## Recommendation
- Use `actions/setup-python@v5` with `cache: 'pip'` and a `cache-dependency-path` (requirements lock if introduced) for `codespell`.
- For `markdownlint-cli2`, either:
  - `pnpm dlx`/`npm i -g` with an actions cache for the tool dir, or
  - Keep `npx` but accept cold start; revisit if runtime matters.

## Definition of Done
- Pip cache enabled; verify hit in reruns.
- Document rationale in workflow comments.

