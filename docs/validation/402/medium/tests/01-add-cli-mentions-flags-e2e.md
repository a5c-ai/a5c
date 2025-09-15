#[Validator] [Tests] - Add CLI e2e for mentions flags

## Context

Docs updated in PR #402 document `events enrich` flags for code-comment mentions scanning:

- `mentions.scan.changed_files` (default: true)
- `mentions.max_file_bytes` (default: 204800)
- `mentions.languages` (optional allowlist)

However, current CLI path (`src/commands/enrich.ts::cmdEnrich`) does not perform code-comment scanning; only `src/enrich.ts::handleEnrich` implements it. After the implementation is wired into the CLI, add an e2e test to prevent regressions.

## Requirements

- Create `tests/cli.enrich.mentions-flags.test.ts` to cover:
  - Scanning disabled: `--flag mentions.scan.changed_files=false` yields zero `code_comment` mentions.
  - Language filter: `--flag mentions.languages=ts,js` limits results to matching extensions.
  - Byte cap: `--flag mentions.max_file_bytes=102400` skips oversized files.
- Use an input sample with PR-like structure and changed files (either via mocked enrichment with `include_patch=true` to scan from patches, or via `--use-github` with injected mocked Octokit).
- Assert mentions appear under `.enriched.mentions[]` with `source=="code_comment"` and include `location.file`.

## Priority

medium priority

## Notes

- Prefer reusing existing helpers from `src/utils/commentScanner.ts` and any shared scanning routine to avoid duplication in tests.
