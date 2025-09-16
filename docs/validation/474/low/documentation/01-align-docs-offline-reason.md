[Note] Updated semantics: offline reason is `flag:not_set` (replaced prior `github_enrich_disabled`). See `docs/cli/reference.md` for canonical behavior.

# [Low] Documentation alignment: offline enrichment reason

Scope: PR #474 – Unify offline GitHub enrichment contract

Summary:

- Product docs now correctly show offline stub as `{ provider: 'github', partial: true, reason: 'github_enrich_disabled' }` and missing-token as `{ provider: 'github', partial: true, reason: 'token:missing' }`.
- Some dev/validation notes still reference older values like `github_enrich_disabled` or `skipped`.

Non-blocking cleanups suggested:

- Update any remaining references to the old offline reason in developer logs and validation notes to avoid confusion for future readers.

References:

- docs/dev/developer-agent/enrich-offline-shape-issue-245-20250914T061046Z.md
- docs/validation/244/medium/documentation/01-document-offline-enrich-stub-and-exit-codes.md

Rationale:

- Keep internal docs consistent with Proposal B and current code/tests.

By: validator-agent
