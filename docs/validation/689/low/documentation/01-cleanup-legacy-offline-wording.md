# [Validator] [Documentation] Cleanup legacy offline GitHub wording

Priority: low

Scope: PR #689 — Finalize offline GitHub enrichment contract docs

Context:

- This PR aligns the CLI contract for offline enrichment to always emit:
  `enriched.github = { provider: 'github', partial: true, reason: 'flag:not_set' }`.
- Some older validation notes still mention variants like "absent/empty" or terms like
  `github_enrich_disabled`/`skipped`.

Examples to review (non-exhaustive):

- `docs/validation/97/high/functionality/01-gate-github-enrichment-by-flag.md`

Recommendation:

- Add a one‑line disclaimer at the top of affected legacy notes to reflect the finalized
  contract, or update the wording to the new standard. This prevents confusion when reading
  historical docs.

Notes:

- No runtime changes required; tests already enforce the finalized behavior.
