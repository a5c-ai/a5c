---
title: End-to-end Actions recipe
description: Minimal GitHub Actions job wiring normalize → enrich (with --use-github) → reactor → emit (github dispatch)
---

# End-to-end GitHub Actions recipe

This example shows a single, copy‑pasteable job that runs the full pipeline:

normalize → enrich (`--use-github`) → reactor (`--file`) → emit (`--sink github`).

It demonstrates how to use `GITHUB_EVENT_PATH`, pass tokens via env, and gate by `--select/--filter` to keep runs focused.

## Minimal job

```yaml
name: events-e2e

on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
  # or: push / pull_request / issues / repository_dispatch, etc.

jobs:
  events:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      actions: read
      # required for repository_dispatch used by `emit --sink github`
      repository-projects: read
      pull-requests: read
      issues: read
      id-token: write
      # repo scope for repository_dispatch; for GITHUB_TOKEN this is usually implied
    env:
      # Token precedence: A5C_AGENT_GITHUB_TOKEN is preferred over GITHUB_TOKEN when both are set
      GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      A5C_AGENT_GITHUB_TOKEN: ${{ secrets.A5C_AGENT_GITHUB_TOKEN || '' }}
      # Optional: automatically enable enrichment in CI when a token is present
      A5C_EVENTS_AUTO_USE_GITHUB: "true"
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install CLI
        run: |
          npm -g i @a5c-ai/events

      - name: Normalize current GitHub event to NE
        run: |
          # Read the current event payload from GITHUB_EVENT_PATH
          events normalize \
            --source actions \
            --in "$GITHUB_EVENT_PATH" \
            --select 'type,repo.full_name,provenance.workflow.name' \
            --filter 'repo.full_name=${{ github.repository }}' \
            --out ne.json

      - name: Enrich (uses GitHub API when token present)
        run: |
          # With A5C_EVENTS_AUTO_USE_GITHUB=true and a token available, enrichment is enabled.
          # You can explicitly request API calls instead: add --use-github.
          events enrich \
            --in ne.json \
            --select 'type,enriched.github.provider,labels' \
            --out ne.enriched.json

      - name: Reactor (apply rules to produce custom events)
        run: |
          # Place rules at .a5c/events/reactor.yaml in your repo, or pass --file <path>.
          events reactor \
            --in ne.enriched.json \
            --file .a5c/events/reactor.yaml \
            --out composed.json

      - name: Emit to GitHub (repository_dispatch)
        env:
          # Ensure target repo for dispatch is set; defaults to current repo when omitted.
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: |
          # This will dispatch each event under { events: [...] } to repository_dispatch
          events emit --in composed.json --sink github

      - name: Upload artifacts (optional)
        uses: actions/upload-artifact@v4
        with:
          name: events-e2e
          path: |
            ne.json
            ne.enriched.json
            composed.json
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
