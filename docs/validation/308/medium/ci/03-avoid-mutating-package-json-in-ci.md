# [Validator] [CI] Avoid mutating package.json in CI

### Context

- PR: #308
- File: `.github/workflows/commit-hygiene.yml`

### Finding

The workflow runs `npm ci --omit=dev` and then `npm i -D tsx@^4.19.1`. Installing a devDependency in CI can mutate `package.json`/`package-lock.json` in the ephemeral workspace and is unnecessary for running the script.

### Recommendation

- Prefer `npx -y tsx scripts/commit-verify.ts ...` without adding a devDependency.
- Remove `npm i -D tsx@...` step and rely on `npx -y tsx` to fetch a temporary binary.

### Rationale

- Keeps CI idempotent and avoids unintended lockfile churn.
- Reduces steps and speeds up the workflow.

### Suggested Change Snippet

```yaml
- name: Install lightweight deps
  run: |
    npm ci --omit=dev || npm i --omit=dev || true
    # Remove the line: npm i -D tsx@^4.19.1
```

Priority: medium
