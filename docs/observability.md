# Observability for @a5c-ai/events (SDK/CLI)

This discovery doc proposes a minimal, pragmatic observability plan for consumers of this package (CLI users and SDK integrators). It focuses on structured logging, optional tracing hooks, and error reporting integration without forcing extra runtime dependencies.

## Artifact schema

The CI workflows emit an `observability.json` artifact. Schema is experimental (`schema_version: 0.1`) and may evolve additively. A formal JSON Schema lives at `docs/specs/observability.schema.json`.

Versioning policy:

- Use a SemVer-like string for `schema_version` (e.g., `0.1`, `0.2`).
- Minor bumps are additive and backward-compatible (new optional fields).
- Breaking changes require a major bump (e.g., `1.0`) and migration notes.
- Producers should pin the intended `schema_version`; consumers validate accordingly.

- Top-level fields: `repo`, `workflow`, `job`, `run`, `metrics`
- `run`: `id`, `attempt`, `sha`, `ref`, `actor`, `event_name`, `conclusion`, `started_at` (optional), `completed_at`, `duration_ms` (optional)
- `metrics.coverage`: Vitest coverage-summary JSON embedded under `total`
- `metrics.cache`: `entries[]` (`kind`, `hit`, optional `key`, optional `bytes`) and `summary` (`hits`, `misses`, `total`, `hit_ratio`, `bytes_restored_total`)

Example: see `docs/examples/observability.json`. The example is validated in tests against the JSON Schema.

When multiple jobs or a matrix run produce per-job artifacts, an aggregate artifact `observability.aggregate.json` may be produced with:

- `metrics.cache.overall`: `hits`, `total`, `hit_ratio`, `bytes_restored_total`
- `metrics.cache.by_kind[]`: per cache kind rollups with the same fields
  Optional validation in CI:

- Composite actions may validate the artifact using `ajv` when `OBS_VALIDATE_SCHEMA=true` is set; failures should log warnings initially (non-blocking) until stability increases.

## Goals

- Provide clear guidance for JSON structured logs with levels and correlation ids.
- Offer optional OpenTelemetry hooks for spans/attributes without hard runtime coupling.
- Document patterns for error capture (Sentry/GlitchTip) in downstream apps.
- Keep the core package light: no hard dependency on logging/tracing vendors.

## Non‑Goals

- Implement full logging or tracing backends in this PR.
- Replace app observability; this package should integrate into host pipelines.

## Structured Logging

- Output JSON logs by default when used as a CLI; SDK consumers can inject their logger.
- Suggested fields: `ts` (ISO), `level`, `msg`, `event`, `corr` (correlation id), `ctx` (small object), `error`.
- Levels: `debug`, `info`, `warn`, `error`.
- Correlation ids:
  - Honor existing ids from environment: `GITHUB_RUN_ID`, `GITHUB_WORKFLOW`, `GITHUB_REF`, `TRACE_ID`, `REQUEST_ID`.
  - Allow override via `A5C_CORRELATION_ID`.

### CLI Behavior (current and proposed)

- Current: CLI prints human messages; tests ensure outputs are safe for logging.
- Proposed: Add an env toggle for JSON logs: `A5C_LOG_FORMAT=json|pretty` (default pretty for humans; CI examples recommend `json`).
- Proposed: Add level filter via `A5C_LOG_LEVEL=info|debug|warn|error` (fallback to `info`).

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

Consumers pass a `LoggerLike` to APIs; when omitted, a default console-based logger is used. When `A5C_LOG_FORMAT=json`, default logger emits JSON lines with the fields above.

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

## Proposed Runtime Shim (separate PR)

File: `src/log.ts` (not implemented here). Responsibilities:

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
export function createDefaultLogger(opts?: LoggerOptions): LoggerLike {
  /* impl in follow-up */
}
export function withCorr(logger: LoggerLike, corr: string): LoggerLike {
  /* impl in follow-up */
}
```

## Env and CI Guidance

- Set `A5C_LOG_FORMAT=json` in CI for machine parsing.
- Set `A5C_LOG_LEVEL=info` (or `debug` for triage builds only).
- Propagate GitHub context to logs and traces using default envs in Actions (`GITHUB_SHA`, `GITHUB_RUN_ID`, etc.).
- If using OTEL, set `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_ENDPOINT`, and sampling envs per your backend.

## Trade‑offs

- Optional peer-deps avoid vendor lock-in but require docs for bootstrapping.
- JSON by default in CI improves searchability but is chatty; rely on `A5C_LOG_LEVEL` to control volume.
- Keeping the shim minimal avoids footprint growth; advanced users can replace the logger entirely.

## Follow‑ups

1. Implement `src/log.ts` shim with zero external deps and tests.
2. Wire optional OTEL spans guarded by a dynamic import/try-catch.
3. Add CLI flags `--log-format`, `--log-level` mirroring env toggles.
4. Cookbook examples in `docs/recipes/*.md` for pino, loglevel, Sentry, OTEL.
