# Suggestion: Add runtime guard for Node presence

Priority: low
Category: monitoring

Context:
The composite actions (`.github/actions/obs-summary`, `.github/actions/obs-collector`) rely on `node -e` inline scripts. The documentation now clearly states the prerequisite to run `actions/setup-node@v4` (Node 20) in the workflow.

Suggestion:
Add a lightweight runtime guard step early in each composite to fail fast with a clear message if `node` is not present, e.g.:

```yaml
- name: Validate Node availability
  shell: bash
  run: |
    if ! command -v node >/dev/null 2>&1; then
      echo "Node.js is required for this composite. Add actions/setup-node@v4 (node-version: 20) before invoking it." >&2
      exit 1
    fi
```

Rationale:

- Improves UX with actionable error messages.
- Keeps composites robust while still letting callers decide Node version and setup.

Note: Non-blocking. Documentation is sufficient for now.
