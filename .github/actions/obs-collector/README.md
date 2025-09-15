Observability Collector (composite action)

Collects workflow/job metadata and optional coverage metrics, writes a step summary, emits an `observability.json`, and uploads it as an artifact.

> Prerequisite: This composite runs Node inline scripts (`node -e`). Make sure Node is available. We recommend `actions/setup-node@v4` with Node 20 before invoking this action.

Usage:

```yaml
# Ensure Node is available (required for this composite)
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20

- name: Observability collector
  if: always()
  uses: ./.github/actions/obs-collector
  env:
    OBS_FILE: observability.json
    CONCLUSION: ${{ job.status }}
```
