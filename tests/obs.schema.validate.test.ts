import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";

describe("observability schema validation", () => {
  it("validates the example via npm script", () => {
    const out = execSync("npm run -s validate:obs", { encoding: "utf8" });
    // ajv-cli prints nothing on success by default; ensure exit code 0 was returned.
    expect(out).toMatch(/.*/);
  });
});
