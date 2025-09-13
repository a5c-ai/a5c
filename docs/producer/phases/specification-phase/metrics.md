# Specification Phase – Metrics

Operational and product metrics to validate the MVP. Targets reflect `docs/specs/README.md#8-performance-targets-and-constraints` and BDD outlines.

## Performance
- Normalization latency (p50/p95)
  - Target: <200ms p50 simple payloads; <2s p95 large `workflow_run`.
  - Measure: `/usr/bin/time -f "%E %M" npx @a5c-ai/events normalize --in payload.json > /dev/null`.
- Enrichment latency (p50/p95)
  - Target: <1.5s p95 for typical PR with <=50 changed files.
  - Measure: `events enrich --in pr.json` with sampling.
- Memory usage (RSS)
  - Target: <128MB typical; stream large payloads.
  - Measure: time output memory column or `NODE_OPTIONS=--trace-gc` sampling.
- Throughput (CI)
  - Target: 100 events/min sequential in CI job.
  - Measure: run batch normalize in GH Actions and record rate.
- Artifact size
  - Target: <512KB per normalized JSON by default.
  - Measure: `wc -c out.json`.

## Quality
- Mention extraction precision/recall
  - Target: ≥0.95 precision, ≥0.90 recall on labeled samples.
  - Measure: compare `enriched.mentions[]` to ground truth fixtures.
- Field coverage
  - Target: ≥95% of NE required fields populated for supported event types.
  - Measure: schema check; count missing fields per batch.
- Redaction effectiveness
  - Target: 0 leaked secrets in logs/artifacts.
  - Measure: secret scanners over logs/artifacts in CI.

## Process
- Build success rate
  - Target: ≥99% over rolling 30 days.
- Lint/format cleanliness
  - Target: 0 errors; warnings allowed only for TODO‑tagged rules.
- Docs freshness
  - Target: Specs and examples updated every release; no file older than 2 releases without review tag.

## Example Commands
```bash
# Normalize a sample
npx @a5c-ai/events normalize --in samples/workflow_run.completed.json --out out.json
jq '.type, .repo.full_name, .provenance.workflow.name' out.json

# Enrich and select key fields
npx @a5c-ai/events enrich --in samples/pull_request.synchronize.json \
  --select type,repo.full_name,enriched.github.pr.mergeable_state > out.json
jq '.enriched.github.pr.has_conflicts' out.json
```

## Links
- Specs: docs/specs/README.md
- Acceptance tests: docs/specs/README.md#9-acceptance-tests-bdd-outline
- Performance: docs/specs/README.md#8-performance-targets-and-constraints
