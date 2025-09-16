# [Low] README: Duplicate "Offline by default" notes in Mentions section

Category: documentation
Priority: low

Context: PR #622 (branch: chore/readme-dedupe-mentions-flags-574)

Observation:

- In README.md Mentions flags area, the "Offline by default / --use-github" note appears twice:
  - Around lines ~134 and again around ~156, with overlapping messaging.

Why this matters:

- Repetition can confuse readers and increases maintenance overhead during future edits.

Suggestion:

- Keep a single, concise "Offline by default" bullet once within the Mentions flags section.
- Cross‑link to `docs/cli/reference.md#events-enrich` for canonical behavior details.

Scope:

- Non‑blocking; may be addressed in a future docs tidy‑up PR.
