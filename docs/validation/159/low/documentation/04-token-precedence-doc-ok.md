# [Low] Token precedence documented and implemented

Category: documentation
Priority: low priority

The README documents token precedence (A5C_AGENT_GITHUB_TOKEN over GITHUB_TOKEN). Implementation in `src/config.ts` matches this behavior:

```ts
githubToken: process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN
```

No action needed; included here to record validation.

References:
- README.md (token precedence)
- src/config.ts

