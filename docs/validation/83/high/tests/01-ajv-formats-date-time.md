# [High] Tests - Enforce date-time format validation with Ajv

### Context
Current NE schema uses `format: "date-time"` for `occurred_at`. During tests, Ajv 2020 logs:

> unknown format "date-time" ignored in schema at path "#/properties/occurred_at"

This means `date-time` is not actually validated (Ajv core doesn’t bundle formats by default), so malformed timestamps would still pass.

### Impact
- Reduces confidence in schema validation (silent acceptance of bad timestamps)
- Potential downstream parsing/ordering issues if invalid datetimes slip through

### Suggestion
- Add `ajv-formats` devDependency and enable it in tests that compile NE schema.

Example (tests/normalize.test.ts):

```ts
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)
```

Optionally also set `ajv.opts.validateFormats = true` (default), or explicitly configure to error on unknown formats in future.

### Priority
High (non-blocking) — improves test rigor without impacting runtime behavior.

