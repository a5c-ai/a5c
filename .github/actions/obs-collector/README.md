# Observability Collector (Composite Action)

Collects workflow/job metadata and optional coverage metrics, writes a step summary, emits an `observability.json`, and uploads it as an artifact.

> Prerequisite: This composite runs Node inline scripts (`node -e`). Make sure Node is available in the job. We recommend `actions/setup-node@v4` with Node 20 before invoking this action.

## Usage

```yaml
# Ensure Node is available (recommended for this composite)
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: 20

- name: Observability collector
  if: always()
  uses: ./.github/actions/obs-collector
  with:
    node-version: 20 # optional, default 20
  env:
    OBS_FILE: observability.json
    CONCLUSION: ${{ job.status }}
```

Notes:

- You can override the Node version used inside the composite via `with.node-version`.
