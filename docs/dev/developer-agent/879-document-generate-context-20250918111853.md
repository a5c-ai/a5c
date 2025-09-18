# Task: Document `events generate-context`

Issue: #879

## Plan

- Add README command entry + link
- Expand `docs/cli/reference.md` with usage, flags, examples
- Cross-link from `docs/user/sdk-quickstart.md` if appropriate
- Validate anchors and links locally where possible

## Context

- Code: `src/cli.ts` (command), `src/generateContext.ts`
- Tests: `test/generateContext.test.ts`
- Docs: `docs/user/sdk-quickstart.md`

## Progress Log

- [init] Branch created and note added as first commit.

[update] Implemented README command entry and CLI reference section `events generate-context` with usage, flags, examples (local, stdin/stdout, github://). Added cross-link from SDK quickstart. Ran lint/typecheck/tests successfully.
