# [Low] Docs phrasing – align "Tests" job naming across README and CI guide

Category: documentation · Priority: low

Context:

- README "CI Checks" section summarizes PR checks as including a lightweight `Tests` job and push gates including `Build` and `Tests`.
- `docs/ci/ci-checks.md` uses headings like "Quick Checks (PR)" and "Build and Unit Tests (Push gates)".

Why it matters:

- Minor naming drift can confuse readers trying to match README summaries to the CI guide and workflow job names.

Suggestion:

- Pick a single phrasing for the PR test job and the push test job, e.g.:
  - PR: "Tests (Quick)" or "Unit Tests (PR)"
  - Push: "Build and Unit Tests (Push)"
- Ensure the README phrasing mirrors the section titles in `docs/ci/ci-checks.md`.

Notes:

- Non-blocking; can be adjusted opportunistically in a follow-up docs pass.
