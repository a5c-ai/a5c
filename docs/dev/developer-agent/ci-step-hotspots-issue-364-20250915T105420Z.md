# CI step hotspots - plan

- Goal: Annotate long-running steps with check-run annotations and add p95 table to step summary.
- Approach:
  - Add composite action `.github/actions/step-hotspots` that parses job log timing lines and/or accepts an explicit timings JSON.
  - Compute per-step durations, p95, and thresholds from env (`HOTSPOTS_WARN_MS`, `HOTSPOTS_ERROR_MS`).
  - Emit GitHub workflow commands `::warning`/`::notice` with `file`/`line` when possible; otherwise plain annotations with step names.
  - Append a markdown table to `$GITHUB_STEP_SUMMARY` and optionally write `hotspots.json` artifact.
  - Wire into `tests.yml` and `typecheck.yml` as a final step.
- Notes:
  - Fallback to scan `run.log` if present for "Run <step>" and duration patterns.
  - Keep noise low: only top N slow steps (default 5) and above threshold.
