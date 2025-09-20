Title: Mentions docs — clarify stdin behavior and local install

Category: documentation
Priority: low

Context

- PR #1067 updates the Mentions section with correct command separation between `events enrich` and `events mentions`.

Suggestion

- Add a short note before the plain‑text examples that:
  - The `events` CLI must be available on `$PATH` (installed via `npm i -g @a5c-ai/events` or run locally with `npx @a5c-ai/events`).
  - When `--file` is omitted, `events mentions` reads from stdin; an empty stdin yields no output.

Rationale

- Reduces confusion for readers who copy/paste the examples in a shell without having the CLI installed or without piping input.
