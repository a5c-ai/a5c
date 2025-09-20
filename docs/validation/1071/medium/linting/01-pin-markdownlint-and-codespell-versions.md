# Pin lint tool versions for reproducibility

## Context
The new docs CI uses floating versions:
- `pip install codespell` (no version pin)
- `npx markdownlint-cli2` (resolves latest at runtime)

## Why it matters
Floating versions can introduce non-deterministic failures when upstream releases new rules or behaviors.

## Proposal
- Pin `codespell` to a known good minor (e.g. `codespell==2.3.*`) and periodically bump.
- Replace `npx markdownlint-cli2` with one of:
  - `npx markdownlint-cli2@^0.14.0` to pin a major/minor, or
  - Add `markdownlint-cli2` as a devDependency and run via `npm ci && npx markdownlint-cli2`, or
  - Use the official action `DavidAnson/markdownlint-cli2-action` at a pinned SHA.

## Acceptance
- CI runs are reproducible across time.
- Documented process for periodic version bumps.
