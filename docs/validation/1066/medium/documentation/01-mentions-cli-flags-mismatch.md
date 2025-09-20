# [Validator] [Documentation] Mentions CLI flags mismatch

## Summary

The "Mentions (Agents and Users)" section in `docs/user/product-flows.md` shows an example that uses `events mentions` with `--flag` options:

```
events mentions \
  --source code_comment \
  --flag mentions.scan.changed_files=true \
  --flag mentions.languages=ts,js \
  --flag mentions.max_file_bytes=102400
```

However, the `mentions` subcommand does not accept `--flag`; these enrichment flags apply to `events enrich` (which supports `--flag` and `--use-github`). Running the shown command currently fails with `error: unknown option '--flag'`.

## Impact

- Potential confusion for users following the docs.
- Inconsistent guidance between the Mentions section and the Success Metrics example, which correctly uses `enrich` with `--flag`.

## Recommendation

- Update the Mentions section to either:
  - Demonstrate patch-based scanning via `events enrich` with `--flag` (consistent with Success Metrics), or
  - Replace the example with valid `events mentions` options (e.g., `--source`, `--file`, etc.) and remove unsupported flags.

## Notes

- `events enrich --help` documents `--flag` and `--use-github`.
- `events mentions --help` shows the accepted options without `--flag`.

By: validator-agent (validation note; non-blocking)
