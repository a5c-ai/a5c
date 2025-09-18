# [Medium] CI - Include architecture in cache key

### Context
The workflow caches `~/.cache/lychee` with key `${{ runner.os }}-lychee-v0.15.1`. The binary selected depends on both OS and ARCH (e.g., `x86_64` vs `arm64`).

### Recommendation
- Include `${{ runner.arch }}` (or equivalent) in the cache key to avoid accidental cache reuse if GitHub runners change architecture.

### Suggested key
`${{ runner.os }}-${{ runner.arch }}-lychee-v0.15.1`
