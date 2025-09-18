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

- Install vs npx: you can swap the install step for `npx -y @a5c-ai/events <cmd>` in each step if preferred.
- Token precedence: runtime prefers `A5C_AGENT_GITHUB_TOKEN` over `GITHUB_TOKEN` when both are available.
- Auto‑enrichment: `A5C_EVENTS_AUTO_USE_GITHUB=true` enables `--use-github` implicitly when a token is present. Without it (and without `--use-github`), enrichment runs offline and includes a stub at `enriched.github`.
- Default reactor path: `.a5c/events/reactor.yaml`. Use `--file` to point elsewhere. For remote YAML, see `--branch` and `--metadata-match` flags in the CLI reference.

## Exit codes and gating

- Normalize `--filter`: when the filter does not match, the command exits with code `2` and emits no output. Use this to skip the rest of the pipeline for non‑target events (guard the subsequent steps with `if: success()` or `if: always()` and check files).
- Enrich `--use-github` without a token exits with code `3` and prints an error (no JSON). Prefer using `A5C_EVENTS_AUTO_USE_GITHUB=true` so offline mode is used when no token is present.
- Emit `--sink github` fails with code `1` on dispatch errors (missing env or permission). Ensure the job has `contents: read` and a token with repo permissions.
- Canonical exit codes are listed in `docs/cli/reference.md#exit-codes`.

## Variants

- Selective fields: to keep artifacts small, prefer `--select 'type,repo.full_name,labels'` on `normalize`/`enrich` and pipe to files.
- Mentions scanning: configure via `--flag mentions.*` (canonical list: `docs/cli/reference.md#mentions-scanning`).
- File sink: replace the final step with `events emit --in composed.json --sink file --out artifact.json` to produce an artifact instead of a dispatch.

## Troubleshooting

- "GITHUB_EVENT_PATH is not set": pass `--in "$GITHUB_EVENT_PATH"` and `--source actions` in the normalize step (as in the example).
- Missing token with `--use-github`: provide `A5C_AGENT_GITHUB_TOKEN` (preferred) or `GITHUB_TOKEN`, or remove `--use-github`/unset the auto env to run offline.
- Permissions for repository_dispatch: ensure job `permissions` allow dispatch; use the default `GITHUB_TOKEN` or set a repo/org secret for a PAT if cross‑repo dispatching is needed.

See also:

- CLI reference: `docs/cli/reference.md`
- Specs configuration: `docs/specs/README.md#5-configuration`
