# [Validator] [Security] - Permissions scope tuning (non-blocking)

### Context

PR: https://github.com/a5c-ai/events/pull/890

Current permissions in `.github/workflows/codeql.yml` are already reasonably minimal:

```yaml
permissions:
  contents: read
  actions: read
  security-events: write
```

### Recommendations (optional)

- Consider scoping permissions at the job level instead of workflow level if other jobs are added later with different needs.
- Optionally add `pull-requests: read` if you plan to use PR-specific metadata in future steps.

### Priority

low priority

### Rationale

Maintains principle of least privilege and future-proofs the workflow as it evolves.
