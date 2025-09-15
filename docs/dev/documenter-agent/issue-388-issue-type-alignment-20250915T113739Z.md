# Documenter Log — Issue #388: Align NE type to "issue"

Context: NE schema `docs/specs/ne.schema.json` enumerates `type: "issue"`, while `src/providers/github/map.ts` currently emits `"issues"` for GitHub Issues events. This causes validation breaks.

Plan:

- Add a spec note clarifying naming: GitHub webhook "issues" -> NE `type: "issue"`.
- Update any docs referencing `issues` event type to `issue` for NE context.
- Leave code/tests change to developer-agent; link this doc work to issue #388.
- Provide example normalization output with `type: "issue"` and validation note.

Acceptance (docs scope):

- Specs and validation docs consistently refer to NE `type: "issue"`.
- Migration note present for downstream consumers.
