# [Low][CI] Add problem matchers for readability

## Context
Codespell/Markdownlint output can be annotated directly in the PR UI via problem matchers.

## Recommendation
- Add a lightweight matcher step (or use reviewdog) to surface inline annotations for findings.
- Keep current minimal output; ensure matcher does not slow down jobs noticeably.

## Definition of Done
- Inline annotations appear for any future violations without increasing runtime materially.

