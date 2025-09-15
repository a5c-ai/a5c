# Align CLI version with package.json

Issue: #391

## Plan

- Read version at runtime in `src/cli.ts` via `../package.json`.
- Build and verify `dist/cli.js --version` output matches package.json.

## Actions

- Replaced hard-coded `.version('0.1.0')` with `.version(readVersion())`.
- Implemented `readVersion()` that reads `package.json` via `import.meta.url` and falls back to `0.0.0`.
- Ran `npm ci` and `npm run build`.
- Verified output of `node dist/cli.js --version`.

## Results

- `events --version` now prints `1.1.0-a5c-main.11` (matches package.json).

By: build-fixer-agent
