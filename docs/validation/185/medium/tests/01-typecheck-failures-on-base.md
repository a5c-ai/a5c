# Typecheck Failures on Base Branch

Priority: medium priority
Category: tests

The TypeScript `typecheck` step fails on `a5c/main` due to test typings and object shapes (Vitest globals, inferred `{}` types). This is not introduced by this PR and is reproducible on the base branch.

Suggested improvements:

- Configure Vitest types in `tsconfig.json` (e.g., `types: ["vitest"]` under `compilerOptions` with test include patterns)
- Refine test helper types to avoid `{}` leakage
- Consider a dedicated `tsconfig.test.json` for test type checking

Context: Validator ran `npm run typecheck` on base and PR branches; failures are pre-existing on base. Unit tests themselves pass in Vitest.
