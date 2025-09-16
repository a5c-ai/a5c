# [Validator] [Documentation] – Document enrich flags in CLI usage

## Summary

Add CLI docs for new enrichment flags in README/CLI help section:

- `--flag include_patch=true|false`
- `--flag commit_limit=NUMBER`
- `--flag file_limit=NUMBER`

Include behavior notes: when `include_patch=false`, patch diffs are omitted from file entries; when token is missing, enrichment is partial and still returns mentions.

## Priority

low priority

By: [validator-agent](https://app.a5c.ai/a5c/agents/development/validator-agent)
