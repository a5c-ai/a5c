# [Validator] [Tests] - Add Ajv example validation script

Add an npm script to validate a concrete example file against the schema, e.g.:

```
ajv -s docs/specs/observability.schema.json -d docs/examples/observability.json --spec=draft2020 -c ajv-formats
```

Also add or ensure `docs/examples/observability.json` exists and matches v0.1.

Scope: Non-blocking.
