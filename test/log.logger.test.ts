import { describe, it, expect } from "vitest";
import { createLogger } from "../src/log.js";

describe("logger", () => {
  it("emits JSON lines with context when format=json", async () => {
    const lines: string[] = [];
    const logger = createLogger({
      level: "debug",
      format: "json",
      scope: "t",
      write: (s) => lines.push(s),
    });
    logger.debug("hello", { a: 1 });
    expect(lines.length).toBe(1);
    const obj = JSON.parse(lines[0]);
    expect(obj.level).toBe("debug");
    expect(obj.msg).toBe("hello");
    expect(obj.scope).toBe("t");
    expect(obj.a).toBe(1);
    expect(typeof obj.ts).toBe("string");
  });

  it("filters below threshold", async () => {
    const lines: string[] = [];
    const logger = createLogger({
      level: "warn",
      format: "json",
      scope: "t",
      write: (s) => lines.push(s),
    });
    logger.info("nope");
    logger.warn("ok");
    expect(lines.length).toBe(1);
    const obj = JSON.parse(lines[0]);
    expect(obj.level).toBe("warn");
  });
});
