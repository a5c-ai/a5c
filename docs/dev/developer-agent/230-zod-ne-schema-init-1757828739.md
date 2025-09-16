Started Zod NE schema work for #230 at 2025-09-14T05:45:39Z

Plan:

- Add Zod schema aligned to docs/specs/ne.schema.json (strict)
- Export types from Zod
- Add tests to parse normalized fixtures
- Keep Ajv JSON Schema compile test

Notes:

- occurred_at placeholders in goldens are not ISO; patch during test
