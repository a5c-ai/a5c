import { describe, it, expect } from "vitest";
import { handleReactor } from "../src/reactor.js";
import fs from "node:fs";
import path from "node:path";

describe("reactor filters and any", () => {
  it("matches any with env-based filter", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "tmp-react-"));
    const rules = path.join(dir, "reactor.yaml");
    fs.writeFileSync(
      rules,
      `---\n` +
        `on:\n` +
        `  any:\n` +
        `    filters:\n` +
        `      - expression: \${{ env.TEST_OK == '1' }}\n` +
        `emit:\n` +
        `  test:\n` +
        `    type: ok\n`,
      "utf8",
    );
    const eventFile = path.join(dir, "event.json");
    fs.writeFileSync(
      eventFile,
      JSON.stringify({ repository: { full_name: "a/b" } }),
      "utf8",
    );
    process.env.TEST_OK = "1";
    const res = await handleReactor({ in: eventFile, file: rules });
    expect(res.code).toBe(0);
    const evs = (res.output as any).events || [];
    expect(evs.length).toBe(1);
    expect(evs[0].event_type).toBe("test");
  });
});
