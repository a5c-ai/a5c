# Escape pretty-mode messages for GitHub Actions annotations

Priority: medium priority
Category: logging

## Summary

When `A5C_LOG_FORMAT=pretty` in GitHub Actions, the logger prefixes lines with `::notice::`, `::warning::`, `::error::`, or `::debug::`. If `msg` or interpolated context contains characters like newlines, percent signs, or `::`, GitHub may parse these in unexpected ways. While current usage is simple and low risk, escaping would harden output and avoid edge cases.

## Suggested Improvements

- Implement minimal escaping for annotation message content per Actions command format guidance. At least normalize newlines to `\\n` and strip CR characters.
- Consider limiting or sanitizing control sequences when in Actions environment.
- Add a small unit test to verify escaping is applied when `GITHUB_ACTIONS=true`.

## References

- GitHub Actions workflow command syntax and escaping rules.
