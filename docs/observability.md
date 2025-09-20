# Observability for @a5c-ai/events (SDK/CLI)

This discovery doc proposes a minimal, pragmatic observability plan for consumers of this package (CLI users and SDK integrators). It focuses on structured logging, optional tracing hooks, and error reporting integration without forcing extra runtime dependencies.

## Artifact schema

The CI workflows emit an `observability.json` artifact. Schema is versioned (`schema_version: "0.1"`) and evolves additively. The formal JSON Schema lives at `docs/specs/observability.schema.json`.

Versioning policy:

- Use a SemVer-like string for `schema_version` (e.g., `0.1`, `0.2`).
- Minor bumps are additive and backward-compatible (new optional fields).
- Breaking changes require a major bump (e.g., `1.0`) and migration notes.
- Producers pin the intended `schema_version`; consumers may validate accordingly.

- Top-level fields: `repo`, `workflow`, `job`, `run`, `metrics`
- `run`: `id`, `attempt`, `sha`, `ref`, `actor`, `event_name`, `conclusion`, `started_at`, `completed_at`, `duration_ms`
- `metrics.coverage`: Vitest coverage-summary JSON embedded under `total`
- `metrics.cache`: `entries[]` (`kind`, `hit`, optional `key`, optional `bytes`) and `summary` (`hits`, `misses`, `total`, `hit_ratio`, `bytes_restored_total`)

Example: see `docs/examples/observability.json`. The example is intended to validate against the JSON Schema.

### Dashboard and Export Options

- Artifact is uploaded as `observability` in Actions run artifacts. It can be consumed by external dashboards or GH Insights.
- For programmatic sinks, a follow-up can aggregate per-job artifacts into an `observability.aggregate.json` and publish via `actions/upload-artifact` or repository-level releases.

When multiple jobs or a matrix run produce per-job artifacts, an aggregate artifact `observability.aggregate.json` may be produced with:

- `metrics.cache.overall`: `hits`, `total`, `hit_ratio`, `bytes_restored_total`
- `metrics.cache.by_kind[]`: per cache kind rollups with the same fields

### Validation

- The composite action `.github/actions/obs-summary` writes the file through a central composer that emits `schema_version`.
- Optional schema validation can be enabled with `VALIDATE_OBS_SCHEMA=true` (warn-only) when using the composite action.

## Goals

- Provide clear guidance for JSON structured logs with levels and correlation ids.
- Offer optional OpenTelemetry hooks for spans/attributes without hard runtime coupling.
- Document patterns for error capture (Sentry/GlitchTip) in downstream apps.
- Keep the core package light: no hard dependency on logging/tracing vendors.

## Non‑Goals

- Implement full logging or tracing backends in this PR.
- Replace app observability; this package should integrate into host pipelines.

## Structured Logging

- Default CLI output is `pretty` for humans; prefer JSON in CI (`--log-format=json` or `A5C_LOG_FORMAT=json`). SDK consumers can inject their logger.
- Suggested fields: `ts` (ISO), `level`, `msg`, `event`, `corr` (correlation id), `ctx` (small object), `error`.
- Levels: `debug`, `info`, `warn`, `error`.
- Correlation ids:
  - Honor existing ids from environment: `GITHUB_RUN_ID`, `GITHUB_WORKFLOW`, `GITHUB_REF`, `TRACE_ID`, `REQUEST_ID`.
  - Allow override via `A5C_CORRELATION_ID`.

### CLI Behavior

- Implemented: Global flags and env toggles control CLI logging.
  - `--log-format <pretty|json>` ↔ `A5C_LOG_FORMAT`
  - `--log-level <info|debug|warn|error>` ↔ `A5C_LOG_LEVEL`
- Defaults: `pretty` format for humans, `info` level. In CI, prefer `--log-format=json` (or `A5C_LOG_FORMAT=json`).

### SDK Integration

Provide a tiny interface consumers can satisfy with their logger of choice (pino, loglevel, console):

```ts
export interface LoggerLike {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}
```

Consumers pass a `LoggerLike` to APIs; when omitted, a default console-based logger is used. When `A5C_LOG_FORMAT=json`, the CLI’s default logger emits JSON lines with the fields above.

## Tracing (OpenTelemetry)

