## [Medium] Refactoring — Use fileURLToPath in getVersionSync

### Context
`src/version.ts` resolves `import.meta.url` with `new URL(...).pathname` and then walks up to find `package.json`. Using `pathname` can mis-handle percent-encoded characters and Windows drive letters.

### Recommendation
Use `fileURLToPath(import.meta.url)` from `node:url` for robust cross-platform path resolution, then `path.dirname()`.

### Suggested Change
```ts
// src/version.ts
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
let dir = path.dirname(__filename)
```

This avoids issues with spaces/Unicode and Windows paths.

### Rationale
Improves reliability for consumers installing under paths with spaces or on Windows.

