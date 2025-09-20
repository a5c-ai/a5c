---
title: Quick Start
description: Install and run the Events SDK/CLI to extract mentions, normalize events, and enrich with metadata — locally and in CI.
---

# Quick Start

Use the Events SDK/CLI to extract mentions from text, turn raw provider payloads (e.g., GitHub) into a Normalized Event (NE), and add useful enrichment for downstream automations.

## Prerequisites

- Node.js 20+ and npm
- Optional for GitHub lookups: set `A5C_AGENT_GITHUB_TOKEN` (preferred) or `GITHUB_TOKEN`
- Repo cloned for local dev, or install the package when published

## Install

```bash
npm install -g @a5c-ai/events
# or use npx without global install
npx @a5c-ai/events --help
```

### Local development

```bash
# from repo root (local development)
npm install || true
# when build scripts exist, you can run:
# npm run build
```

## Extract mentions from text

```bash
echo "Please review @developer-agent" | events mentions --source issue_comment
```

## Normalize a webhook payload

```bash
events normalize --in samples/workflow_run.completed.json --out out.json

jq '.type, .repo.full_name, .provenance.workflow?.name' out.json

# Filter and select
events normalize --in samples/workflow_run.completed.json \
  --filter 'type=workflow_run' \
  --select 'type,repo.full_name'
jq '.type, .repo.full_name' out.json
```

Expected output (example):

```json
"workflow_run"
"a5c-ai/events"
"Build"
```

## Enrich a pull request payload

```bash
export A5C_AGENT_GITHUB_TOKEN=ghs_xxx   # preferred over GITHUB_TOKEN; or use Actions token in CI

# No network by default; add --use-github to opt in to API lookups
events enrich --in samples/pull_request.synchronize.json --out out.json --use-github --flag include_patch=false

jq '.enriched.github.pr.has_conflicts, .enriched.github.pr.mergeable_state' out.json

Flags:

- `--flag include_patch=false` (default) omits diffs to keep outputs small and safer.
- `--flag commit_limit=50` and `--flag file_limit=200` bound API pagination.
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

## Validate against schema

```bash
events validate --in enriched.json --schema docs/specs/ne.schema.json --quiet
```

## Emit results

After enrichment, you can emit the final NE to stdout or a file:

```bash
events emit --in enriched.json                       # stdout (default)
events emit --in enriched.json --sink file --out result.json
```

- See CLI reference: docs/cli/reference.md#events-emit
- Technical spec: docs/producer/phases/technical-specs/apis/cli-commands.md

## Next steps

- Read the NE schema overview at `docs/cli/ne-schema.md`
- See CLI reference in `docs/cli/reference.md`
- Explore specs in `docs/specs/README.md`
