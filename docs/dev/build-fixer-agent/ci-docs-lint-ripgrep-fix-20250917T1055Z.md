# CI Fix: Install ripgrep for docs-lint

- Context: Quick Checks workflow failing in "Docs Lint (banned phrases)" because `rg` is not found on the runner.
- Root cause: Job uses `rg` (ripgrep) without ensuring it is installed.
- Plan: Add an install step to the docs-lint job to `apt-get install ripgrep` before running the scan.
- Verification: Expect the docs-lint job to pass; no matching banned phrases right now. Link failing run: https://github.com/a5c-ai/events/actions/runs/17795165247
