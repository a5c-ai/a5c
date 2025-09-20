---
title: Core Product Flows
description: End-to-end flows with commands, flags, and links to specs.
---

# Core Product Flows

Use these flows to go from raw events to actionable outputs. Each flow links to specs and CLI reference, with real commands you can run locally.

## Prerequisites

- Node.js 20+ (`.nvmrc` present)
- Repo cloned with `samples/` available
- Optional: GitHub token exported as `GITHUB_TOKEN` for online enrich/mentions

## Install

```bash
npm ci
```

## Normalize → Enrich → Validate

```bash
# Normalize a sample GitHub event
events normalize \
  --in samples/pull_request.synchronize.json \
  --out out.ne.json

# Enrich with rules to produce composed events (.composed[])
events enrich \
  --in out.ne.json \
  --rules samples/rules/conflicts.yml \
  --out out.enriched.json

# Validate enriched output against NE schema
events validate \
  --in out.enriched.json \
  --schema docs/specs/ne.schema.json
```

- Specs: `docs/specs/README.md` (§6.1 Rule Engine and Composed Events)
- Reference: `docs/cli/reference.md` (normalize, enrich, validate)

## Mentions (Agents and Users)

Extract `@mentions` from issues, PRs, commit messages, and code comments.

Code comments in changed files (via enrich, offline-safe):

```bash
# Scan changed files for @mentions in code comments using enrich
events enrich \
  --in samples/pull_request.synchronize.json \
  --flag include_patch=true \
  --flag "mentions.scan.changed_files=true" \
  --flag "mentions.languages=ts,js" \
  --out /dev/stdout \
  | jq '.enriched.mentions // [] | map(select(.source=="code_comment"))'
```

Plain text extraction (stdin or file):

```bash
# From stdin
echo "Please review @developer-agent" \
  | events mentions --source issue_comment \
  | jq -r '.[].normalized_target'

# From a file
events mentions --file README.md --source pr_body \
  | jq -r '.[].normalized_target'
```

When to use which:

- Use `events enrich` for scanning code comments and other repo-derived sources (controls under `--flag mentions.*`).
- Use `events mentions` for plain text you pass via stdin or `--file` (no `mentions.*` flags here).

- Specs: `docs/specs/README.md` (§4.2 Mentions Schema)
- Reference: `docs/cli/reference.md#events-enrich` (Mentions scanning flags)
- Deep dive: `docs/cli/code-comment-mentions.md`

## Rules and Reactor

Rules during enrich emit `.composed[]` for routing. The reactor evaluates rules and dispatches actions.

```bash
# Create a minimal rules file
cat > rules.sample.yml <<'YAML'
rules:
  - when:
      any:
        - has_label: documentation
    emit:
      type: docs.update
      payload:
        note: "Docs-related change"
YAML

# Enrich with rules
events enrich --in out.ne.json --rules rules.sample.yml | jq '.composed // []'

# Reactor (defaults to .a5c/events/reactor.yaml)
events reactor --in out.enriched.json --out /tmp/reactor.out.json
```

- Specs: `docs/specs/README.md` (§6.1 Rule Engine and Composed Events)
- Reference: `docs/cli/reference.md` (enrich, reactor)

## Validate Only the Normalized Subset (Optional)

Drop `.composed` before validation if you only need the normalized core.

```bash
jq 'del(.composed)' out.enriched.json > out.ne.only.json
events validate --in out.ne.only.json --schema docs/specs/ne.schema.json
```

## Tips

- When no rules match, `.composed` may be absent; use `(.composed // [])` in `jq`.
- In enrich, use `--flag mentions.scan.changed_files=false` to disable code-comment scanning.
- Language mapping includes `tsx/jsx` → `ts/js` automatically.

## Success Metrics

Use these quick checks to confirm the core flows are healthy on a fresh clone. Copy/paste the commands and verify the noted outputs/exit codes.

### 1) Smoke — normalize → enrich → validate

```bash
# Run end-to-end smoke (quiet validation)
npm run -s smoke

# Expected:
# - Exit code: 0
# - Files exist:
ls -1 out.ne.json out.enriched.json

# - Validate enriched output (exit 0)
events validate --in out.enriched.json --schema docs/specs/ne.schema.json --quiet
```

### 2) Reactor — sample rule produces one event

```bash
npm run -s reactor:sample | jq '.events | length'
# Expected: 1
```

### 3) Mentions — code comments detected during enrich

Requires a token for file-fetch scanning. Either `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN` works for this repository.

```bash
export GITHUB_TOKEN=${GITHUB_TOKEN:-"<your-token>"}

events enrich \
  --in samples/pull_request.synchronize.json \
  --use-github \
  --flag include_patch=false \
  --flag "mentions.scan.changed_files=true" \
  --flag "mentions.languages=ts,js" \
  --out /tmp/m.enriched.json

# Count code-comment mentions
jq '[.enriched.mentions[]? | select(.source=="code_comment")] | length' /tmp/m.enriched.json
# Expected: >= 1
```

If you prefer patch-based scanning without network access, ensure your input carries diffs (set `--flag include_patch=true` and provide an event payload with patches). See `docs/cli/code-comment-mentions.md`.

### 4) Emit (dry) — stdout sink

```bash
events emit --in out.enriched.json --sink stdout >/dev/null
# Expected: exit code 0
```

### Observability

- For JSON logs and step summaries in CI, see `docs/observability.md`.
- CLI flags and environment toggles for structured logs are documented there.

## References

- Specs: `docs/specs/README.md`
- CLI Reference: `docs/cli/reference.md`
- NE Schema Overview: `docs/cli/ne-schema.md`