- Make tracing optional via peer/optional dependency: `@opentelemetry/api`.
- When present, create spans around key operations (parse → normalize → enrich → output) with attributes like `repo`, `event.name`, `event.sha`, `provider`.
- Respect existing context (if a tracer provider is already registered in the host app).
- If `@opentelemetry/api` is not installed, all tracing hooks no-op safely.

### Sample Usage (SDK)

```ts
import { context, trace, SpanKind } from "@opentelemetry/api";

const tracer = trace.getTracer("a5c-events");

await context.with(
  trace.setSpan(
    context.active(),
    tracer.startSpan("events.process", { kind: SpanKind.INTERNAL }),
  ),
  async () => {
    // call into the SDK functions here
  },
);
```

### Sample Usage (CLI)

- Recommend users initialize OTEL via environment (e.g., `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME=a5c-events-cli`) and run a vendor distro or SDK bootstrap script before invoking the CLI in CI.

## Error Reporting (Sentry/GlitchTip)

- Keep error boundaries at the host application; this library should throw typed errors or return results with rich error info.
- In services, capture exceptions and attach breadcrumbs with key fields: repository, event type, sha, workflow/job/run ids.
- Example (Node):

```ts
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });

try {
  // call SDK
} catch (err) {
  Sentry.captureException(err);
}
```

## Runtime Shim

File: `src/log.ts`. Responsibilities:

- Resolve `A5C_LOG_LEVEL` and `A5C_LOG_FORMAT`.
- Build a default `LoggerLike` that emits JSON or pretty output.
- Include correlation id discovery from env and allow override.
- Expose a thin helper to attach correlation fields consistently.

Interfaces only (example):

```ts
export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LoggerLike {
  debug: Function;
  info: Function;
  warn: Function;
  error: Function;
}
export interface LoggerOptions {
  level?: LogLevel;
  format?: "json" | "pretty";
  correlationId?: string;
}
export function createDefaultLogger(opts?: LoggerOptions): LoggerLike {}
export function withCorr(logger: LoggerLike, corr: string): LoggerLike {
  /* impl in follow-up */
}
```

## Env and CI Guidance

