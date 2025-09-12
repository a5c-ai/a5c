# Component: Core Library

## Modules
- Normalizer: providers -> NE schema
- Enricher: metadata, derived, correlations
- Schema: zod/io-ts validators for NE
- Select/Filter: JMESPath or JSONPath-like utilities
- Redaction: secret scrubbing

## Extensibility
- Hook system: `beforeEnrich`, `afterEnrich`, `composeEvents`
- Policy interface for routing decisions (phase 2)
