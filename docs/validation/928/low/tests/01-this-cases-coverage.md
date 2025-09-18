# [Low][Tests] Expand coverage for `this` usage in templates

### Context

`preprocess()` maps leading `this` to `thisArg`. The new test covers top-level `{{ this }}`. Additional patterns merit coverage.

### Suggestions

- Add tests for: `{{#each arr}}{{ this['k'] }}{{/each}}`, `{{#each arr}}{{ this.k }}{{/each}}`, and `{{#each arr}}{{ (this) }}{{/each}}`.
- Include cases where `this` appears after whitespace and within nested expressions.

### Acceptance Criteria

- Tests pass consistently on Node 20/22 across OS runners.
