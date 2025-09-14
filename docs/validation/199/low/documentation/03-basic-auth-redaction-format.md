# [Docs] Consider preserving URL scheme in basic-auth redaction

- Category: documentation
- Priority: low
- Context: PR #199

## Summary
Current redaction replaces `https://user:pass@` with `REDACTED`, yielding outputs like `REDACTEDexample.com/path`. Consider an alternative that preserves the scheme and separator for readability, e.g., `https://REDACTED@example.com/path`.

## Notes
- Would require updating tests if adopted.
- Current behavior is acceptable/security-safe; this is a UX/readability improvement.
