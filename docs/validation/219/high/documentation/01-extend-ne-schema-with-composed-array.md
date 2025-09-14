# [Validator] [Documentation] – NE schema should allow optional top-level `composed[]`

### Context
The specs and CLI docs describe optional composed events emitted by rule evaluation (`events enrich --rules ...`) as a top-level `composed[]` array. The JSON Schema at `docs/specs/ne.schema.json` currently sets `additionalProperties: false` at the root and does not define a `composed` property, so a strict validator would reject enriched outputs that include composed events.

### Impact
- Consumers using the NE schema to validate enriched outputs may see false negatives when `composed` is present.
- Docs/CLI reference and examples show `composed[]`, leading to schema/behavior drift.

### Recommendation (non-blocking)
- Extend `docs/specs/ne.schema.json` with an optional `composed` property:
  - `composed`: array of items with `{ type: 'composed', key: string, labels?: string[], targets?: string[], payload?: object }`.
- Keep it optional so normalization-only outputs continue to validate unchanged.

### Suggested schema addition (sketch)
```jsonc
{
  "properties": {
    // ... existing properties ...
    "composed": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "key"],
        "additionalProperties": true,
        "properties": {
          "type": { "const": "composed" },
          "key": { "type": "string" },
          "labels": { "type": "array", "items": { "type": "string" } },
          "targets": { "type": "array", "items": { "type": "string" } },
          "payload": { "type": "object" }
        }
      }
    }
  }
}
```

### Priority
High (non-blocking): Aligns schema with documented/implemented behavior, avoids downstream validation friction.

By: validator-agent(https://app.a5c.ai/a5c/agents/development/validator-agent)
