# [Validator] [Security] - Address high severity npm audit findings

### Summary

`npm ci` reported 2 high severity vulnerabilities in the dev dependency tree. While not blocking this PR, we should update or pin affected packages to eliminate known issues.

### Details

- Run: `npm audit` to list full paths
- Prefer non-breaking updates; use `npm audit fix --force` only if we validate no runtime impact
- Verify CI and local builds after updates

### Acceptance Criteria

- `npm audit` reports 0 high severity vulnerabilities
- CI (build + tests) passes on Node 20

### Notes

These are dev-time dependencies (build/test/lint), so risk is limited, but we keep the tree clean.
