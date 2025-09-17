# [Validator] [Documentation] - Hygiene: legacy mentions of `ref.type: "pr"`

Some historical dev/validation notes still reference `ref.type: "pr"`. Current spec, schema, implementation, and tests are aligned on `ref.type: "branch"` for pull_request with `ref.base`/`ref.head` populated.

Non-blocking suggestion:

- When updating nearby docs, annotate those legacy mentions as historical context or adjust phrasing to avoid implying expected output is `"pr"`.

Rationale:

- Avoids confusion for new contributors reading old dev logs.

Scope:

- `docs/dev/**` and `docs/validation/**` notes only; no functional files.

Priority: low
