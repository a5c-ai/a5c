# Build Fix: Commitlint lenient mode subject-case false positive

## Context

- Failing run: https://github.com/a5c-ai/events/actions/runs/17793825142
- Job: commitlint → step “Validate commit messages in PR”
- Error: `subject must not be sentence-case... [subject-case]`
- PR base: `main` (release merge)

## Diagnosis

- `.github/workflows/commitlint.yml` intends lenient config on PRs into `main` by passing `--config commitlint.lenient.cjs`.
- However the run still enforced `subject-case`. Likely due to commitlint not resolving config from file via stdin, or parser mapping causing subject-case to trigger when default config is loaded.

## Plan

1. Ensure lenient config disables `subject-case` and is definitely loaded.
2. Explicitly pass `--extends` to include conventional rules and point to lenient config via `--config` with absolute path to avoid resolution issues.
3. Adjust the workflow to set CONFIG only for base `main` and use `npx -y commitlint` consistently.
4. Verify locally with sample messages and via `npm run` script.

## Verification Steps

- Run `npx commitlint --config commitlint.lenient.cjs -V` against the failing message.
- Open PR and observe Commitlint job behavior.
