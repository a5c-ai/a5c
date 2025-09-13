# Work Log: NE Normalization & Enrichment Integration

## Scope
- Issue #89: NE schema-compliant normalization for GitHub events
- Issue #90: Enrichment integration with flags

## Plan
1. Implement provider-specific mappers under `src/providers/github/*`.
2. Wire `handleNormalize` to detect type and map NE fields.
3. Integrate `enrichGithubEvent` into `handleEnrich` with flags: `include_patch`, `commit_limit`, `file_limit`.
4. Add unit tests using `tests/fixtures/github/*.json` and validate against `docs/specs/ne.schema.json`.
5. Update CLI docs if UX changes.

## Notes
- Keep `NormalizedEvent` interface minimal but ensure emitted object satisfies schema.
- Default provider: github when sample payload resembles GitHub event.

