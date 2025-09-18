import { describe, it, expect } from "vitest";
import { handleGenerateContext } from "../src/generateContext.js";
import fs from "node:fs";
import path from "node:path";

describe("generate_context this binding (strict)", () => {
  it("does not leak global object for top-level {{ this }}", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "tmp-ctx-"));
    const main = path.join(dir, "main.md");
    const eventFile = path.join(dir, "event.json");
    fs.writeFileSync(main, "Outside: {{ this }}\n", "utf8");
    fs.writeFileSync(
      eventFile,
      JSON.stringify({ repository: { full_name: "a/b" } }),
      "utf8",
    );
    const res = await handleGenerateContext({
      in: eventFile,
      template: `file://${main}`,
      vars: {},
    });
    expect(res.code).toBe(0);
    // Should render empty (not [object global]/[object Object]) when not in an each context
    expect(res.output).toMatch(/Outside:\s*\n/);
    expect(res.output).not.toContain("[object global]");
  });
});
