Title: Review npm audit findings (dev deps)

Category: security
Priority: medium priority

Context

- Branch: a5c/docs+fixes/audit-1023-20250919T224210Z (PR #1045)

Findings

- `npm install` reported 9 vulnerabilities (7 moderate, 2 high). Likely in transitive dev dependencies.

Recommendation

- Run `npm audit` and triage. Where safe, bump dev dependencies. Consider `npm audit fix` for non-breaking updates.
- If issues are in deprecated transitive packages (e.g., glob<9), plan upgrades when feasible.

Notes

- Non-blocking for this PR; does not affect runtime production usage of the library.
