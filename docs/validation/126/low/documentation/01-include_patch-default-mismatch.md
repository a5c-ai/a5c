# include_patch default mismatch (spec vs code)

### Context
- PR: #126 adds tests for `include_patch` behavior without changing defaults.
- Spec (docs/specs/README.md) states: `include_patch` default is `false` with guidance about potential secrets and size caps.
- Implementation (src/enrich.ts) currently defaults to `true` via `toBool(opts.flags?.include_patch ?? true)`.

### Risk / Impact
- Default-on patches may increase payload size and surface sensitive diffs. While redaction and limits exist in parts of the system, default should align with spec and principle of least exposure.

### Recommendation
- Align default to `false` and ensure docs/CLI help clearly describe behavior.
- Keep ability to opt-in per run using `--flag include_patch=true`.
- Consider adding an integration test that validates default behavior when the flag is omitted.

### References
- docs/specs/README.md (defaults section for `include_patch`)
- src/enrich.ts (default evaluation)
- Follow-up tracking: issue #128

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)

