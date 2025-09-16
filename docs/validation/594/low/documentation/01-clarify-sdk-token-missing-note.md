# [Low] Documentation - Clarify SDK `token:missing` example

When using the programmatic SDK with `use_github` semantics but without a token, some code paths can return a partial `enriched.github` with `reason: "token:missing"` (useful when injecting a mocked Octokit). Consider adding a tiny JSON excerpt in docs/cli/reference.md (SDK section) to avoid ambiguity.

Rationale: The README and CLI docs now clearly state CLI exits code 3 without emitting JSON. A short SDK example would help advanced users.
