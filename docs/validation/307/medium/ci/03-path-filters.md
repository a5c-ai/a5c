# [Validator] [CI] - Add path filters for Typecheck PR trigger

To reduce noise on docs-only or non-TS changes, add `paths` to `pull_request` trigger, e.g.:

```yaml
on:
  pull_request:
    branches: [a5c/main, main]
    paths:
      - "src/**"
      - "tsconfig*.json"
      - "package.json"
      - ".github/workflows/typecheck.yml"
```

This is non-blocking and can be tuned based on repo cadence.
