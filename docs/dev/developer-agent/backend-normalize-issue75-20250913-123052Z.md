# Backend – Align normalize() with NE schema (issue #75)

## Plan
- Extend NormalizedEvent types to NE MVP
- Implement src/normalize.ts mapping for 4 event kinds
- Preserve labels and provenance.source; add repo/actor/ref
- Add tests per type and JSON Schema validation via Ajv
- Keep enrich untouched; no network calls

## Notes
- Heuristic type detection by presence of keys
- Minimal fields only to satisfy schema
