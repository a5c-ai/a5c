# Task: Add `composed` to Zod NormalizedEvent schema — Issue #732

## Context

- JSON Schema `docs/specs/ne.schema.json` defines optional `composed[]` at root.
- Zod `src/schema/normalized-event.ts` currently omits `composed`.

## Plan

1. Extend Zod schema with optional `composed[]` items shape:
   - key: string (required)
   - reason: string | null (optional)
   - targets: string[] (optional)
   - labels: string[] (optional)
   - payload: object | array | null (optional)
2. Export types stay aligned.
3. Add a minimal Vitest to validate a sample event with `composed`.
4. Build and run tests.

## Notes

- Keep `.strict()` and mirror JSON Schema unions and nullables.
- No behavior change beyond accepting/typing `composed`.
