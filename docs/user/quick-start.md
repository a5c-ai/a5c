---
title: Quick Start
description: Run the Events SDK/CLI locally and in CI to normalize and enrich GitHub events.
---

# Quick Start

Use the Events SDK/CLI to turn raw GitHub payloads into a Normalized Event (NE) and add useful enrichment for downstream automations.

## Prerequisites
- Node.js 18+ and npm
- GitHub token (for enrichment that queries repo metadata): set `GITHUB_TOKEN`
- Repo cloned with this project or install the package once published

## Install (local dev)

```bash
# from repo root (local development)
npm install || true
# when build scripts exist, you can run:
# npm run build
```

When published as a package:

```bash
npm install -g @a5c-ai/events
```

## Normalize a webhook payload

```bash
events normalize --in samples/workflow_run.completed.json --out out.json

jq '.type, .repo.full_name, .provenance.workflow?.name' out.json

# Filter and select
events normalize --in samples/workflow_run.completed.json \
  --filter 'type=workflow_run' \
  --select 'type,repo.full_name'
```

Expected output (example):

```json
"workflow_run"
"a5c-ai/events"
"Build"
```

## Enrich a pull request payload

```bash
export GITHUB_TOKEN=ghp_xxx # or use Actions token in CI

events enrich --in samples/pull_request.synchronize.json --out out.json --use-github

jq '.enriched.github.pr.has_conflicts, .enriched.github.pr.mergeable_state' out.json
```

## Use in GitHub Actions

```yaml
name: Normalize Event
on:
  workflow_run:
    types: [completed]
jobs:
  normalize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g @a5c-ai/events
      - name: Normalize
        run: |
          events normalize --source actions > event.json
          jq '.type, .repo.full_name, .provenance.workflow?.name' event.json
```

## Next steps
- Read the NE schema overview at `docs/cli/ne-schema.md`
- See CLI reference in `docs/cli/reference.md`
- Explore specs in `docs/specs/README.md`
