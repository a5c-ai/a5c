# Ensure NPM_TOKEN secret for npmjs publish

Category: deployment
Priority: high

Summary:
- The Release workflow publishes stable versions to npmjs.org using `NODE_AUTH_TOKEN`.
- A repo/org secret named `NPM_TOKEN` with publish rights to the `@a5c-ai` scope is required.

Acceptance criteria:
- `NPM_TOKEN` secret exists at repo or org level.
- Token has `publish` permission for `@a5c-ai/events` on npmjs.
- Optional: rotate and document token owner and expiry policy.

Validation steps:
1. Confirm presence via GitHub Actions secrets UI or API.
2. Trigger a dry-run publish on a non-production tag (skip if not safe).

