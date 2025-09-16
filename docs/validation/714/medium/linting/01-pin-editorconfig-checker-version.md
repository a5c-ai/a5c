## Pin editorconfig-checker version for reproducibility

Context: PR #714 updated `scripts/ci-editorconfig.sh` to run `npx --yes editorconfig-checker@latest`.

While using `@latest` solved the immediate CI failure, it introduces variability over time as the tool’s behavior may change across releases. Pinning to a specific, known-good version (for example, the one verified in this PR’s run) improves reproducibility and reduces flaky CI.

Suggested change:

- Replace `editorconfig-checker@latest` with an explicit version (e.g. `editorconfig-checker@3.4.0`) and periodically bump it intentionally.

Category: linting
Priority: medium
