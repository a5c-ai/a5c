## [Validator] Documentation — Mentions languages filter consistency

Context: PR #402 updates CLI docs for mentions scanning flags. Implementation spans multiple scanning paths:

- `scanMentionsInCodeComments` (src/utils/commentScanner.ts) detects language from file extension and expects `languageFilters` as language codes: `js, ts, py, go, java, c, cpp, sh, yaml`.
- Patch-only scanning via `scanPatchForCodeCommentMentions` in `src/enrich.ts` filters by filename extensions when `mentions.languages` is provided.

Impact:

- Passing `--flag mentions.languages=tsx,jsx` will be honored by the patch-only path (extension filter) but ignored by the rich content path, because `.tsx`/`.jsx` map to language codes `ts`/`js` and the comparison uses exact code matching.

Severity: medium (non-blocking). Users may get fewer `code_comment` mentions than expected when filtering by `tsx`/`jsx` while `--use-github` is enabled or the rich scanner is active.

Recommendations:

1. Normalize `mentions.languages` input to both:
   - a set of normalized extensions; and
   - a mapped set of language codes
     and apply accordingly per scanner, so `tsx` implies `ts`, `jsx` implies `js`.
2. Document accepted values precisely (extensions and/or language codes) and guarantee equivalence.
3. Add e2e tests covering mixed inputs: `ts,tsx`, `js,jsx` with and without `--use-github` and with `include_patch=true`.

References:

- src/enrich.ts (languageFiltersFlag used in multiple scanners)
- src/utils/commentScanner.ts (EXT_TO_LANG, detectLang, languageFilters semantics)
- src/codeComments.ts (patch scanner)
