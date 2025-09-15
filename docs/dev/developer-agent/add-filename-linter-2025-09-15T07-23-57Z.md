# Add filename linter and CI quick check

## Context

Follow-up to PR #368 and validator note to prevent Windows-invalid filenames causing clone failures.

## Plan

- Add scripts/lint-filenames(.cjs) to flag Windows-invalid names
- Add npm script: `lint:filenames`
- Wire into `.github/workflows/quick-checks.yml`
- Open PR against `a5c/main`

## Progress

- Branch created. Starting implementation.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
