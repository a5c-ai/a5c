# Docs list broader language support than implemented

Priority: medium priority
Labels: validator, documentation

## Summary

CLI docs state language allowlist supports `js, ts, py, go, java, c, cpp, sh, yaml`, but current implementation of content scanning only detects `js`, `ts`, and `md` in `codeComments.detectLanguage()`. The allowlist `mentions.languages` may suggest scanning unsupported types.

## Evidence

- Docs: `docs/cli/reference.md` and `docs/cli/code-comment-mentions.md`
- Code: `src/codeComments.ts` `detectLanguage()` returns only `js | ts | md`.

## Options

- Expand `detectLanguage()` + scanners to cover listed languages; or
- Narrow documentation to reflect currently supported set (js, ts, md), and mark others as roadmap.

## Acceptance

- Docs and behavior aligned, or functionality expanded accordingly.
