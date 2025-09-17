import { describe, it, expect } from "vitest";
import { handleEmit } from "../src/emit.js";
import fs from "node:fs";
import path from "node:path";

describe("handleEmit", () => {
  it("writes to stdout when sink=stdout and returns code 0", async () => {
    const tmp = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "github",
      "push.json",
    );
    // Default sink changed to "github" when no --out is provided.
    // For unit tests, explicitly force stdout sink to avoid env token dependence.
    const { code, output } = await handleEmit({ in: tmp, sink: "stdout" });
    expect(code).toBe(0);
    expect(output).toBeTruthy();
  });

  it("writes to file sink when out is provided", async () => {
    const tmpIn = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "github",
      "push.json",
    );
    const outPath = path.join(process.cwd(), "tests", "tmp.emit.out.json");
    try {
      const { code } = await handleEmit({
        in: tmpIn,
        out: outPath,
        sink: "file",
      });
      expect(code).toBe(0);
      const stat = fs.statSync(outPath);
      expect(stat.size).toBeGreaterThan(2);
      const json = JSON.parse(fs.readFileSync(outPath, "utf8"));
      expect(json).toBeTruthy();
    } finally {
      if (fs.existsSync(outPath)) fs.unlinkSync(outPath);
    }
  });
});
