# Clarify `validate` default schema in README

Priority: low

Category: documentation

Context:
- `events validate` defaults `--schema` to `docs/specs/ne.schema.json`.
- README mentions both piped usage via `npx @a5c-ai/events validate --quiet` and later direct `events validate --schema docs/specs/ne.schema.json`.

Suggestion:
- Add a short note near the Validate section stating the default path to avoid redundancy/confusion:

> If `--schema` is omitted, the CLI uses `docs/specs/ne.schema.json` by default.

Rationale:
- Makes defaults explicit; aligns with UX expectations and Ajv invocation in `src/cli.ts`.

