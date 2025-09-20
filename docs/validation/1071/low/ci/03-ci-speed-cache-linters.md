# Speed up docs CI with caching

## Context
The docs CI installs `codespell` via pip and `markdownlint-cli2` via npx without caches.

## Proposal
- Add `actions/setup-python` `cache: 'pip'` for `codespell` install.
- Add `actions/setup-node` with `cache: 'npm'` and `cache-dependency-path` pointing to `package-lock.json` if using npm-based install for markdownlint.

## Acceptance
- Subsequent runs are noticeably faster (~10–20s saved per job).
