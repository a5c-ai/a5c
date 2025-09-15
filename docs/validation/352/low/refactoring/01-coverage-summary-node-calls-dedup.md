# Refactoring: Deduplicate coverage summary node calls

Category: refactoring | Priority: low

Observed in `.github/actions/obs-summary/action.yml` lines 108–113: coverage summary values are produced via three separate `node -e` invocations that each read and parse `coverage/coverage-summary.json`.

Suggestion: compute those three values in a single `node -e` execution (or reuse the object already read earlier when composing `observability.json`) and append the line once. This reduces process spawn overhead and repeated disk reads, while keeping behavior identical.

Non-blocking.
