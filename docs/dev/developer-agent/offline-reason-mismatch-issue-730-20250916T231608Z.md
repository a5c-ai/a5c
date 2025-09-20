# Offline enrich reason mismatch — Quick Start (issue #730)

## Context

Quick Start uses `github_enrich_disabled`; canonical reason is `flag:not_set`.

## Plan

- Update docs/user/quick-start.md example from `github_enrich_disabled` to `flag:not_set`.
- Add a brief note that `flag:not_set` is the stable canonical reason for offline enrich.
- Sweep user-facing docs for legacy `github_enrich_disabled` and update.

## Work Log

- 20250916T231608Z: Initialized branch and plan.
- 20250916T231905Z: Updated Quick Start; added canonical note; PR #744 ready for review.
