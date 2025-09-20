# CI: Align PR Size Labels workflow and deduplicate implementation (issue #1078)

## Context

Follow-up to PR #1076. Adjust triggers, remove duplication between GitHub Script and shell script, fix router duplication if present, and unify label metadata.

Refs: .github/workflows/pr-size-labels.yml, scripts/pr-size-labels.sh, .github/workflows/a5c.yml, CONTRIBUTING.md#PR Size Labels

## Plan

- Add `ready_for_review` to `pull_request.types`
- Optionally scope branches to `[a5c/main, main]`
- Deduplicate: keep GitHub Script; remove shell script
- Verify a5c router contains a single entry for "PR Size Labels"
- Ensure thresholds and descriptions match CONTRIBUTING

## Notes

- Keeping GitHub Script avoids gh/jq dependencies and runs faster
- Canonical thresholds per CONTRIBUTING: XS<10, S<50, M<200, L<500, XL≥500

## Results

- pr-size-labels.yml: added ready_for_review and branches [a5c/main, main]
- Removed scripts/pr-size-labels.sh to deduplicate
- CONTRIBUTING updated to mention ready_for_review
- a5c.yml router: only a single entry for "PR Size Labels" existed; no change needed
