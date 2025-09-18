# [Validator] [Code] - Support optional chaining in `this` mapping

- Severity: low priority
- Category: code
- Context: PR #928 (branch: fix/generateContext-this-binding-ci)

## Summary

`preprocess()` maps leading `this` to `thisArg` using a regex that covers `this`, `this.prop`, and `this["key"]`. It does not currently catch optional chaining forms like `this?.prop`.

## Suggested Improvement

Extend the regex to also match `this?` before `.` or `[`, e.g. by including `\?\.` in the lookahead:

- Current: `^\s*this(?=(?:\s*$|[\.\[]))`
- Example extension: `^\s*this(?=(?:\s*$|(?:\?\.)|[\.\[]))`

This remains non-blocking because templates can use `vars.this` implicitly via `thisArg` binding, and common cases are covered.

## Rationale

- Improves robustness for templates using optional chaining.
- Keeps behavior consistent with explicit `thisArg` approach.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
