# [Low] Documentation — Deduplicate Mentions Flags in CLI Reference

File: docs/cli/reference.md

The `events enrich` section lists mentions scanning flags twice:

- Under the main flags list ("Mentions scanning flags")
- Again under a separate subsection ("Mentions scanning (code comments in changed files)")

Impact: Minor duplication that could drift over time.

Proposed fix: Keep a single canonical list and cross‑reference examples. Remove the second duplicated block or replace with a short pointer.
