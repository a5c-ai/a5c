# Spec Note: NE type name for GitHub Issues

Normalized Event (NE) schema defines the Issues event type as `"issue"` (singular).

- Source event name (GitHub webhook): `issues`
- NE `type` value: `issue`

Rationale:

- Keep NE `type` names consistent and singular across providers.
- Align with `docs/specs/ne.schema.json` enum.

Expected normalization (excerpt):

```json
{
  "provider": "github",
  "type": "issue",
  "occurred_at": "2025-09-15T00:00:00Z",
  "repo": { "id": 1, "name": "events", "full_name": "a5c-ai/events" },
  "actor": { "id": 2, "login": "octocat", "type": "User" },
  "payload": {
    /* raw GitHub payload */
  },
  "provenance": { "source": "cli" }
}
```

Validation:

- `events validate` checks outputs against `docs/specs/ne.schema.json` where `type` must be one of: `workflow_run`, `pull_request`, `push`, `issue_comment`, `commit`, `job`, `step`, `issue`, `release`, `deployment`, `check_run`, `alert`.

Migration note:

- If any adapter emits `"issues"`, update it to `"issue"` to pass validation and keep downstream tools consistent.

Related:

- Issue: https://github.com/a5c-ai/events/issues/388
- Schema: `docs/specs/ne.schema.json`
