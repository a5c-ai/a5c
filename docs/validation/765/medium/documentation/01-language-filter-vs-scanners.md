# [Medium] Mentions language filter vs supported scanners

Category: documentation

## Observation

`mentions.languages` accepts canonical language IDs and common extensions (normalized to IDs), listing examples such as `js, ts, py, go, java, c, cpp, sh, yaml, md`.

However, current code-comment scanning supports a subset of languages for changed files:

- `js` family (js, mjs, cjs, jsx → js)
- `ts` family (ts, tsx, d.ts → ts)
- `md` (markdown)

See:

- `src/codeComments.ts::detectLanguage()` returns only `js | ts | md | null`.

## Impact

- Passing IDs like `yaml`, `py`, `go`, etc. will be correctly normalized in the allowlist but will have no effect because code comment scanning won’t select those files yet.

## Recommendation

- Clarify in docs that code-comment scanning currently supports js/ts/md.
- Optionally, extend `detectLanguage()` and `scanContentForMentions()` to handle additional languages or state that only js/ts/md are scanned for code comments in this version.

## Rationale

This is non-blocking for the PR, as docs correctly explain normalization behavior; this note highlights current scope vs. future expansion.
