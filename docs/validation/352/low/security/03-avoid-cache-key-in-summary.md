# [Validator] [Security] Avoid printing cache keys in human summary

Priority: low priority
Category: security

## Context

The summary may include `(...KEY)` if provided. While cache keys are typically non-sensitive, they can leak internal structure. Observability JSON can retain full detail; summaries should be minimal.

## Proposal

- Omit cache `KEY` from the step summary; keep in JSON artifact.

## Acceptance Criteria

- Step summary shows cache kind and hit/miss/unknown only.
- JSON remains unchanged.
