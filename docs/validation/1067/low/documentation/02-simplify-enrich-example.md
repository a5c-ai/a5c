Title: Enrich example — simplify and note jq behavior

Category: documentation
Priority: low

Context

- The code‑comment scanning example uses `--out /dev/stdout` and a jq filter.

Suggestion

- Remove `--out /dev/stdout` (stdout is the default).
- Add a brief note that the jq filter may return an empty array depending on sample content.

Rationale

- Keeps the example minimal and sets expectations for users evaluating output.
