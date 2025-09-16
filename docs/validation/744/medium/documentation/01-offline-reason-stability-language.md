# Validator: Offline reason stability language conflicts

- Scope: docs
- Severity: medium (non-blocking)

Quick Start now documents the offline GitHub enrich reason as a canonical, stable value: `flag:not_set`.
However, CLI Reference currently states that the exact value is implementation-defined and may evolve (see docs/cli/reference.md around lines 142–146).

These two statements conflict. Recommend unifying the language:

- Preferred: "The canonical offline reason is `flag:not_set` and is stable across minor versions."
- Alternatively: remove "implementation-defined" phrasing and reference the canonical value.

This does not block the current PR; Quick Start is correct per current runtime and tests.
