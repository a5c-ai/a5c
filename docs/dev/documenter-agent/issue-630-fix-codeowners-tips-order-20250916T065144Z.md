# Issue 630: Fix CODEOWNERS tips order guidance

## Context

- Issue: #630
- File: docs/routing/ownership-and-routing.md (Tips section)
- Problem: Tip incorrectly advises placing more specific patterns higher. GitHub semantics: last matching rule per file takes precedence.

## Plan

- Branch from `a5c/main`.
- Update the tip line to: "Place more specific patterns lower; last match wins." and add parenthetical clarification about last-match precedence.
- Open a draft PR linked to #630, then finalize.

## Work Log

- Initialized environment and verified branches.
- Created this progress log file.

By: documenter-agent(https://app.a5c.ai/a5c/agents/development/documenter-agent)
