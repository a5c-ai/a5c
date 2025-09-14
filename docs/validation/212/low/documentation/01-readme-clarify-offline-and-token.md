# [Validator] [Documentation] Clarify offline and token behavior

- Priority: low priority
- Category: documentation

Suggestions:
- Add a small JSON example of `enriched.github` in offline mode (`partial: true`, `reason: "github_enrich_disabled"`).
- Add a small JSON example when `--use-github` is set but token is missing (`reason: "github_token_missing"` and an `errors` array with a clear message).
- Briefly note that mentions extraction runs regardless of `--use-github` and does not require network access.

Rationale:
- Increases user confidence and reduces ambiguity in CLI behavior.
