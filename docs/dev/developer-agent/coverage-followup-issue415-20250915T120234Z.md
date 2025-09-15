# Coverage bump for CI thresholds

- Context: Follow-up to PR #415; CI red due to global line/stmt coverage 58.97% (<60%).
- Plan: add unit tests for src/utils/stable.ts and src/providers/github/map.ts; add thin unit tests for src/commands/{normalize,enrich}.ts.

## Plan

- stable.ts: cover iso datetime, sha, id/\_id/sha masking, run_id normalization.
- map.ts: cover workflow_run, check_run, branch and tag ref mapping via mapToNE.
- commands: cover cmdNormalize/cmdEnrich code paths directly (no CLI).

## Notes

- Keep tests minimal and focused. No source changes expected.
