# Task 898: Support github:// refs with slashes in generate-context

## Context

Issue: #898 – docs example uses `github://a5c-ai/events/a5c/main/README.md`, but parser splits `ref` at first segment and fails.

## Plan

- Update `src/generateContext.ts` to parse `github://owner/repo/<ref-with-slashes>/<file>` by trying the longest ref-first split and falling back to the old behavior.
- Keep backward compatibility for `owner/repo/ref/path`.
- Add a test guarded by token presence for integration fetch against `a5c/main`.
- Update `docs/cli/reference.md` to document slash-containing refs support and optional URL-encoding.

## Notes

- Uses Octokit `repos.getContent` with provided token or env token.
- Integration test skips when neither `A5C_AGENT_GITHUB_TOKEN` nor `GITHUB_TOKEN` is set.
