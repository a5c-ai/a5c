# [High] CLI Reference — `--select`/`--filter` not implemented

Category: documentation
Priority: high priority

The CLI reference in `docs/cli/reference.md` documents `--select` and `--filter` flags for both `normalize` and `enrich`, but the current CLI implementation (`src/cli.ts`) does not define or implement these flags.

Impacts:
- Users following the docs will expect functionality that is not present, leading to errors.

Recommendations:
- Either remove or clearly mark these flags as “planned” with no current effect, or implement them before publishing the docs.
- If kept as planned, provide examples without these flags to avoid confusion.

References:
- docs/cli/reference.md
- src/cli.ts (commands `normalize` and `enrich`)

