# [Low] Tests — Cleanup of temp files in issues mentions test

- PR: #595
- Category: tests
- Priority: low priority

## Context

`tests/enrich.issues.mentions.test.ts` writes a temp JSON file into `.a5c-tmp/` but does not remove it after the test completes. Over time, these files can accumulate in local runs or CI workspaces.

## Suggestion

- Remove the file after `handleEnrich` returns (e.g., `fs.unlinkSync(file)` in a `finally` block), or
- Use Vitest's tmp utilities/fixtures pattern to manage ephemeral files, or
- Write to `os.tmpdir()` with a unique prefix and clean up in `afterEach`.

## Rationale

Keeps the workspace clean and prevents incidental interference in future tests or developer environments.