- Set `A5C_LOG_FORMAT=json` (or `--log-format=json`) in CI for machine parsing.
- Set `A5C_LOG_LEVEL=info` (or `--log-level=debug` for triage builds only).
- Propagate GitHub context to logs and traces using default envs in Actions (`GITHUB_SHA`, `GITHUB_RUN_ID`, etc.).
- If using OTEL, set `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, and sampling envs per your backend.

## Trade‑offs

- Optional peer-deps avoid vendor lock-in but require docs for bootstrapping.
- JSON by default in CI improves searchability but is chatty; rely on `A5C_LOG_LEVEL` to control volume.
- Keeping the shim minimal avoids footprint growth; advanced users can replace the logger entirely.

## Follow‑ups

1. Wire optional OTEL spans guarded by a dynamic import/try-catch.
2. Cookbook examples in `docs/recipes/*.md` for pino, loglevel, Sentry, OTEL.

## Dashboard wiring

- Store `observability.json` as a workflow artifact (already configured).
- Optionally publish to a long-lived sink (e.g., S3, GCS) via a follow-up workflow for dashboards.
- Minimal GitHub-native option: use step summaries and repository insights with CSV/JSON exports.
- For matrices, aggregate per-job artifacts into `observability.aggregate.json` for charting (p95 durations, cache hit ratios).

> Note: The canonical schema path is \`docs/specs/observability.schema.json\`.

## CI Heartbeats (Tests)

You can add an optional heartbeat around the `Tests` workflow using Healthchecks. This makes it easy to detect stalls, cron gaps, or persistent failures.

Prerequisites:

- Healthchecks ping URL for the job you want to monitor
- Repository secret: `HEALTHCHECKS_TESTS_PING_URL` (string)

Semantics:

- On job start: `GET <PING>/start`
- On job success: `GET <PING>`
- On job failure/cancel: `GET <PING>/fail`

How to get a ping URL:

1. Create a check in Healthchecks (name it e.g., "Tests")
2. Copy its ping URL (looks like `https://hc-ping.com/<uuid>`)
3. Add it as a repository secret named `HEALTHCHECKS_TESTS_PING_URL`

Reference example (already in repo): `.github/workflows/a5c.yml` uses the same pattern for the scheduled `a5c` workflow via `HEALTHCHECKS_A5C_SCHEDULE_PING_URL`. See also `docs/ci/alerts.md` for scheduled heartbeat setup and notes.

Example wiring for `Tests` steps (illustrative):

```yaml
env:
  HEALTHCHECKS_TESTS_PING_URL: ${{ secrets.HEALTHCHECKS_TESTS_PING_URL || '' }}

jobs:
  unit:
    steps:
      - name: Heartbeat Start (Tests)
        if: env.HEALTHCHECKS_TESTS_PING_URL != ''
        env:
          PING: ${{ env.HEALTHCHECKS_TESTS_PING_URL }}
        run: |
          set -euxo pipefail
          curl -fsS -m 10 --retry 3 --retry-connrefused "$PING/start" || true

      # ... your existing steps (install, build, test) ...

      - name: Heartbeat Complete (Tests)
        if: always() && env.HEALTHCHECKS_TESTS_PING_URL != ''
        env:
          PING: ${{ env.HEALTHCHECKS_TESTS_PING_URL }}
          OUTCOME: ${{ job.status }}
        run: |
          set -euxo pipefail
          case "$OUTCOME" in
            success)
              curl -fsS -m 10 --retry 3 --retry-connrefused "$PING" || true
              ;;
            *)
              curl -fsS -m 10 --retry 3 --retry-connrefused "$PING/fail" || true
              ;;
          esac
```

Notes:

- The `|| ''` guard keeps the workflow noise-free when the secret is not set.
- Use `always()` for the final step to emit success/fail pings regardless of intermediate step outcomes.

## Failure Alerts (Slack/Discord)

Optionally post a short failure summary to Slack or Discord when the `Tests` job fails. Keep these opt-in via existing secrets/vars:

- Slack: `SLACK_BOT_TOKEN` (required), `SLACK_APP_TOKEN` (if using Socket Mode)
- Discord: `DISCORD_TOKEN` (required), `DISCORD_GUILD_ID` (var)

Recommended message fields:

- Repository, workflow/job names
- Branch/commit (short SHA)
- Run URL
- Conclusion (failure)

Illustrative step (Slack via simple curl webhook pattern; replace with your notifier of choice):

```yaml
- name: Notify (Slack) on failure
  if: failure() && env.SLACK_BOT_TOKEN != ''
  env:
    SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN || '' }}
  run: |
    set -euo pipefail
    RUN_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
    MSG="❌ Tests failed in ${GITHUB_REPOSITORY} · ${GITHUB_REF} · ${GITHUB_SHA::7} — ${RUN_URL}"
    # Example using Slack chat.postMessage (requires channel id in a secret/var)
    [ -z "${SLACK_CHANNEL_ID:-}" ] && echo "SLACK_CHANNEL_ID not set; skipping" && exit 0
    curl -fsS -X POST \
      -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
      -H "Content-type: application/json; charset=utf-8" \
      --data "$(jq -n --arg c "$SLACK_CHANNEL_ID" --arg t "$MSG" '{channel:$c,text:$t}')" \
      https://slack.com/api/chat.postMessage || true
```

Illustrative step (Discord as a minimal bot send; replace with your notifier of choice):

```yaml
- name: Notify (Discord) on failure
  if: failure() && env.DISCORD_TOKEN != '' && env.DISCORD_GUILD_ID != ''
  env:
    DISCORD_TOKEN: ${{ secrets.DISCORD_TOKEN || '' }}
    DISCORD_GUILD_ID: ${{ vars.DISCORD_GUILD_ID || '' }}
  run: |
    set -euo pipefail
    RUN_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"
    MSG="❌ Tests failed in ${GITHUB_REPOSITORY} · ${GITHUB_REF} · ${GITHUB_SHA::7} — ${RUN_URL}"
    # Example: send to a known channel id (supply via secret/var DISCORD_CHANNEL_ID)
    [ -z "${DISCORD_CHANNEL_ID:-}" ] && echo "DISCORD_CHANNEL_ID not set; skipping" && exit 0
    curl -fsS -X POST \
      -H "Authorization: Bot ${DISCORD_TOKEN}" \
      -H "Content-Type: application/json" \
      --data "$(jq -n --arg t "$MSG" '{content:$t}')" \
      "https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages" || true
```

Notes:

- These examples are intentionally minimal. You may already have a central notifier action; if so, call it here with `if: failure()` and the same guards.
- Keep alerts opt-in to avoid noise in forks and local runs.
- Reuse existing repo/org secrets to avoid duplicating credentials across workflows.
