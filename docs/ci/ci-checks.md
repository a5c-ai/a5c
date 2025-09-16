# CI Checks and Triggers

This repo uses a fast/slow split for CI to keep PR feedback under a few minutes while gating heavier work on protected branches.

## Quick Checks (PR)

- Name: `Quick Checks`
- Triggers: `pull_request` to `a5c/main`, `main`
- Node: 20 (cache: npm)
- Steps:
  - `npm ci`
  - `npm run lint` (eslint)
  - `npm run typecheck` (tsc --noEmit)
  - `npm run test:ci` (vitest with coverage)
  - Artifacts: `coverage/lcov.info`, `coverage/coverage-summary.json`
  - Step summary: Coverage table appended to the job summary
  - Optional Codecov upload: prefer `codecov/codecov-action@v4` guarded by a token

### Coverage Upload

Default (recommended) — use the Codecov GitHub Action in CI and gate on a secret/variable (aligns with repo workflows):

```yaml
env:
  CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN || vars.CODECOV_TOKEN || '' }}

- name: Upload coverage to Codecov (optional)
  if: env.CODECOV_TOKEN != ''
  uses: codecov/codecov-action@v4
  with:
    token: ${{ env.CODECOV_TOKEN }}
    files: coverage/lcov.info
    flags: pr
    fail_ci_if_error: false
```

Alternative — script/uploader for local or non–GitHub Actions CI. Do not combine both methods in the same workflow to avoid duplicate uploads.

Recommended as a required PR check.

### Example Validation

Validate that a normalized example matches the NE schema. CI uses `ajv-cli` with pinned versions, and gracefully falls back to the built-in validator to avoid network flakiness.

Copy/paste to run locally with ajv-cli (Draft 2020-12 + formats):

```
# produce an example NE json
npm run build --silent
node dist/cli.js normalize \
  --in samples/workflow_run.completed.json \
  --out /tmp/out.ne.json

# validate with ajv-cli v5 and ajv-formats v3 (pinned)
npx -y ajv-cli@5.0.0 validate \
  -s docs/specs/ne.schema.json \
  -d /tmp/out.ne.json \
  --spec=draft2020 \
  -c ajv-formats@3.0.1
```

Local alternative using the built-in CLI (no network dependency):

```
npm run build --silent
node dist/cli.js validate \
  --in /tmp/out.ne.json \
  --schema docs/specs/ne.schema.json \
  --quiet
```

Tip: `npm run validate:examples` runs both checks locally.

## Lint (PR)

- Name: `Lint`
- Triggers: `pull_request` to `a5c/main`, `main`
- Node: 20 (via `.nvmrc`)
- Steps: `npm ci`, `npm run lint`

Runs independently to provide fast, focused lint feedback. Quick Checks also lints, so keeping both is optional for enforcement but useful for clarity.

## Typecheck (PR)

- Name: `Typecheck`
- Triggers: `pull_request` to `a5c/main`, `main`
- Matrix: Node 20, 22
- Steps: `npm ci`, `npm run typecheck` with a job summary per node version

Runs independently to surface TS errors early across supported Node versions. Quick Checks also typechecks.

## Build and Unit Tests (Push gates)

- Name: `Build`
- Triggers: `push` to `a5c/main`, `main`
- Steps: `./scripts/build.sh`

- Name: `Tests`
- Triggers: `push` and `pull_request` to `a5c/main` (lightweight; mirrors Quick Checks but uploads coverage artifacts for diagnostics)
- Steps: `./scripts/install.sh`, `./scripts/build.sh`, `./scripts/test.sh`, CLI smoke tests, coverage artifact + step summary

Heavier/longer gates run on protected branches to keep PRs snappy while maintaining strong guarantees before merge/deploy.

## Coverage Upload (Codecov)

Default (recommended) — use the Codecov GitHub Action in CI and gate on a secret/variable (aligns with repo workflows):

```yaml
env:
  CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN || vars.CODECOV_TOKEN || '' }}

- name: Upload coverage to Codecov (optional)
  if: env.CODECOV_TOKEN != ''
  uses: codecov/codecov-action@v4
  with:
    token: ${{ env.CODECOV_TOKEN }}
    files: coverage/lcov.info
    flags: pr
    fail_ci_if_error: false
```

Alternative — script/uploader for local or non–GitHub Actions CI. Do not combine both methods in the same workflow to avoid duplicate uploads.

## Commit Hygiene (PR)

- Name: `Commit Hygiene`
- Triggers: `pull_request` to `a5c/main`
- Validates PR title and commit messages against Conventional Commits (non-blocking title validation; commits enforced).

## a5c Router Integration

The agent router (`.github/workflows/a5c.yml`) listens for `workflow_run.completed` events from:

- `Build`, `Deploy`, `Packages Npx Test`, `Lint`, `Tests`, `Quick Checks`, `Typecheck`, `Commit Hygiene`.
  It filters to failed runs on `a5c/main` and `main` and can dispatch follow-ups automatically.

## Repository Settings (Recommended)

Under Settings → Branches → Branch protection rules for `a5c/main` and `main`, configure:

- Required status checks: `Quick Checks` (recommended), optionally `Lint`, `Typecheck`.
- Ensure “Require branches to be up to date before merging” to include these checks.

Notes

- Vitest coverage writes `coverage/lcov.info` and `coverage/coverage-summary.json` (enabled via `vitest.config.ts`).
- `scripts/*` are the single source of truth for install/build/test and are used by workflows for consistency.
