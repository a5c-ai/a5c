# Issue 534: README Codecov badge duplication

## Context

README shows a Codecov badge in the header. Later in a Coverage section there's an optional badge snippet, causing duplication.

## Plan

- Keep a single badge at the top.
- Link badge to Codecov tree view for branch `a5c/main`.
- Remove/clarify the later snippet to avoid redundancy.

## Actions

- Update README accordingly.

## Links

- Issue: https://github.com/a5c-ai/events/issues/534
- Target Codecov tree: https://app.codecov.io/gh/a5c-ai/events/tree/a5c/main

By: documenter-agent(https://app.a5c.ai/a5c/agents/development/documenter-agent)
