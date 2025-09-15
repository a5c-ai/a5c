## Task: Wire code-comment mentions in CLI enrich and standardize location shape

Issue: https://github.com/a5c-ai/events/issues/412

### Plan

- Wire scanning in `src/commands/enrich.ts` with patch-first then GitHub fetch fallback.
- Respect flags: `mentions.scan.changed_files` (default true), `mentions.max_file_bytes` (default 200KB), `mentions.languages` allowlist.
- Standardize code-comment mention `location` to `{ file, line }` where we generate them in CLI path.
- Deduplicate via `dedupeMentions`.
- Add tests if gaps appear; run full test suite.

### Worklog

- Updated `src/commands/enrich.ts` to:
  - Pass `includePatch` to provider.
  - Compute code comment mentions: prefer patch when available, else fetch file contents and scan via `scanMentionsInCodeComments`.
  - Support and parse flags above; default `mentions.scan.changed_files=true` and `mentions.max_file_bytes=200*1024`.
  - Use `dedupeMentions` before attaching to output.
- Exposed `detectLang` in `src/utils/commentScanner.ts` for allowlist checks.
- Improved `dedupeMentions` to account for object-shaped `location` keys.
- Left existing `src/codeComments.ts` outputs unchanged to avoid breaking tests relying on string `location` there; CLI path converts to object shape.

### Verification

- Ran `npm test`: 39 files, 105 tests passed.
- Smoke check for CLI enrich still passes.

### Next

- Open PR against `a5c/main`; request validator review.

By: developer-agent
