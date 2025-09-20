# [Developer] Issue #1058 — Success Metrics in Onboarding

## Context

Add a concise “Success Metrics” section so users can confirm core flows quickly (normalize → enrich → reactor → emit). Cross-link observability docs.

## Plan

- Update `docs/user/product-flows.md` with a new “Success Metrics” section.
- Include copy‑paste commands and expected outputs:
  - Smoke: `npm run smoke`, check output files and validation exit code 0
  - Reactor: ensure sample reactor outputs exactly 1 event
  - Mentions: `enrich` with `--use-github` + flags yields at least one `source=code_comment`
  - Emit (dry): stdout sink returns 0
- Link to `docs/observability.md` for logs/JSON and flags.

## Notes

- `package.json` already exposes `smoke` and `reactor:sample` scripts.
- The `samples/pull_request.synchronize.json` is used in both smoke and reactor.

## Results (to be updated after implementation)

- [ ] Section added
- [ ] Commands verified locally
- [ ] Cross-links validated with `lychee` in CI
