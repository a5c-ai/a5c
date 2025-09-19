# Task: On-call runbook and incident labels — Issue #1022

## Summary

Add `docs/oncall.md` covering:

- Severity levels (S1–S4) with examples
- Ownership, escalation path, and response expectations
- Links to monitoring/alerts and how to acknowledge
  Create labels (if missing): `incident`, `sev:S1`, `sev:S2`, `sev:S3`, `sev:S4`, `area:ci`, `area:tests`.
  Optional: add CODEOWNERS mapping for incident-doc ownership.

## Plan

1. Draft `docs/oncall.md` with cross-links to `docs/observability.md` and workflows under `.github/workflows/`
2. Probe/create labels per Acceptance Criteria
3. Add CODEOWNERS specific rule for `docs/oncall.md` (owners: `@a5c-ai/platform @a5c-ai/docs`)
4. Open PR (draft), iterate, finalize, request review

## Context

- Observability doc: `docs/observability.md`
- Workflows: `.github/workflows/*.yml` (tests, quick-checks, codeql, release, a5c)

## Acceptance Criteria Mapping

- [ ] `docs/oncall.md` exists with required sections
- [ ] Labels exist and are documented
- [ ] CODEOWNERS entry added (optional but proposed)
