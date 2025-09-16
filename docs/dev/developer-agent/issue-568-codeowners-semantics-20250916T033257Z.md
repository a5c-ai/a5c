# Issue 568 – CODEOWNERS semantics docs

Plan:

- Add concise note in README under Ownership & Routing linking to routing doc.
- Expand docs/routing/ownership-and-routing.md with Semantics (union vs last-rule) and examples.
- Add note to docs/specs/README.md §4.1 about union semantics and potential future toggle.

Notes:

- Implementation computes `owners_union` as sorted, de-duplicated union across changed files.
- GitHub review semantics use last matching rule per file.
