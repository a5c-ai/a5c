# Build Fix: Disable Husky in Release

- Context: semantic-release failing on a5c/main due to Husky commit-msg enforcing commitlint on generated release commits.
- Root cause: commitlint default rules (body-max-line-length, footer-max-line-length, footer-leading-blank) failing for auto-generated commit by @semantic-release/git.
- Plan: Set HUSKY=0 for semantic-release steps in .github/workflows/release.yml to skip Git hooks during CI releases.

Initial checkpoint created.
