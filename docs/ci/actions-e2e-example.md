# GitHub Actions — End-to-End Example (normalize → enrich → reactor → emit)

This example shows a cohesive CI job that runs the typical pipeline with the Events CLI.

- Normalizes the current event (`GITHUB_EVENT_PATH`)
- Enriches with GitHub API (`--use-github`)
- Applies reactor rules
- Emits a `repository_dispatch` to the same repo (as an example sink)

```yaml
name: events-e2e
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]

jobs:
  e2e:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install CLI
        run: npm -g i @a5c-ai/events || true  # or use npx in each step

      - name: Normalize
        run: |
          events normalize \
            --source actions \
            --select 'type,repo.full_name,provenance.workflow.name' \
            --out ne.json

      - name: Enrich with GitHub
        env:
          # Prefer the agent-scoped token if available
          A5C_AGENT_GITHUB_TOKEN: ${{ secrets.A5C_AGENT_GITHUB_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # Optional escape hatch to auto-enable when token is present
          A5C_EVENTS_AUTO_USE_GITHUB: "true"
        run: |
          events enrich \
            --use-github \
            --in ne.json \
            --out ne.enriched.json

      - name: Reactor (optional)
        run: |
          events reactor \
            --in ne.enriched.json \
            --file .a5c/events/reactor.yaml \
            --out events.json

      - name: Emit to GitHub (repository_dispatch)
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: |
          events emit --in events.json --sink github || echo "no events to dispatch"
```

Notes:

- The normalize step reads from `GITHUB_EVENT_PATH` when `--source actions` is used.
- `--use-github` requires a token; prefer `A5C_AGENT_GITHUB_TOKEN` when available; otherwise `GITHUB_TOKEN`.
- Exit codes: see `docs/cli/reference.md#exit-codes`.
- For JSON logging toggles, see `docs/observability.md` (flags proposed; env-only level may be available in select paths).
