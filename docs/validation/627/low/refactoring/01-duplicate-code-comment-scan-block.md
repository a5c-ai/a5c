## [Validator] Refactoring — Duplicate code comment scan block in enrich.ts

Category: refactoring
Priority: low

### Summary

`src/enrich.ts` contains a duplicated "Code comment mention scanning in changed files" block. The logic appears twice back-to-back, handling the same `scanChangedFilesFlag` flow (patch scanning vs GitHub fetch fallback). This is non‑blocking but increases maintenance cost and risk of divergence.

### Evidence

File: src/enrich.ts

- First block starts near the initial mentions extraction section and handles:
  - `includePatch && hasUsablePatch` → synthesize content from patches
  - `else if (useGithub)` → fetch file contents via Octokit with size guard `maxFileBytesFlag`
- Immediately following, a second, nearly identical block repeats the same logic and branches.

### Recommendation

- Deduplicate into a single function (e.g., `scanMentionsFromChangedFiles(...)`) called once.
- Keep the same behavior: respect `mentions.scan.changed_files`, `mentions.max_file_bytes`, `mentions.languages`, and `include_patch`.
- Add unit coverage around the refactored function for both patch and API-fetched paths.

### Rationale

- Reduces code size and risk of bugs.
- Improves readability and future maintainability.

This is non‑blocking and can be addressed in a follow‑up PR.
