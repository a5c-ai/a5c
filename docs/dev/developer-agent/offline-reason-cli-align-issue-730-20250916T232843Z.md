# Task: Align CLI reference wording for offline enrich reason

## Context

Issue: https://github.com/a5c-ai/events/issues/730
Goal: Ensure CLI reference uses the canonical offline enrich reason `flag:not_set` and includes a brief stability note.

## Plan

- Locate CLI reference docs.
- Update wording to `flag:not_set` and add stability note.
- Sweep user-facing docs for `github_enrich_disabled`.
- Open PR against `a5c/main` linking the issue.

## Progress

- Initialized branch and dev log.

## Results

- Updated `docs/cli/reference.md` to assert `flag:not_set` is canonical and stable across minor releases.
- Removed wording that suggested the value was implementation-defined and may evolve.
- Verified no user-facing docs mention `github_enrich_disabled`.
