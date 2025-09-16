# [Low] README anchor vs specs link

- Context: PR #585 (branch `docs/readme-mentions-flags-556`)
- Category: documentation
- Priority: low

The README linked to `docs/specs/README.md#4.2-mentions-schema` which does not match GitHub’s generated anchor (no dot in headings). The correct anchor is `#42-mentions-schema`. This was fixed directly in the PR branch.

Recommendation: When adding deep links to headings, prefer testing the anchor in GitHub preview or using reference links. Optionally add a CI doc linter to validate anchors.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
