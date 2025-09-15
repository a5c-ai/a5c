# Dev Log – Align README payload type with NE schema (issue #456)

- Start: $(date -u +%Y-%m-%dT%H:%M:%SZ)
- Branch: docs/readme-ne-payload-456

## Context
Align README wording for `payload` with NE schema: it is `object | array` (raw provider payload), not primitives. Optionally note `composed.payload` allows `object | array | null`.

Refs:
- Issue: #456
- Schema: docs/specs/ne.schema.json
- Notes: docs/validation/311/low/documentation/01-align-readme-payload-type.md

## Plan
- Update README.md – clarify `payload` type and size note.
- Add optional note for `composed.payload` type.
- Keep examples from printing full payloads; guide to use jq selections.

## Changes
- [x] README.md: payload type text updated to `object | array` and note on size/printing
- [x] README.md: add note that `composed[].payload` is `object | array | null`

## Results
- README updated. Next: open PR linked to issue #456.
