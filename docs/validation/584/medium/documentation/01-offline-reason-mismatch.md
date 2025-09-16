## [Validator] Documentation — Offline reason mismatch (enrich)

Observed mismatch between docs and implementation for offline GitHub enrichment reason field:

- docs/cli/reference.md states offline mode uses: `reason: 'github_enrich_disabled'`.
- src/enrich.ts sets: `reason: 'github_enrich_disabled'` when `--use-github` is not provided.

Impact: Minor documentation accuracy issue; behavior is correct, but the reason string differs.

Suggested fix options (choose one):

1. Align code to docs: change reason to `github_enrich_disabled` in `src/enrich.ts` for offline mode (no `--use-github`).
2. Align docs to code: update docs to reflect `github_enrich_disabled` and explain the states: `github_enrich_disabled` (offline), `token:missing` (requested but no token).

Priority: medium (documentation correctness)

Files:

- docs/cli/reference.md
- src/enrich.ts
