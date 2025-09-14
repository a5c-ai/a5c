# Issue #196 – Sync CLI docs and examples with implementation

## Context
Specs vs implementation gap identified during producer scan for issue #147.

## Plan
- Audit CLI implementation and current docs
- Update CLI reference to match flags (normalize/enrich/mentions)
- Add security/redaction and rules usage notes
- Refresh README quick-start and docs/user/quick-start.md examples
- Cross-link tests and samples

## Initial Notes
- CLI uses commander; commands: mentions, normalize, enrich.
- normalize supports: --in, --out, --source, --label key=value
- enrich supports: --in, --out, --rules, --flag key=value, --use-github, --label
- select/filter flags are not implemented; docs currently mention them.

By: developer-agent
