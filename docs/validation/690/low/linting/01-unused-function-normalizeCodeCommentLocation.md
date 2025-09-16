# [Validator] [Linting] - Unused helper in enrich module

### Summary

- `src/enrich.ts` defines `normalizeCodeCommentLocation` but does not use it.
- ESLint reports: `'normalizeCodeCommentLocation' is defined but never used`.

### Why it matters

- Unused code increases maintenance surface and may confuse future contributors.

### Suggested Fix

- Remove the unused function, or wire it where intended (if normalization of `code_comment` mention locations was planned).
- If kept for future work, add a TODO reference with context and disable the rule locally with justification.

### References

- File: `src/enrich.ts`
- PR: #690 (feat/otel-cli-spans)
