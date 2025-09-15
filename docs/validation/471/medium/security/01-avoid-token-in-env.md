# Avoid exposing Codecov token in job env

Priority: medium priority
Category: security

## Issue

The workflows set `env.CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN || '' }}` at the job level.
This places the secret into the environment of all subsequent steps in the job, increasing the blast radius if any step prints env or echoes the value inadvertently.

## Recommendation

- Remove the job-level `CODECOV_TOKEN` env.
- Guard upload steps using `if: ${{ secrets.CODECOV_TOKEN != '' }}`.
- Pass the token only via the action input: `with: token: ${{ secrets.CODECOV_TOKEN }}`.

This keeps the secret scoped to the upload step input only.
