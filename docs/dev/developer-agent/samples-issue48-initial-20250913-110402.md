# Issue #48 – Producer Samples & Fixtures

## Summary

Add representative GitHub event payload samples and mirrored fixtures for tests:

- workflow_run.completed
- pull_request.synchronize
- push
- issue_comment.created

## Rationale

Specs reference these samples for normalization/enrichment examples. Fixtures will be consumed by unit tests in a follow-up once the test harness is ready (depends on issue #43).

## Plan

1. Add `samples/*.json` payloads (trimmed but structurally correct)
2. Add `tests/fixtures/github/*.json` mirrors
3. Ensure docs/specs references resolve to real files
4. Open draft PR and link to issue #48; mark blocked by #43

## Notes

- No runtime changes; docs + data only.
- Will not auto-close #48 until tests integration lands.
