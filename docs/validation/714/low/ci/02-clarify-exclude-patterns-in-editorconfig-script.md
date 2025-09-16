## Clarify and unit-test exclude patterns in ci-editorconfig script

Context: `scripts/ci-editorconfig.sh` now uses a single regex passed via `-exclude` to omit logs, docs, Markdown, temp files, and stray configs. This is correct and pragmatic. However, the pattern is compact and easy to regress.

Suggestions:

- Add brief inline comments mapping each alternation to an example path.
- Add a tiny script test (bash or node) that enumerates representative file paths and asserts which should be excluded/included. Run it in CI as part of quick checks.

Category: ci
Priority: low
