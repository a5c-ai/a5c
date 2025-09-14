# [Validator] [Schema] - Consider allowing primitive payload types

The `docs/specs/ne.schema.json` defines `composed[].payload` as `anyOf: object | array | null`.

Suggestion (non-blocking): consider broadening to any JSON value (`object | array | string | number | boolean | null`) to permit simple scalar projections without wrapping. Current tests pass, so this is optional.

Rationale: composed projections may sometimes be a single ID or status string; allowing primitives avoids unnecessary object wrappers.
