---
title: SDK Quickstart (Programmatic)
description: Minimal code example using @a5c-ai/events to normalize and optionally enrich, with notes on LoggerLike and optional OpenTelemetry.
---

# SDK Quickstart – Programmatic Usage

Use the SDK to normalize a GitHub webhook payload into the Normalized Event (NE) schema and optionally enrich provider details. This complements the CLI examples in docs/cli/reference.md.

## Minimal example

```ts
// File: examples/sdk-minimal.ts
// Install: npm install @a5c-ai/events

// Import from the main entry (re-exports provider helpers)
import { mapToNE, enrichGithub } from "@a5c-ai/events";

// 1) Load a GitHub webhook payload (object)
import payload from "../samples/pull_request.synchronize.json" assert { type: "json" };

// 2) Normalize to NE (Normalized Event)
const ne = mapToNE(payload, { source: "webhook", labels: ["env=dev"] });
console.log("type:", ne.type);
console.log("repo:", ne.repo?.full_name);

// 3) Enrich (optional): fetch GitHub metadata if a token is available
(async () => {
  const token = process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn(
      "No token — skipping online enrichment (offline remains valid).",
    );
    return;
  }
  const enriched = await enrichGithub(payload, {
    token,
    commitLimit: 50,
    fileLimit: 200,
  });
  // attach under ne.enriched.github
  (ne as any).enriched = {
    ...((ne as any).enriched || {}),
    github: enriched?._enrichment,
  };
  console.log(
    "mergeable_state:",
    (ne as any).enriched?.github?.pr?.mergeable_state,
  );
})();
```

Notes:

- `mapToNE(payload, { source, labels })` produces a schema-stable NE object.
- `enrichGithub(payload, { token, commitLimit, fileLimit })` returns a provider-specific enrichment fragment. The CLI path uses a higher-level `handleEnrich()` that also performs mentions scanning and rules evaluation.

## LoggerLike and JSON logs (optional)

The SDK does not require a logger; consumers may pass a logger where supported. Suggested interface:

```ts
export interface LoggerLike {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}
```

- If omitted, code paths fall back to `console` when logging is used.
- For JSON logs in CLI/CI, use `--log-format=json` and `--log-level=<...>` (or env `A5C_LOG_FORMAT`/`A5C_LOG_LEVEL`). The SDK remains logger-agnostic; you may pass a `LoggerLike` when available.

## OpenTelemetry (optional)

If `@opentelemetry/api` is installed, you can create spans around SDK calls:

```ts
import { context, trace, SpanKind } from "@opentelemetry/api";
const tracer = trace.getTracer("a5c-events");
await context.with(
  trace.setSpan(
    context.active(),
    tracer.startSpan("events.process", { kind: SpanKind.INTERNAL }),
  ),
  async () => {
    // call mapToNE / enrich here
  },
);
```

This is entirely optional; without OTEL, the above imports won’t be used and you should remove them.

## See also

- CLI reference: docs/cli/reference.md
- Observability: docs/observability.md
- NE schema overview: docs/cli/ne-schema.md
