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

Patch-based scanning (no network):

```bash
events mentions \
  --source code_comment \
  --flag mentions.scan.changed_files=true \
  --flag mentions.languages=ts,js \
  --flag mentions.max_file_bytes=102400 \
  | jq '.[] | select(.source=="code_comment")'
```

Issue/PR text scanning:

```bash
events mentions --source issue_comment \
  | jq -r '.[].normalized_target'
```

- Specs: `docs/specs/README.md` (§4.2 Mentions Schema)
- Reference: `docs/cli/reference.md` (Mentions scanning and flags)
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
- Use `--flag mentions.scan.changed_files=false` to disable code-comment scanning.
- Language mapping includes `tsx/jsx` → `ts/js` automatically.

## References

- Specs: `docs/specs/README.md`
- CLI Reference: `docs/cli/reference.md`
- NE Schema Overview: `docs/cli/ne-schema.md`
