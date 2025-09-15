---
title: Code-Comment Mentions
description: Extracting @mentions from code comments in changed files during enrich.
---

# Code-Comment Mentions

You can extract `@mentions` from code comments in files changed by a PR or push. The CLI adds these to `enriched.mentions[]` with `source=code_comment` and location context.

## Prerequisites

- Install the CLI from this repo or use `npm run build` for local usage.
- For file-fetch scanning (no patches), set a token and pass `--use-github`:
  - `export GITHUB_TOKEN=...` or `export A5C_AGENT_GITHUB_TOKEN=...`

## Two Scanning Modes

- Patch-based scanning (offline): enable `--flag include_patch=true` so the input carries diffs; the scanner parses added/context lines and looks for comment markers by language.
- File-fetch scanning (online): pass `--use-github` and a token; the scanner fetches raw files at `ref` and scans comments by language. Works even if `include_patch=false`.

## Flags

- `--flag mentions.scan.changed_files=true|false` (default: `true`)
- `--flag mentions.max_file_bytes=<n>` (default: `204800`)
- `--flag mentions.languages="js,ts,py,go,java,c,cpp,sh,yaml"` — optional allowlist

## Examples

### Patch-based (no network)

```bash
events enrich --in samples/pull_request.synchronize.json \
  --flag include_patch=true \
  --flag "mentions.scan.changed_files=true" \
  --flag "mentions.languages=js,ts" \
  | jq '.enriched.mentions | map(select(.source=="code_comment"))'
```

### File-fetch (requires token)

```bash
export GITHUB_TOKEN=...  # or A5C_AGENT_GITHUB_TOKEN
events enrich --in samples/pull_request.synchronize.json \
  --use-github \
  --flag include_patch=false \
  | jq '.enriched.mentions | map(select(.source=="code_comment"))'
```

## Output Shape

Each mention includes file and line when available:

```json
{
  "target": "@triager-agent",
  "normalized_target": "triager-agent",
  "kind": "agent",
  "source": "code_comment",
  "location": { "file": "src/utils/foo.ts", "line": 12 },
  "context": "// @triager-agent route this to triage",
  "confidence": 0.85
}
```

## Tips

- Keep `mentions.max_file_bytes` reasonable to avoid scanning large binaries or minified bundles.
- Use `mentions.languages` to focus on the languages your repo uses.
- Set `include_patch=false` by default; enable it only for workflows that need diff content in outputs.
