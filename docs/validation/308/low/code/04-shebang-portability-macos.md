# [Validator] [Code] Shebang portability on macOS

### Context

- PR: #308
- File: `scripts/commit-verify.ts`

### Finding

The script uses the shebang `#!/usr/bin/env -S tsx`. The `-S` option is supported on GNU coreutils `env` but is not universally available on BSD/macOS environments. While the Husky hook invokes `tsx ...` directly (so the shebang is not relied upon), direct execution of the script on macOS may fail.

### Recommendation

- Keep the current Husky and CI invocation as-is.
- Optionally change the shebang to a more portable variant, or omit reliance on the shebang by always invoking via `tsx`:
  - Example shebang alternative: `#!/usr/bin/env node` and call `tsx` explicitly when running TypeScript, or compile to JS for direct execution.

### Rationale

- Improves cross-platform developer ergonomics without impacting CI.

Priority: low
