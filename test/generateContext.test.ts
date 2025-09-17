import { describe, it, expect } from "vitest";
import { handleGenerateContext } from "../src/generateContext.js";
import fs from "node:fs";
import path from "node:path";

describe("generate_context", () => {
  it("renders variables, if, each, and includes", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "tmp-ctx-"));
    const main = path.join(dir, "main.md");
    const part = path.join(dir, "part.md");
    const eventFile = path.join(dir, "event.json");
    fs.writeFileSync(part, "Part {{ vars.name }}!\n");
    fs.writeFileSync(
      main,
      [
        "Hello {{ event.repository.full_name }}",
        "{{#if env.USER}}User: {{ env.USER }}{{/if}}",
        "List: {{#each event.labels}}{{ this }} {{/each}}",
        "Include:",
        `{{> file://${part} name=World }}`,
        "",
      ].join("\n"),
      "utf8",
    );
    fs.writeFileSync(
      eventFile,
      JSON.stringify({ repository: { full_name: "a/b" }, labels: ["x", "y"] }),
      "utf8",
    );
    const res = await handleGenerateContext({
      in: eventFile,
      template: `file://${main}`,
      vars: {},
    });
    expect(res.code).toBe(0);
    expect(res.output).toContain("Hello a/b");
    expect(res.output).toMatch(/List: x y/);
    expect(res.output).toContain("Part World!");
  });
});
