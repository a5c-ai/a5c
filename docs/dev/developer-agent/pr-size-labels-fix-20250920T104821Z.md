# Fix: PR Size Labels workflow implementation

## Summary

Implement and verify the PR size labeling workflow so it is active and aligned with CONTRIBUTING thresholds (XS/S/M/L/XL). Remove unintended XXL bucket to match docs.

## Plan

- Verify current workflow and scripts
- Align thresholds and labels to docs
- Keep workflow fast and PR-triggered
- Open PR to a5c/main, link issue #1072

## Notes

- Uses `gh` CLI + `jq` on runner
- Creates labels if missing; idempotent updates on PR changes
