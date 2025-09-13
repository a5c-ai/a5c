# [Validator] Functionality - Branch protection flags: status checks detail

### Summary
`branch_protection.flags.has_required_status_checks` is set based on object presence only. Contexts and enforcement mode (strict) are not surfaced.

### Recommendation
- Consider adding `required_status_checks.strict` and `required_status_checks.contexts.length` (or a boolean `has_contexts`) to improve signal, while keeping the concise `flags` shape.

### Context
- File: `src/enrichGithubEvent.js`

### Priority
low priority
