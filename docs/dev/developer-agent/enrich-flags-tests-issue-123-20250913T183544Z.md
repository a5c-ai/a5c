# Enrich flags tests – include_patch

Issue: #123

## Plan

- Add `tests/enrich.flags.test.ts` covering include_patch true/false
- Use mocked Octokit and sample payloads (PR and push)
- Verify patch stripping when false, presence when true
- Keep default unchanged; open follow-up to decide default

## Notes

- Code: `src/enrich.ts` controls include_patch via `toBool(opts.flags?.include_patch ?? true)`
- Tests should pass without network/token
