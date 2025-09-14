# Technical Specs – Phase Checklist

Track readiness of the Technical Specifications phase. Check items when complete and verified on `a5c/main`.

- [x] Tech stack decided and documented — see docs/producer/phases/technical-specs/tech-stack.md
- [x] NE schema validation strategy defined (Ajv + formats) — see tests/ne.schema.compile.test.ts and docs/specs/ne.schema.json
- [x] Provider adapter (GitHub) mapping MVP implemented — see src/providers/github/map.ts and docs/producer/phases/technical-specs/events/input-mapping.md
- [x] Enrichment flags and bounds set (commit/file limits; patch toggle) — see src/enrich.ts
- [x] CLI commands documented with parity to code (normalize, enrich, mentions) — see docs/producer/phases/technical-specs/apis/cli-commands.md and src/cli.ts
- [x] Emit command implemented and documented — see docs/producer/phases/technical-specs/apis/cli-commands.md and src/emit.ts
- [x] CI workflows present and green on a5c/main (lint, tests) — see .github/workflows/*.yml
- [x] Release workflow configured (semantic-release) and publishing targets set — see package.json and .github/workflows/release.yml
- [x] Cross-links from specs overview to technical-specs index — see docs/specs/README.md and docs/producer/phases/technical-specs/README.md
- [x] Integration points defined (GitHub Actions/webhooks/MCP) — see docs/producer/phases/technical-specs/integrations/*.md
- [x] Data models outlined (Normalized Event, Enrichment Types) — see docs/producer/phases/technical-specs/data-models/*.md

Notes:
- When the Emit command is implemented and verified in CI, mark it complete.
- Before advancing phase, verify CI green for `a5c/main` latest.

See also: docs/specs/tech-specs.md
