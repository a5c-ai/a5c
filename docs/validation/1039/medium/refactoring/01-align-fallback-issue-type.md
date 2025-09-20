Title: Align fallback NE type for issues (singular)

Category: refactoring
Priority: medium

Summary

- In `src/enrich.ts` raw→NE fallback mapping uses `type: "issues"` when `baseEvent?.issue` is present. The NE schema and docs specify the singular form `"issue"`.

Why it matters

- Consistency with `docs/specs/ne.schema.json` (`type` enum includes `"issue"`, not `"issues"`).
- Downstream tools and validation expect singular naming. Other paths already emit `"issue"` (e.g., `src/providers/github/map.ts`).

Suggested fix

- In `src/enrich.ts`, change the fallback branch:

  ```ts
  : baseEvent?.issue
    ? "issue"
  ```

- Add/adjust a unit test to assert fallback emits `"issue"` when given a minimal `issues` webhook-like payload.

References

- Schema: `docs/specs/ne.schema.json`
- Spec note: `docs/specs/notes/issue-type-alignment.md`
- Current mapping (needs tweak): `src/enrich.ts`
- Canonical mapping already correct: `src/providers/github/map.ts` (returns `"issue"`)
