# Observability Collector (Composite Action)

Collects workflow/job metadata and optional coverage metrics, writes a step summary, emits an `observability.json`, and uploads it as an artifact.

> Node requirement: This composite executes Node.js inline scripts (`node -e`). Node is ensured inside the composite via `actions/setup-node@v4` (default: Node 20, with npm cache). You may override via `with.node-version`, or pre‑setup Node earlier in your job if you prefer (optional snippet below). (docs(actions): document Node setup prerequisite for composite actions (Node 20)\n\n- obs-summary: add setup-node@v4 snippet\n- obs-collector: add setup-node@v4 snippet\n- README: note prerequisite under CI Observability\n\nRefs: #455)

## Usage

Standard usage (composite sets up Node internally):

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

Optional: pre‑setup Node earlier in the job (if you want to control the Node toolchain yourself):

```yaml
- name: Setup Node.js (optional)
  uses: actions/setup-node@v4
  with:
    node-version: 20

- name: Observability collector
  if: always()
  uses: ./.github/actions/obs-collector
  with:
    node-version: 20 # keep in sync if overriding
```

Notes:

- Node is ensured inside the composite using `actions/setup-node@v4` (default: 20, with npm cache). Override via `with.node-version` if needed, or manage Node yourself as shown above. (docs(actions): document Node setup prerequisite for composite actions (Node 20)\n\n- obs-summary: add setup-node@v4 snippet\n- obs-collector: add setup-node@v4 snippet\n- README: note prerequisite under CI Observability\n\nRefs: #455)
