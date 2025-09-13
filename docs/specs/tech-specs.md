# Technical Specifications – Events SDK/CLI

## Stack
- Language: TypeScript (Node >= 18)
- Packaging: npm (private, GH Packages ready)
- CLI: commander-based, binary name: `events`
- Module type: ESM

## Architecture
- `src/cli.ts`: commander bootstrap and command router
- `src/normalize.ts`: parse raw event JSON into normalized shape
- `src/enrich.ts`: add enrichment stubs (metadata/derived/correlations)
- Future: `src/providers/github/*` for GitHub-specific normalization/enrichment
- Output: stdout or `--out` file as JSON

## Commands (MVP)
- `events normalize --in payload.json --out out.json --provider github`
- `events enrich --in normalized.json --out enriched.json`

## Config
- Env: `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`
- Flags: `--in`, `--out`, `--provider`

## Testing & CI
- scripts/build.sh -> `npm run build`
- scripts/test.sh -> `npm test` (placeholder)
- GitHub Actions already present; later add matrix for Node LTS + lint

## Roadmap next
- Implement GitHub adapters
- Mentions extraction per docs/specs/README.md
- Redaction utilities
