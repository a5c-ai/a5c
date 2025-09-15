# build-fixer-agent — Fix Release workflow failure: protected branch push by semantic-release

## Context

- Failed run: https://github.com/a5c-ai/events/actions/runs/17741113352
- Workflow: .github/workflows/release.yml (Release)
- Branches affected: a5c/main (prerelease), main (stable)

## Symptom

semantic-release step failed with @semantic-release/git attempting to push `HEAD:a5c/main` and being blocked by branch protection (GH006: protected branch update failed — required checks expected).

## Plan

1. Stop semantic-release from pushing commits to protected branches (remove @semantic-release/git).
2. Keep tagging and publishing via semantic-release (@semantic-release/npm, @semantic-release/github).
3. Add HUSKY=0 for release steps to avoid local hooks in CI.
4. Validate build and open PR to a5c/main.

## Notes

- This change preserves release tags and GitHub Releases; it no longer commits CHANGELOG.md/package.json back to the branch during CI (avoids protected-branch push).
