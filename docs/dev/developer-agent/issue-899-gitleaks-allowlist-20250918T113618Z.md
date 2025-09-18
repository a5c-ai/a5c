# Issue 899: Tighten Gitleaks Allowlist (Base64)

## Context

Validator flagged an over-permissive Base64 allowlist pattern in `gitleaks.toml` that could hide real leaks repo‑wide. We must remove it or strictly reduce scope to docs/examples/tests only.

## Plan

1. Inspect current `gitleaks.toml` and workflow triggers
2. Remove global Base64 allowlist regex
3. Keep path allowlist for docs/tests/examples as-is
4. Verify build/tests locally (sanity)
5. Open PR against `a5c/main` with explanation and link to issue

## Notes

- `.github/workflows/gitleaks.yml` already runs on `a5c/main` and `main`, with SARIF upload. No workflow change anticipated.
- Path allowlists (docs/specs, docs/examples, tests/, test/, samples/, example/) remain to reduce noise.

## Results

- Removed global Base64 allowlist regex from `gitleaks.toml`.
- Left path allowlists for docs/examples/tests intact.
- Opened PR: https://github.com/a5c-ai/events/pull/905
