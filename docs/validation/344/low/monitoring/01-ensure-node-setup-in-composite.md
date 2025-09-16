# [Low] Composite action robustness: ensure Node is available

The composite action executes `node -e ...` but relies on the caller job to have provisioned Node.js.

Recommendation:

- Add a step inside the composite to `uses: actions/setup-node@v4` with a default version (e.g., `20`) to make the action self-sufficient, OR
- Document clearly that consumers must run `actions/setup-node` before this action.

Rationale: Improves portability across jobs and repositories.
