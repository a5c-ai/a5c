import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

function runDetector(xml: string) {
  // Execute the CommonJS script directly to ensure stdout is pure JSON.
  const { spawnSync } = require("child_process");
  const junit = path.resolve(".tmp-junit.xml");
  fs.writeFileSync(junit, xml);
  const res = spawnSync("node", [path.resolve("scripts/flaky-detector.cjs")], {
    env: { ...process.env, JUNIT_XML: junit },
    encoding: "utf8",
  });
  fs.unlinkSync(junit);
  const out = res.stdout?.trim() || "{}";
  try {
    return JSON.parse(out);
  } catch {
    return { flakies: [], found: false };
  }
}

describe("flaky-detector", () => {
  it("detects fail then pass as flaky via duplicate testcase", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="suite" tests="2" failures="1">
  <testcase classname="a.b" name="does X" time="0.01">
    <failure message="boom"/>
  </testcase>
  <testcase classname="a.b" name="does X" time="0.01" />
</testsuite>`;
    const res = runDetector(xml);
    expect(res.found).toBe(true);
    expect(res.flakies[0].name).toBe("does X");
    expect(res.flakies[0].attempts).toBe(2);
    expect(res.flakies[0].failed_runs).toBe(1);
    expect(res.flakies[0].passed_runs).toBe(1);
  });

  it("does not flag consistent passes", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="suite" tests="1" failures="0">
  <testcase classname="a.b" name="ok" time="0.01" />
</testsuite>`;
    const res = runDetector(xml);
    expect(res.found).toBe(false);
  });
});
