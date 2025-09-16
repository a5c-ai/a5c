# Fix: CLI enrich should evaluate rules and emit composed events

Context: Build workflow failed on a5c/main due to tests/cli.rules-composed.test.ts failing. Root cause: CLI `enrich` path (cmdEnrich) did not evaluate `--rules` to produce `.composed`.

Plan:

- Update src/commands/enrich.ts to evaluate rules via evaluateRulesDetailed and attach `composed` + `enriched.metadata.rules_status`.
- Verify locally by running the test scenario from the spec.
- Open PR against a5c/main with details linking failing run.
