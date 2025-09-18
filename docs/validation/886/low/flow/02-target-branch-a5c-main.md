---
title: Prefer a5c/main as PR base for development
priority: low
category: flow
---

Context: This PR targets `main`, while our repo guidance treats `a5c/main` as the development/staging branch and `main` as production.

Recommendation:

- For future development PRs, prefer `a5c/main` as the base. Reserve `main` for releases or promotion from `a5c/main`.

Note: This PR is safe to merge to `main` as tests are green and the changes are additive, but aligning future work reduces risk.
