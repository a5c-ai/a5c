# Block comment path returns string location

Priority: low priority
Labels: validator, functionality

## Summary

In `scanJsLike` for block comments, mentions are pushed with `location` as a legacy string (`"path:line"`) while line-comment path uses the new object shape `{ file, line }`. This is an inconsistency with the PR goal "unify Mention.location to object form".

## Evidence

- File: `src/codeComments.ts` in `scanJsLike` block-comments loop: `out.push({ ...mm, location: `${path}:${lineNo}` });`

## Suggested Fix

- Change to `location: { file: path, line: lineNo }`.
- Add/update tests to assert object-shaped locations for block comments.

## Acceptance

- All code-comment mention locations use object shape.
