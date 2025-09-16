# Docs Task: Add Enrich Offline vs Online Examples (Issue #567)

## Plan

- Create `docs/examples/enrich.offline.json` and `docs/examples/enrich.online.json`.
- Keep JSON minimal; redact payloads; ensure they resemble CLI outputs.
- Update README and specs §4.1 with links and short context.
- Add CI quick check to parse examples and validate against NE schema (offline variant valid without `enriched.github`).

## Notes

- Offline mode (no `--use-github`): output should not include GitHub lookups; prior docs indicate either absent `enriched.github` (some places) or a stub with `{ partial: true, reason: 'github_enrich_disabled' }`. Current README states offline includes `enriched.github.partial=true`. For compatibility, examples will show both minimal core fields and an optional offline stub note.
- Online mode: include `enriched.github.provider` and a minimal `pr` excerpt.
