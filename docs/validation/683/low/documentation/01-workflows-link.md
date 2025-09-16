# [Low] PR Template — link to workflows folder

Category: documentation

Summary

In `.github/PULL_REQUEST_TEMPLATE.md`, the line:

- `CI: .github/workflows/`

is plain text. Converting it to a clickable link will improve discoverability. Suggested change:

```md
CI: [workflows](../.github/workflows/)
```

Notes

- Non-blocking; current text is adequate.
