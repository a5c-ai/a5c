// Lightweight optional OpenTelemetry wrapper (no hard dependency)
// - Enables only when env gating is present AND an OTEL API is available.
// - OTEL API can be provided by a global (__OTEL_API__) or by @opentelemetry/api if installed.
// - Otherwise, all helpers no-op with near-zero overhead.

type Attrs = Record<string, string | number | boolean | null | undefined>;

interface SpanShim {
  setAttributes(attrs: Attrs): void;
  addEvent(name: string, attributes?: Attrs): void;
  recordException(err: unknown): void;
  end(): void;
}

let cachedActive: boolean | undefined;
let cachedApi: any | undefined;

function envGate(): boolean {
  const otlp = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  const exporter = (process.env.OTEL_TRACES_EXPORTER || "").toLowerCase();
  // Enable when explicit OTLP endpoint is provided, or when exporter is configured
  return (
    Boolean(otlp && otlp.length) || (Boolean(exporter) && exporter !== "none")
  );
}

async function resolveApi(): Promise<any | undefined> {
  if (cachedApi !== undefined) return cachedApi;
  try {
    // Allow tests/hosts to provide an API without installing the package
    const g: any = globalThis as any;
    if (g.__OTEL_API__ && g.__OTEL_API__.trace) {
      cachedApi = g.__OTEL_API__;
      return cachedApi;
    }
  } catch {}
  try {
    // Dynamic import so there is no hard runtime dependency
    const mod: any = await import("@opentelemetry/api");
    cachedApi = mod;
    return cachedApi;
  } catch {
    cachedApi = undefined;
    return undefined;
  }
}

export function isTracingActive(): boolean {
  if (cachedActive !== undefined) return cachedActive;
  // Do not pay the dynamic import cost unless the env gate is open
  cachedActive = false;
  if (!envGate()) return false;
  // Mark tentatively true; real activation confirmed on first span start
  cachedActive = true;
  return cachedActive;
}

function noopSpan(): SpanShim {
  return {
    setAttributes() {},
    addEvent() {},
    recordException() {},
    end() {},
  };
}

export async function startSpan(
  name: string,
  attributes?: Attrs,
): Promise<SpanShim> {
  // Quick exit when env gate closed
  if (!envGate()) return noopSpan();
  const api = await resolveApi();
  if (!api || !api.trace) return noopSpan();
  try {
    const tracer = api.trace.getTracer("a5c-events", "1.0.0");
    const span = tracer.startSpan(name);
    if (attributes && span?.setAttributes)
      span.setAttributes(sanitizeAttrs(attributes));
    return {
      setAttributes(attrs: Attrs) {
        try {
          span?.setAttributes?.(sanitizeAttrs(attrs));
        } catch {}
      },
      addEvent(evName: string, attrs?: Attrs) {
        try {
          span?.addEvent?.(evName, sanitizeAttrs(attrs || {}));
        } catch {}
      },
      recordException(err: unknown) {
        try {
          span?.recordException?.(err as any);
        } catch {}
      },
      end() {
        try {
          span?.end?.();
        } catch {}
      },
    };
  } catch {
    return noopSpan();
  }
}

export async function runWithSpan<T>(
  name: string,
  attributes: Attrs | undefined,
  fn: (shim: SpanShim) => Promise<T> | T,
): Promise<T> {
  const span = await startSpan(name, attributes);
  try {
    const res = await fn(span);
    return res;
  } catch (err) {
    try {
      span.recordException(err);
    } catch {}
    throw err;
  } finally {
    try {
      span.end();
    } catch {}
  }
}

function sanitizeAttrs(
  attrs: Attrs,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null) continue;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") out[k] = v as any;
    else out[k] = String(v);
  }
  return out;
}

// Test helper: reset memoized state
export function __resetForTest() {
  cachedActive = undefined;
  cachedApi = undefined;
}
