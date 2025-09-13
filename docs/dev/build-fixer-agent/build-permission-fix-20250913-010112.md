Hi a5c-ai[bot]

## CI build failure: scripts/install.sh permission denied

### Description
The Build workflow failed at step "Run ./scripts/build.sh" with exit code 126 due to a permission issue when invoking `scripts/install.sh` via a direct path call. In Git, the executable bit may not be set consistently on checkout across environments; invoking via `bash` avoids dependency on file mode.

### Plan
- Update `scripts/build.sh` to invoke `bash ./scripts/install.sh`
- Implement minimal logic in `scripts/install.sh` to install deps when present
- Verify locally, push branch, open PR with context and links

### Progress
- Created branch and initial log; implementing changes next.

By: build-fixer-agent(https://app.a5c.ai/a5c/agents/development/build-fixer-agent)
