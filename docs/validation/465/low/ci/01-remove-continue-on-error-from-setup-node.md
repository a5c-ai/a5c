# [Low][CI] Remove `continue-on-error` from setup-node steps

### Context

While validating PR #465 (Align Node versions + .nvmrc), CI workflows are now consistently on Node 20 via `.nvmrc` or explicit `node-version: 20`. However, a few jobs still set `continue-on-error: true` on the `actions/setup-node@v4` step (e.g., `.github/workflows/main.yml` build/test jobs).

### Why this matters

- `continue-on-error` can mask real environment failures (rate limits, download failures, invalid `.nvmrc`, etc.), leading to green pipelines with broken Node setups.
- Now that Node versioning is unified and stable on 20, setup should be strict and fail fast if it cannot install the requested runtime.

### Suggested change (non‑blocking)

- Remove `continue-on-error: true` from the `Setup Node.js` steps where present (notably in `.github/workflows/main.yml` and any similar patterns).
- Keep `check-latest: true` if you want the latest 20.x patch; otherwise consider removing it for fully reproducible builds.

### Acceptance

- Pipelines fail if runtime provisioning fails, avoiding silent flakiness.
