## [Validator] [Documentation] - Align `ref.type` PR semantics in specs

PR: #620

- Category: documentation
- Priority: low priority

### Summary

The NE schema enumerates `ref.type` as `branch | tag | pr | unknown`. Current implementation and tests use `ref.type: "branch"` for pull_request events and populate `ref.base`/`ref.head` with branch names. This PR updates specs/README to reflect that behavior. Remaining scattered references to `ref.type: "pr"` exist in historical dev/validation notes and do not affect behavior.

### Suggested follow-up (non-blocking)

- As part of ongoing docs hygiene, scrub legacy mentions of `ref.type: "pr"` in docs under `docs/dev/` and `docs/validation/` where they imply expected output, or annotate them as historical context.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
