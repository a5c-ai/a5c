# Work Log – Issue #143 – Token precedence and redaction

## Scope
- Document token precedence (A5C_AGENT_GITHUB_TOKEN over GITHUB_TOKEN)
- Document masking/redaction behavior with examples
- Add unit tests: loadConfig precedence; enrich output redaction

## Plan
1. Add docs page under technical-specs/integrations/github-actions.md linking to a new page with details and examples
2. Tests:
   - src/config.ts: simulate env and assert precedence
   - src/enrich.ts: run handleEnrich for sample events; ensure redactObject masks token-like strings in output
3. Open PR, run CI, iterate

## Notes
- Redaction logic lives in src/utils/redact.ts; CLI applies redactObject on output before writing.
