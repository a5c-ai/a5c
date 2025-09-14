# Types: owners_union field shape

Category: documentation/types
Priority: low

Observation:
- `src/enrichGithubEvent.js` adds `owners_union: string[]` under `_enrichment.pr` and this is surfaced by `handleEnrich` under `enriched.github.pr.owners_union`.
- The `.d.ts` files (`src/enrichGithubEvent.d.ts`, `src/providers/github/enrich.d.ts`) currently type the function as returning `any`, and there is no explicit type describing `owners_union` in the enriched shape.

Why it matters:
- Providing a typed contract for `owners_union` improves DX for TypeScript consumers and prevents regressions.

Suggestion:
- Extend the public types to include `owners_union?: string[]` under the PR enrichment shape exposed via `handleEnrich` and provider d.ts files. Consider documenting the sort order (lexicographic) in a JSDoc block.

References:
- Implementation: `src/enrichGithubEvent.js`
- Surface: `src/enrich.ts`
- Docs: `docs/cli/reference.md` and `docs/specs/README.md` (§4.1 owners union)
