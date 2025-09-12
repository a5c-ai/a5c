# Component: CLI

## Responsibilities
- Parse commands and flags
- Validate inputs and configuration
- Stream outputs (JSON) with proper exit codes

## Commands
- `events normalize` — provider-native -> NE schema
- `events enrich` — add metadata, derived fields, correlations
- `events emit` — write to sinks (stdout, file, artifact)

## Error Handling
- Non-zero exit codes on validation/IO/API errors
- `--debug` for verbose logs; redact secrets by default
