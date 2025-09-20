# NE alignment for repository_dispatch → custom

Issue: https://github.com/a5c-ai/events/issues/1027
Branch: feat/ne-custom-dispatch-1027

## Plan

- Schema: add `custom` to `docs/specs/ne.schema.json` type enum
- Enrich fallback: map GH `repository_dispatch` to NE `type: custom`
- Docs: update `docs/specs/README.md` (types) and CLI reference note
- Samples/Tests: add a sample `samples/repository_dispatch.json` and a unit test asserting `type: custom`, validate via schema

## Notes

- Keep change scoped to dispatch flow; avoid unrelated type adjustments
- Preserve original payload under `payload` (includes `action` and `client_payload`)
