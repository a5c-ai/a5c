# Deduplication uses unstable key for object locations

Priority: medium priority
Labels: validator, tests

## Summary

`extractor.dedupeMentions()` computes a dedupe key using `${m.location || ''}`. When `m.location` is an object (preferred shape), this stringifies to "[object Object]", causing different mentions with different `{ file, line }` to collapse under the same key. This can undercount mentions across multiple files/lines.

## Evidence

- File: `src/extractor.ts` line ~50
- Key: ``const key = `${m.source}|${m.normalized_target}|${m.location || ''}```
- Upstream in this PR, `codeComments` and `commentScanner` set object-shaped locations.

## Suggested Fix

- Build a stable location key: when `typeof m.location === 'object'`, use `${file}:${line}`; else use string.
- Add unit tests covering two identical mentions at different files/lines to ensure they are not deduped together.

## Acceptance

- Dedupe preserves unique mentions per `{file, line}`.
- Existing tests continue to pass.
