# [High] Deployment – Enforce NPM_TOKEN for GitHub Packages

## Context
The Release workflow (`.github/workflows/release.yml`) sets `NPM_TOKEN: ${{ secrets.NPM_TOKEN || secrets.GITHUB_TOKEN }}`.
For GitHub Packages (npm), publishing typically requires a Personal Access Token (classic) with `write:packages` (and often `repo`) or an npm automation token scoped to the org. The `${{ secrets.GITHUB_TOKEN }}` fallback is unreliable for npm.pkg.github.com and may cause release failures when `NPM_TOKEN` is not configured.

## Recommendation
- Remove the fallback to `secrets.GITHUB_TOKEN` for `NPM_TOKEN` and fail early if `NPM_TOKEN` is not present.
- Document token requirements in README (scopes: `write:packages`, optionally `repo`).

## Suggested Change (example)
- Add a guard step before `semantic-release`:
  ```yaml
  - name: Assert NPM_TOKEN present
    run: |
      if [ -z "${NPM_TOKEN:-}" ]; then
        echo "NPM_TOKEN must be set for GitHub Packages publish" >&2
        exit 1
      fi
  ```
- Keep `registry-url: https://npm.pkg.github.com` and `.npmrc` lines:
  ```
  //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
  @a5c-ai:registry=https://npm.pkg.github.com/
  ```

## Priority
High (non-blocking): Prevents flaky releases caused by missing token.

