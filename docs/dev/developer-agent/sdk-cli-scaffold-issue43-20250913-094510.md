# SDK/CLI Scaffold – Issue #43

## Context
Initialize Node.js + TypeScript project for Events SDK/CLI per docs/specs/README.md. Provide CLI with `normalize` and `enrich` subcommands, config loader, and npm scripts for CI.

## Plan
- ESM TypeScript setup (`tsconfig.json`, `src/**`, `dist/`)
- CLI entry `events` (commander) with `normalize` and `enrich`
- Config loader (env + flags)
- NPM scripts: build, test, lint
- Align GitHub workflows to call npm via scripts/build.sh and scripts/test.sh

## Notes
- TypeScript 5.9.2
- Node 22 target, `module` node20, ESM
- Stub handlers: read optional `--in` file; output JSON with basic shape; exit code 0
