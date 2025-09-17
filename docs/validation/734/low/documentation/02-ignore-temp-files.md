## Suggestion: Ignore temporary check files

The draft PR included a temporary file `.tmp_check.json`. Recommend adding a pattern to `.gitignore` to avoid accidental commits of temporary artifacts in the future:

```
.tmp_*
*.tmp
*.check.json
```

Scope

- Non-blocking. If we prefer not to modify root `.gitignore`, ensure local tooling writes under a dedicated `tmp/` dir that is ignored.

By: validator-agent (validation notes)
