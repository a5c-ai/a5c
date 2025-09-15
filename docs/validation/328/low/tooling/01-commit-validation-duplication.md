# [Low] Tooling - Duplicate commit validation workflows

Two PR commit validation workflows exist:
- `.github/workflows/commitlint.yml` (uses `commitlint` with repo config)
- `.github/workflows/commit-hygiene.yml` (uses `scripts/commit-verify.ts`)

These partially overlap. Consider consolidating to one to reduce maintenance. If both are kept, clarify intended differences (e.g., commitlint for stricter style vs script for leniency and emoji stripping in PR titles) in docs and workflow descriptions.

Context: PR #328
