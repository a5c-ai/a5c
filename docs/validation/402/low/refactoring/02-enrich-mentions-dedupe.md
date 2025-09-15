## [Validator] Refactoring — Dedupe mentions in src/enrich.ts

Observation:

- `src/commands/enrich.ts` dedupes mentions by `(source, normalized_target, file, line)` before emitting.
- `src/enrich.ts` accumulates mentions across multiple scanners but emits without a dedupe pass: `...(mentions.length ? { mentions } : {})`.

Risk:

- When both patch-based and content-based scanners run, identical `code_comment` mentions can appear twice.

Severity: low (non-blocking).

Suggestions:

1. Reuse the same dedupe helper in `src/enrich.ts` (or extract to a shared util) before attaching `enriched.mentions`.
2. Add a unit test asserting no duplicates when both scanners detect the same reference.

References: src/commands/enrich.ts (dedupeMentionsWithLocation)
