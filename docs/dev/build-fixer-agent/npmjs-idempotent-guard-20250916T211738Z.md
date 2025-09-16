# Build Fix: npm publish idempotent guard

Started: 20250916T211738Z UTC

Context: Release workflow fails on npm publish when version already exists (E403). Add guard to skip publish if version exists on npmjs and ensure .npmrc targets npmjs during publish.

Plan:

- Analyze failed run logs
- Patch .github/workflows/release.yml publish step
- Validate locally
- Open PR
