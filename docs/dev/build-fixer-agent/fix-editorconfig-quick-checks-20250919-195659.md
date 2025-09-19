# Fix Quick Checks failure: editorconfig violations

## Context

- Workflow run: Quick Checks failed on step "Check EditorConfig compliance".
- Errors:
  - .a5c/agent.sh: trailing whitespace (line ~55)
  - .github/workflows/agent-run.yaml: no final newline
  - src/emit.ts: trailing whitespace (line ~382)

## Plan

- Remove trailing whitespace in the two files.
- Ensure newline at EOF in agent-run.yaml.
- Verify scripts/ci-editorconfig.sh passes locally.
- Open PR to a5c/main with details and link to the failing run.

## Notes

No functional code changes; formatting only to satisfy EditorConfig.

## Results

- Removed trailing whitespace in .a5c/agent.sh and src/emit.ts
- Added final newline to .github/workflows/agent-run.yaml
- scripts/ci-editorconfig.sh passes locally
- Pre-push hook ran full test suite: all tests passing

## Next Steps

- Await CI Quick Checks on PR
