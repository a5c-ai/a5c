# Release pipeline fix: GitHub Packages auth and protected-branch git plugin

Context:

- Failed run: https://github.com/a5c-ai/events/actions/runs/17743031013 (Release on a5c/main)
- Error: npm publish to GitHub Packages 401 Unauthorized using NPM_TOKEN
- Root cause: .npmrc uses NPM_TOKEN for GH Packages; workflow set NPM_TOKEN from npmjs secret which is invalid for GPR. @semantic-release/npm prefers NPM_TOKEN and thus failed.
- Secondary: @semantic-release/git commits on a5c/main can violate protected branch (GH006).

Plan:

1. Use GITHUB_TOKEN for GH Packages by wiring NPM_TOKEN and NODE_AUTH_TOKEN to GITHUB_TOKEN on a5c/main and main semantic-release steps.
2. Keep NPM_TOKEN only for npmjs publish step.
3. Convert .releaserc.json to .releaserc.cjs and disable @semantic-release/git on a5c/main.
4. Build locally to validate.
5. Open PR with details and links.

Verification:

- semantic-release on a5c/main publishes to GH Packages with GITHUB_TOKEN.
- main stable still publishes to GH Packages (semantic-release) and npmjs (separate step with NPM_TOKEN).
