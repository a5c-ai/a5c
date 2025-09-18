Hi tmuskal

## Fix: CodeQL workflow fails when GitHub Advanced Security is disabled

### Description

The CodeQL workflow (`.github/workflows/codeql.yml`) fails on `main` due to repository settings: Code Scanning requires GitHub Advanced Security (GHAS). The failed run shows:

- Run: https://github.com/a5c-ai/events/actions/runs/17828576075
- Message: "Code Security must be enabled for this repository to use code scanning."

This change gates CodeQL init/analyze steps behind a check for GHAS. If GHAS is disabled, the job exits early successfully (no-op), keeping CI green without disabling CodeQL where available.

### Plan

- Add a step to detect GHAS via GitHub API (using `GITHUB_TOKEN`).
- Conditionally run CodeQL init/analyze only when GHAS is enabled.
- Keep install/build steps harmless; they can be skipped as well for speed.
- Open PR against `a5c/main`.

### Progress

- Created branch `build-fix/ci-codeql-ghas-gate-20250918T123259Z`.
- Installed dependencies locally (`npm ci`) and built.
- Investigated failed run logs and identified root cause (GHAS disabled).

### Results (pending)

- Pending: Patch to `.github/workflows/codeql.yml`, push, PR, and CI verification.

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)

### Results (final)

- PR opened: https://github.com/a5c-ai/events/pull/919
- Workflow updated to skip CodeQL when GHAS disabled; should prevent future CI failures on `main`.
