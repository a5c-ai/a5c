## [Validator] Documentation — Clarify `mentions.languages` input format

Issue: https://github.com/a5c-ai/events/issues/631

### Summary

Clarifies that `mentions.languages` accepts canonical language codes used by the code‑comment scanner rather than raw file extensions. Adds mapping note and updates examples to avoid confusion when passing `tsx,jsx`.

### Rationale

Implementation (`src/utils/commentScanner.ts`) maps extensions to canonical codes via `EXT_TO_LANG` (e.g., `.tsx → ts`, `.jsx → js`, `.yml → yaml`) and compares the provided allowlist directly against those codes. Passing extensions can work indirectly via detection, but the filter list itself is matched on codes.

### Changes

- README: Mentions config quick example updated; enrich flags description now refers to canonical codes and includes a mapping note.
- docs/cli/reference.md: examples now use canonical codes; add mapping note near `mentions.languages`.

### Notes

This is documentation‑only. A future enhancement may accept extensions in the allowlist and normalize them to codes pre‑comparison.
