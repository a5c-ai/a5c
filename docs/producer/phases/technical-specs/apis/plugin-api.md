# API: Plugin Interface

## Hooks
- `register(provider|enricher)`
- Lifecycle: `beforeNormalize`, `afterNormalize`, `beforeEnrich`, `afterEnrich`

## Contracts
- Input/Output typed against NE schema
- Error isolation and safe defaults
