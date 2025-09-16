# [Low] Refactoring — Remove or use dead helper `normalizeCodeCommentLocation`

### Context

- File: `src/enrich.ts`
- Function: `normalizeCodeCommentLocation(m: Mention): Mention`
- Lint: Reported as defined but never used.

### Why it matters

- Dead code adds maintenance overhead and causes lint warnings.
- The helper duplicates logic that can be handled where needed or should be integrated into the code-comment scanning path if truly required.

### Suggested action

- Either remove the unused helper, or
- Integrate it where mentions with `source: "code_comment"` may carry string `location` to normalize into `{ file, line }`.

### Scope & Risk

- Low risk; helper is not exported and has no references.
- Run `npm run lint && npm test` after change.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
