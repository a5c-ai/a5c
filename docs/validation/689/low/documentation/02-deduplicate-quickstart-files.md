# [Validator] [Documentation] Deduplicate quick start files

Priority: low

Scope: PR #689 — Quick start documentation

Context:

- Repository previously contained both `docs/user/quickstart.md` and `docs/user/quick-start.md` with overlapping
  content and slightly different guidance/examples.

Recommendation:

- Choose a single canonical quick start (prefer hyphenated `quick-start.md` for URL readability),
  and add a front-matter redirect or a short pointer from the other file to avoid drift. Ensure
  both reflect the finalized offline enrichment contract and `include_patch` default.

Notes:

- Non-blocking. Can be handled in a follow-up docs tidy-up PR.
