import { describe, it, expect, beforeEach } from "vitest";
import {
  __resetForTest,
  startSpan,
  runWithSpan,
} from "../src/utils/tracing.js";

describe("tracing util", () => {
  beforeEach(() => {
    delete (globalThis as any).__OTEL_API__;
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    delete process.env.OTEL_TRACES_EXPORTER;
    __resetForTest();
  });

  it("no-ops when env is not set", async () => {
    const span = await startSpan("x");
    expect(span).toBeTruthy();
    // calling helpers should not throw
    span.setAttributes({ a: 1 });
    span.addEvent("e");
    span.recordException(new Error("err"));
    span.end();
  });

  it("uses provided OTEL API when env gate is open", async () => {
    process.env.OTEL_TRACES_EXPORTER = "otlp";
    const events: any[] = [];
    (globalThis as any).__OTEL_API__ = {
      trace: {
        getTracer() {
          return {
            startSpan(name: string) {
              const s = {
                setAttributes(attrs: any) {
                  events.push(["attrs", name, attrs]);
                },
                addEvent(ev: string, attrs?: any) {
                  events.push(["event", name, ev, attrs]);
                },
                recordException(err: any) {
                  events.push(["ex", name, String(err?.message || err)]);
                },
                end() {
                  events.push(["end", name]);
                },
              };
              events.push(["start", name]);
              return s;
            },
          };
        },
      },
    };
    __resetForTest();
    const res = await runWithSpan("test.span", { a: "b" }, async (s) => {
      s.addEvent("doing");
      return 42;
    });
    expect(res).toBe(42);
    expect(events.some((e) => e[0] === "start")).toBe(true);
    expect(events.some((e) => e[0] === "end")).toBe(true);
  });
});
