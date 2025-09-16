# Refactor: Deduplicate code-comment mentions scanning block in `src/enrich.ts`

Priority: medium
Category: refactoring

Observation:

- `src/enrich.ts` contains two very similar blocks that implement code-comment mentions scanning in changed files (patch-based and fallback to GitHub content). This duplication increases maintenance risk.

Recommendation:

- Extract scanning logic into a helper function (e.g., `scanChangedFilesForMentions(...)`) and invoke it once with appropriate parameters. Ensure shared limits (`mentions.max_file_bytes`, `mentions.languages`) are applied consistently.

Rationale:

- Reduces code drift, eases future changes (e.g., new language filters), and improves readability.
