# Build Fix: Type declarations for enrichGithubEvent

## Context
The Build workflow failed with TS7016: missing declaration file for module `./enrichGithubEvent.js` referenced by `src/enrich.ts`.

## Plan
- Add ambient types for `./enrichGithubEvent.js`
- Verify local build
- Open PR against `a5c/main`

## Notes
Repo also has new provider path shim at `src/providers/github/enrich.js`. We'll keep both paths typed to avoid breakage.

## Results
- Added `src/enrichGithubEvent.d.ts`
- Expanded `src/types-enrichGithubEvent.d.ts` to declare both `./enrichGithubEvent.js` and `./providers/github/enrich.js`
- Installed `yaml` dependency required by `src/rules.ts`
- Local build succeeds (`npm ci && npm run build`)
