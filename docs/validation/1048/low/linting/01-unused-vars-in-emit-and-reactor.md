## [Validator] [Linting] - Unused variables in emit/reactor

### Context

While validating PR #1048, lint reported unused variables in files that are not modified by this PR:

- `src/emit.ts`: lines ~299 (`cp`) and ~363 (`exec`)
- `src/reactor.ts`: lines ~7 (`parseGithubEntity`), ~640 (`matchesAnyTrigger`), ~1317 (`envProc`)

These are warnings (no errors) and non-blocking, but addressing them will keep the codebase tidy and reduce noise in CI.

### Suggested Fix

- Remove unused variables or prefix with `_` to satisfy the existing lint rule allowing intentionally unused args/vars.

### Priority

low priority
