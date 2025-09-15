## Issue #455 — Composite actions provision Node internally

Context: Ensure `.github/actions/obs-summary` and `.github/actions/obs-collector` set up Node themselves via `actions/setup-node@v4` with default Node 20, and document an overridable `with.node-version` input. PR linkage: #470.

Plan:

- Add `inputs.node-version` (default 20) to both composites
- Add first step of `actions/setup-node@v4` consuming the input
- Update composite READMEs and root README usage notes
- Verify via local install, build, typecheck, lint, and tests

Work log:

- Added `inputs.node-version` and a `Setup Node.js` step to both composite `action.yml` files
- Updated `.github/actions/obs-summary/README.md` and `.github/actions/obs-collector/README.md`
- Updated root `README.md` note about built-in Node setup and override
- Ran `npm ci`, `build`, and will run `typecheck`, `lint`, and `test`

Verification:

- Local: build OK; will run typecheck, lint, tests to confirm

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
