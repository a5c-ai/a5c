# [Tests] Expand Slack token variants and contexts

- Category: tests
- Priority: low
- Context: PR #199

## Summary
Extend redaction tests to cover additional Slack token prefixes and inline contexts:
- Variants: `xoxp-`, `xoxa-`, `xoxs-` (pattern already supports `[abprs]`)
- Contexts: tokens embedded in longer strings, JSON values, headers

## Proposed Tests
- `redactString('Bearer xoxp-...') => 'Bearer REDACTED'`
- `redactObject({ token: 'xoxa-...' }) => { token: 'REDACTED' }`
