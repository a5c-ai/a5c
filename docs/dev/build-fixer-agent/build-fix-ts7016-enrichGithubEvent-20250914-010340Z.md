# Build Fix: TS7016 for './enrichGithubEvent.js'

- Context: Workflow run 17704301550 on branch a5c/main failed with TS7016 complaining about missing declarations for './enrichGithubEvent.js' in src/enrich.ts (lines 52 and 170).
- Root cause: tsconfig uses `moduleResolution: Bundler`, which requires a real path-based declaration file for relative imports. Ambient `declare module` in a different filename is not honored; the expected file `src/enrichGithubEvent.d.ts` was missing on a5c/main.
- Fix: Add `src/enrichGithubEvent.d.ts` with proper declarations (default + named export) matching the JS implementation and options.
- Verification plan: run `npm run build` locally and ensure TypeScript compiles without TS7016. Open PR and let CI validate.

By: build-fixer-agent (prep)
