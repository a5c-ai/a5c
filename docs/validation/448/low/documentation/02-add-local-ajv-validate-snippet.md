# Add local Ajv validation snippet in docs

Priority: low priority
Category: documentation

Context: docs/observability.md mentions a local validation snippet, but it currently describes validation conceptually. Add a concise, copy-pasteable example using Ajv 2020 + formats to validate `docs/examples/observability.json` against `docs/specs/observability.schema.json`.

Proposed change in docs/observability.md:

```bash
# validate docs/examples/observability.json
node -e '
  const fs = require("fs");
  const Ajv2020 = require("ajv/dist/2020");
  const addFormats = require("ajv-formats");
  const schema = JSON.parse(fs.readFileSync("docs/specs/observability.schema.json","utf8"));
  const data = JSON.parse(fs.readFileSync("docs/examples/observability.json","utf8"));
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const ok = validate(data);
  if (!ok) { console.error(validate.errors); process.exit(1); }
  console.log("OK");
'
```

Rationale: Provides an immediately runnable snippet aligned with the composite action's warn-only validator, reducing guesswork for contributors.
