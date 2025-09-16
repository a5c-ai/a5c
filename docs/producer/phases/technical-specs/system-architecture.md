# System Architecture

See overview: [Specs Overview](../../../specs/README.md)

## Context Diagram

- Actors: GitHub Actions, Webhook sender, Local dev shell
- System: Events CLI/SDK
- External: GitHub API, File system, Stdout/Artifacts

## Container Diagram

- CLI Container: command router, flag parser, IO layer
- Core Library: normalizer, enricher, schema, utils
- Providers: GitHub adapter; future: GitLab, Bitbucket
- Plugins: enrichment hooks (pre/post), output sinks
- Storage: ephemeral artifacts; optional cache directory

## Data Flow

1. Input (Actions env or webhook JSON)
2. Normalize to NE schema
3. Enrich with provider APIs and local repo context
4. Emit JSON to stdout or file; optional composed events

## Non-Functional

- Idempotent transforms; deterministic output for same input+config
- Performance: sub-second for typical payloads; pagination limits
- Security: token scoping; redaction; no secret persistence
