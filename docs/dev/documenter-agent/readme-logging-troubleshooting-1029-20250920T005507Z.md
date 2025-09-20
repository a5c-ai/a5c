# Task Log: README — Logging + Troubleshooting (Issue #1029)

## Summary

Add a concise Logging section (cover `--log-level`, `--log-format`) and a Troubleshooting section (token behavior, exit codes 2/3, rate limits), with links to CLI reference.

## Context

- Source files: `README.md`, `docs/cli/reference.md`
- Goal: Improve onboarding by surfacing quick tips in README and linking to details.

## Plan

1. Add/update Logging section with flags and defaults, plus CI tip
2. Consolidate Troubleshooting into a single section; include tokens + exit codes 2/3 + rate limits
3. Cross-link to `docs/cli/reference.md#global-flags` and `#events-enrich`
4. Ensure no duplication and consistent terminology

## Notes

- Keep language concise; avoid duplicating full reference content.
- Ensure `A5C_AGENT_GITHUB_TOKEN` precedence over `GITHUB_TOKEN` is stated consistently with reference.

## Results

- Added/kept concise **Logging** section with `--log-level` and `--log-format`, cross-linking to `docs/cli/reference.md#global-flags`.
- Consolidated **Troubleshooting** into a single section; merged token precedence, exit codes, CI convenience, and rate-limit notes; removed duplication.
- Ensured wording matches CLI reference (defaults, exit codes, token precedence).
