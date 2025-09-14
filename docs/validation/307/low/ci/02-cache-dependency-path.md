# [Validator] [CI] - Ensure node cache hits lockfile

Consider explicitly setting `cache-dependency-path: package-lock.json` in `actions/setup-node@v4` for clarity. Behavior is correct today, but explicitness can help future changes (e.g., workspaces).
