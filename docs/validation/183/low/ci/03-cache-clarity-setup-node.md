# [Validator] [CI] Clarify caching in setup-node

`actions/setup-node@v4` is configured with `cache: npm`, but the workflow does not run `npm ci` directly. Explicit install helps the action prime/restore cache effectively.

Priority: low
