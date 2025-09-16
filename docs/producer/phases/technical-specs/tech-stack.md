# Technical Stack

See overview: [Specs Overview](../../../specs/README.md)

## Language and Runtime

- Node.js LTS (v20.x) for CLI and SDK
- TypeScript for type safety; `strict` enabled
- Target `ES2022`; ESM-first with CJS compatibility

## Packaging and Build

- Bundler: `tsup` (or `esbuild`) to emit ESM+CJS
- Types: `d.ts` emitted alongside builds
- Tree-shaking friendly module structure
- Publish to npm and GitHub Packages

## CLI Framework and Patterns

- CLI built with `commander` (simple) or `oclif` (plugin-ready)
- Commands: `normalize`, `enrich`, `emit`, `version`, `doctor`
- Flags pattern: `--in`, `--out`, `--select`, `--filter`, `--label key=value`, `--provider github`
- JSON stdout by default; pretty-print with `--pretty`

## Config and Secrets

- Read from env and files (`.env`, GitHub Actions `secrets.*`, `vars.*`)
- Token precedence: `A5C_AGENT_GITHUB_TOKEN` > `GITHUB_TOKEN` > none
- Redaction utilities to prevent secret leaks in logs

## Lint, Format, Tests

- ESLint (typescript-eslint), Prettier
- Jest or Vitest for unit; `ts-jest` if Jest
- Integration harness using sample payloads

## Release Scheme

- SemVer with Conventional Commits
- Changesets for versioning and changelog automation
- Release CI on `a5c/main` push; tagged releases mirror to `main`

## Distribution

- `npx @a5c-ai/events` bin for CLI
- Exported SDK APIs under `@a5c-ai/events`
