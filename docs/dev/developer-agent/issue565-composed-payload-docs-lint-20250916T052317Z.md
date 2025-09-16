# Task Start: Validate composed[].payload types vs README

- Issue: https://github.com/a5c-ai/events/issues/565
- Branch: chore/docs-lint-composed-payload-type-565

## Plan

- Fix docs/specs/README.md: set composed payload type to `object | array | null`.
- Add docs CI lint to scan for outdated `composed[].payload: any` claims.
- Update README and cross-references if needed.
- Open PR; ready for review after CI passes.

## Notes

Repo scan found:

- docs/specs/README.md: `payload?: any` in composed envelope.
- Schema (`docs/specs/ne.schema.json`) already allows `object | array | null`.
