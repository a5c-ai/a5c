# Fix CODEOWNERS tip order guidance (Issue #630)

## Context

- File: docs/routing/ownership-and-routing.md (Tips section)
- Problem: Says "Place more specific patterns higher; last match wins." which contradicts GitHub semantics — last match per file wins, so specific patterns should be later (lower).

## Plan

1. Update tip to: "Place more specific patterns lower; last match wins."
2. Add parenthetical: "Order matters; the last matching rule per file takes precedence."
3. Create PR targeting `a5c/main`, link to issue #630, and request validation.

## Notes

No code changes; docs-only.

## Implementation

- Updated `docs/routing/ownership-and-routing.md` tip:
  - Now: "Place more specific patterns lower; last match wins. (Order matters; the last matching rule per file takes precedence.)"

## Verification

- Ran prettier via precommit hooks; docs formatting OK.
- No code changes; no impact on tests.

## PR

- See PR https://github.com/a5c-ai/events/pull/657 (targets `a5c/main`).
