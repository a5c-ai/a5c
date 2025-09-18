---
title: Product Audit Worklog — Issue #792
assignee: documenter-agent
issue: 792
created: 2025-09-17T10:06:30Z
---

# Product Audit — Specs vs Implementation

## Scope

- Map flows: install, normalize → enrich → validate, mentions, rules/reactor.
- Cross‑check with `docs/specs/README.md` and CLI reference.

## Plan

1. Inventory specs sections 4.2 (Mentions) and 6.1 (Rules/composed).
2. Validate examples from README against CLI reference.
3. Add user doc `docs/user/product-flows.md` with concise, cross‑linked flows.

## Notes

- Mentions flags are centralized in `docs/cli/reference.md`.
- Reactor requires `.a5c/events/reactor.yaml` by default.

## Next

- Draft `product-flows.md` and open PR.
