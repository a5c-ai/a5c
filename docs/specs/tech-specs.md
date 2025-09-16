# Technical Specifications – Events SDK/CLI

## Stack

- Language: TypeScript (Node >= 18)
- Packaging: npm (private, GH Packages ready)
- CLI: `yargs`-based, binary name: `events`
- Module type: ESM

## Architecture

- `src/cli.ts`: yargs bootstrap and command router
- `src/commands/normalize.ts`: parse raw event JSON into normalized shape
- `src/commands/enrich.ts`: add enrichment stubs (metadata/derived/correlations)
- Future: `src/providers/github/*` for GitHub-specific normalization/enrichment
- Output: stdout or `--out` file as JSON

## Commands (MVP)

- `events normalize --in payload.json --out out.json --provider github`
- `events enrich --in normalized.json --out enriched.json`

## Config

- Env: `GITHUB_TOKEN` or `A5C_AGENT_GITHUB_TOKEN`
- Flags: `--in`, `--out`, `--provider`

## Plugin Discovery

- Gate: `EVENTS_ENABLE_PLUGINS` (off by default). Discovery returns empty unless enabled or `listPlugins({ force: true })` is used in tests.
- Sources (highest precedence first):
  - `.eventsrc.json` with `{ "plugins": ["@org/events-plugin", "./plugins/my.cjs"] }`
  - `.eventsrc.yaml`
  - `.eventsrc.yml`
  - `package.json` under `events.plugins`
- Merging and de-duplication:
  - Merge in precedence order; keep the first occurrence of a specifier (higher precedence wins).
- Resolution:
  - Relative paths (`./`, `/`) resolve to absolute `file://` URLs based on `cwd`.
  - Bare specifiers remain unchanged.
- Execution: Not implemented yet — discovery only via `src/core/plugins.ts` `listPlugins(opts?)`.

## Testing & CI

- scripts/build.sh -> `npm run build`
- scripts/test.sh -> `npm test` (placeholder)
- GitHub Actions already present; later add matrix for Node LTS + lint

## Roadmap next

- Implement GitHub adapters
- Mentions extraction per docs/specs/README.md
- Redaction utilities
