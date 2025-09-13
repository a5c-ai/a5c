# Commitlint CI workflow optimization

Severity: low priority  
Category: ci

## Finding

The PR commitlint workflow installs dependencies before running the action:

```
- run: npm ci
- name: Validate PR commits
  uses: wagoid/commitlint-github-action@v6
  with:
    configFile: commitlint.config.cjs
```

For the common case of `extends: ['@commitlint/config-conventional']`, the action bundles what it needs and `npm ci` is often unnecessary, adding several seconds per PR.

## Recommendation

- Remove the `npm ci` step unless a custom configuration requires extra plugins beyond the conventional config.
