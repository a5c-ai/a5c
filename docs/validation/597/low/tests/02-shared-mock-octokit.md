# [Low] Tests — Share mock Octokit utility

### Context

`makeMockOctokit` is embedded in `tests/mentions.flags.e2e.test.ts`.

### Suggestion

Move mock construction into a shared test utility (e.g., `tests/utils/mockOctokit.ts`) to enable reuse across tests that require PR files/content behavior.

### Rationale

- Encourages reuse and consistency.
- Simplifies future tests interacting with GitHub PR file lists and content.

### Scope

Create a small helper and import in tests that need it.
