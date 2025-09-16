---
title: Quick Start
description: Install, run, and validate the Events CLI in minutes.
---

# Quick Start

Use the CLI to normalize provider payloads, enrich with metadata, and extract mentions. This guide covers the fastest path from install to useful output.

## Prerequisites

- Node.js 20+
- Optional for GitHub lookups: set `A5C_AGENT_GITHUB_TOKEN` or `GITHUB_TOKEN`

## Install

```bash
npm install -g @a5c-ai/events
# or use npx without global install
npx @a5c-ai/events --help
```

## 1) Normalize a payload

```bash
events normalize --in samples/workflow_run.completed.json --out ne.json
jq '.type, .repo.full_name, .provenance.source' ne.json
```

Tips:

- Use `--select 'type,repo.full_name,provenance.workflow.name'` to print just a few fields.
- Use `--filter 'type=workflow_run'` to gate output (exit code 2 if not matched).

## 2) Enrich with metadata

Offline (no network calls):

```bash
events enrich --in ne.json --out enriched.json
jq '.enriched.github' enriched.json
# => { "provider": "github", "partial": true, "reason": "github_enrich_disabled" }
```

With GitHub API calls enabled:

```bash
export A5C_AGENT_GITHUB_TOKEN=ghs_xxx   # preferred over GITHUB_TOKEN
events enrich --in ne.json --use-github --out enriched.json
jq '.enriched.github.pr | {number, mergeable_state, owners_union}' enriched.json
```

Flags:

- `--flag include_patch=false` (default) omits diffs to keep outputs small and safer.
- `--flag commit_limit=50` and `--flag file_limit=200` bound API pagination.

## 3) Extract mentions

From a file:

```bash
events mentions --file README.md --source pr_body --known-agent developer-agent validator-agent
```

From stdin:

```bash
echo "Please review @developer-agent." | events mentions --source issue_comment
```

## 4) Validate against schema

```bash
events validate --in enriched.json --schema docs/specs/ne.schema.json --quiet
```

## Examples and Recipes

- GitHub Actions step to normalize current run:

```yaml
- name: Normalize workflow_run
  run: |
    npx @a5c-ai/events normalize \
      --source actions \
      --in "$GITHUB_EVENT_PATH" \
      --out event.json
    jq '.type, .repo.full_name, .labels' event.json
```

- Compose rules and reasons:

```bash
events enrich --in ne.json --rules samples/rules/conflicts.yml \
  | jq '(.composed // []) | map({key, reason})'
```

See also:

- CLI Reference: docs/cli/reference.md
- NE Schema overview: docs/cli/ne-schema.md
- Observability: docs/observability.md
