# Observability Collector (Composite Action)

Collects workflow/job metadata and optional coverage metrics, writes a step summary, emits an `observability.json`, and uploads it as an artifact.

> Node behavior: This composite executes Node.js inline scripts (`node -e`) and ensures Node inside the composite via `actions/setup-node@v4` (default: Node 20, with npm cache). You may override via `with.node-version`, or optionally pre‑setup Node earlier in your job if you prefer explicit control.

## Usage (internal Node setup by default)

```yaml
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

- Node is ensured inside the composite using `actions/setup-node@v4` (default: 20, with npm cache). Override via `with.node-version` if needed, or manage Node yourself as shown above.

---

See also: `.github/actions/obs-summary` for a variant that aggregates job metrics and uploads an artifact along with a detailed step summary.
