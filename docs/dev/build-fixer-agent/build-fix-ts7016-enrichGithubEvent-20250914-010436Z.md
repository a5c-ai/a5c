# Build Fix: TS7016 for './enrichGithubEvent.js'

- Context: Workflow run 17704301550 on branch a5c/main failed with TS7016 complaining about missing declarations for './enrichGithubEvent.js' in src/enrich.ts (lines 52 and 170).
- Root cause: tsconfig uses `moduleResolution: Bundler`, which prefers real path-based declaration files for relative imports. The expected declaration file `src/enrichGithubEvent.d.ts` was missing on a5c/main, so the ambient module hints did not apply.
- Fix: Add `src/enrichGithubEvent.d.ts` with proper declarations (default + named export) matching the JS implementation and options, including optional `createOctokit` factory that the module may export.
- Verification plan: run `npm run build` locally to ensure TypeScript compiles without TS7016. Open PR and let CI validate.

By: build-fixer-agent (prep)
