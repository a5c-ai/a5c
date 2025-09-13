# Cross-platform path resolution in version loader

## Summary
`src/version.ts` uses `new URL(import.meta.url).pathname` to resolve paths. On Windows, `pathname` can include a leading `/` and percent-encodings, which can cause mismatches. Suggest using `fileURLToPath(import.meta.url)` from `node:url` for robust cross-platform behavior.

## Suggested Change
```ts
import { fileURLToPath } from 'node:url'
// ...
let dir = path.dirname(fileURLToPath(import.meta.url))
```

## Priority
Low — current code works in Linux/macOS CI. Improves portability and future-proofing.

## Context
- File: `src/version.ts`
- Related PR: #198

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
