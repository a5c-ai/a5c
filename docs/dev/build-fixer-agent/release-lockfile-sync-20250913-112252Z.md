# Release pipeline fix: lockfile + deps + tsconfig

## Context

- Release workflow failed on Install step due to `npm ci` lockfile mismatch and missing deps.
- Run: https://github.com/a5c-ai/events/actions/runs/17695808287 (Release on a5c/main)
- Errors mention out-of-sync lock for @octokit/rest/minimatch and missing lock entries; local build also showed missing runtime deps (commander, dotenv) and Node types resolution for `node:` imports.

## Plan

- Add missing deps: commander, dotenv.
- Update tsconfig to include Node types.
- Regenerate package-lock.json with `npm install`.
- Build and run tests to verify.
- Open PR with details and labels.

## Notes

- Category: Project build errors (package/tsconfig).
