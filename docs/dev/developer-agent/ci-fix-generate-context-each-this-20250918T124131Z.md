# CI fix: generate_context each/this regression (issue #920)

## Context

- Failing test: `test/generateContext.test.ts`
- Symptom: `{{ this }}` inside `{{#each}}` renders `[object global]`.
- Root cause: Expression evaluator uses `new Function` without binding `this`, so bare `this` resolves to the global in Node.

## Plan

- Bind `this` in `evalExpr()` to the per-iteration item (`ctx.vars.this`).
- Keep expression parameters unchanged for `event`, `env`, `vars`, `include`.
- Verify unit test passes and run targeted suite.

## Notes

- This preserves Handlebars-like `{{ this }}` semantics for loop body.
- No template syntax changes required.

## Results

- Applied fix in src/generateContext.ts
- Vitest: 179 passed, 1 skipped
- PR: https://github.com/a5c-ai/events/pull/922
