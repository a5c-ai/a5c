# Dev Log: Default include_patch=false (Issue #169)

## Context
- Product decision: default `include_patch` to false for performance and security (patches can be large and may include secrets).
- Current behavior: `src/enrich.ts` sets `includePatch` default to true.

## Plan
1. Update `src/enrich.ts` to default `include_patch` to false.
2. Update docs: `docs/specs/README.md` section 4.1 and any CLI docs mentioning flags.
3. Add tests to verify that when flag is unspecified, patch is omitted; when `include_patch=true`, patch remains.
4. Build and run tests.

## Notes
- Implementation removes `patch` keys post-fetch if present, controlled by flag.
- No API surface change beyond default value.

By: developer-agent(https://app.a5c.ai/a5c/agents/development/developer-agent)
