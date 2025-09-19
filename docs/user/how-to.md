---
title: How‑to Guide — Use the Events CLI
description: Practical, copy‑pasteable steps to normalize, enrich, generate agent context, and emit events locally and in GitHub Actions.
---

# How‑to: Normalize → Enrich → Context → Emit

This guide shows the most common end‑to‑end flows for the Events CLI:

- Local development (workstation)
- GitHub Actions (CI) with sensible permissions

It builds on the CLI reference and examples you can find here:

- CLI reference: `docs/cli/reference.md`
- E2E Actions example: `docs/ci/actions-e2e-example.md`
- SDK quickstart (programmatic): `docs/user/sdk-quickstart.md`

## 1) Install

You can either install globally or use `npx`:

```
# Global (faster subsequent runs)
npm -g i @a5c-ai/events

# or on-demand per invocation
npx -y @a5c-ai/events --help
```

## 2) Local workflow (sample payload)

Normalize a GitHub sample payload, enrich offline (default), generate a compact context, and preview:

```
# From repo root
events normalize \
  --in samples/pull_request.synchronize.json \
  --source github \
  --select 'type,repo.full_name,pr.number,labels' \
  --out ne.json

# Optional online enrichment (requires token). Otherwise runs offline with a stub.
export A5C_AGENT_GITHUB_TOKEN="${A5C_AGENT_GITHUB_TOKEN:-$GITHUB_TOKEN}"
events enrich \
  --use-github \
  --in ne.json \
  --out ne.enriched.json || cp ne.json ne.enriched.json

# Generate agent context Markdown from a template
events generate_context \
  --in ne.enriched.json \
  --template docs/cli/reference.md \
  --out context.md

echo "Context written to context.md" && sed -n '1,60p' context.md
```

Tips:

- If you set `A5C_EVENTS_AUTO_USE_GITHUB=true`, enrich will auto‑enable online mode when a token is present.
- Use `--select '<fields>'` to keep artifacts small and readable in CI logs.

## 3) GitHub Actions (CI) workflow

Minimal job that runs the same steps on workflow completion events. Adjust triggers as needed.

```
name: events-howto
on:
  workflow_run:
    workflows: ["CI"]
    types: [completed]
permissions:
  contents: read
  actions: read
jobs:
  flow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }

      # Install or use npx for each command
      - run: npm -g i @a5c-ai/events || true

      - name: Normalize
        run: |
          events normalize \
            --source actions \
            --select 'type,repo.full_name,provenance.workflow.name' \
            --out ne.json

      - name: Enrich (auto, if token available)
        env:
          A5C_AGENT_GITHUB_TOKEN: ${{ secrets.A5C_AGENT_GITHUB_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          A5C_EVENTS_AUTO_USE_GITHUB: "true"
        run: |
          events enrich --use-github --in ne.json --out ne.enriched.json || cp ne.json ne.enriched.json

      - name: Generate agent context
        run: |
          events generate_context \
            --in ne.enriched.json \
            --template docs/cli/reference.md \
            --out context.md
          echo "Preview:" && sed -n '1,60p' context.md

      - name: Emit (repository_dispatch)
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: |
          events emit --in ne.enriched.json --sink github || echo "no events dispatched"
```

Notes:

- Exit codes: see `docs/cli/reference.md#exit-codes` for exact values (e.g., normalize `--filter` miss returns 2; enrich missing token with `--use-github` returns 3).
- Mentions scanning and rules: the `enrich` and `reactor` paths are configurable; see `docs/cli/reference.md` and `.a5c/events/reactor.yaml` for rule wiring.
- For a complete CI example including reactor: `docs/ci/actions-e2e-example.md`.

## 4) Troubleshooting

- Missing `GITHUB_EVENT_PATH` locally: point `--in` to a payload file and set `--source github`.
- Rate limits or insufficient scopes: prefer `A5C_AGENT_GITHUB_TOKEN` over the default `GITHUB_TOKEN` when available.
- Repository dispatch permissions: ensure the job grants `contents: read` (and uses the default `GITHUB_TOKEN`).

## See also

- CLI reference: `docs/cli/reference.md`
- NE schema overview: `docs/cli/ne-schema.md`
- Observability and logging: `docs/observability.md`
- End‑to‑end Actions example: `docs/ci/actions-e2e-example.md`
