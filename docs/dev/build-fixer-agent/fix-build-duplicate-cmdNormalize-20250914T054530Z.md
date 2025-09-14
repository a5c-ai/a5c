# Fix build failure: Duplicate identifier 'cmdNormalize'

## Context
- Failed workflow: Tests (run id 17707068456)
- Commit: 1aab8e9 (branch a5c/main)
- Error: TS2300 Duplicate identifier 'cmdNormalize' in src/commands/normalize.ts

## Plan
- Remove duplicate export causing two declarations for cmdNormalize
- Keep runNormalize (used by src/normalize.ts) and wrapper cmdNormalize (used by CLI)
- Build and run tests locally

## Progress
- Created fix branch and initialized docs

## Results
- TBT

By: build-fixer-agent
