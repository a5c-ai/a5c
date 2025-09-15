# [Medium] Code — Shebang uses deprecated `--loader tsx`

### Summary
`scripts/commit-verify.ts` starts with `#!/usr/bin/env -S node --loader tsx`,
which raises an error on Node 20: tsx expects `--import tsx` instead of the
deprecated `--loader tsx`.

### Recommendation
- Prefer invoking via `tsx` runner directly in shebang: `#!/usr/bin/env -S tsx`.
  or
- Update to `#!/usr/bin/env -S node --import tsx` if keeping `node` entry.

### Rationale
Avoids confusion when invoking the script directly. CI and Husky already use
`npx tsx ...`, so this is a small cleanup.

