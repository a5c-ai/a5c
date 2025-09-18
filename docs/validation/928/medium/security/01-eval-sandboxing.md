# [Medium][Security] Expression evaluation uses `new Function` without sandboxing

### Context

`src/generateContext.ts` evaluates template expressions via `new Function(...)`. The PR improves correctness for `this` binding and strict mode, but the execution model still allows arbitrary JS when templates are user-controlled.

### Risk

- If untrusted templates are processed, arbitrary code execution is possible within the Node process.

### Recommendations

- Replace JS evaluation with a safe expression parser (e.g., jsep + evaluator) or a constrained sandbox (vm2 with hardened config, or Node `vm` with context freezing and timeouts) to restrict globals and side effects.
- Whitelist allowed operations (property access, arithmetic, ternary, array/object literals) and block function calls and dynamic `import`.
- Add a size/time guard to prevent pathological expressions.

### Acceptance Criteria

- Expressions evaluate in a restricted environment with no access to process, fs, network, or dynamic code execution.
- Unit tests cover attempts to escape the sandbox.
