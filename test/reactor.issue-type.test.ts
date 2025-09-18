import { describe, it, expect } from "vitest";
import { handleReactor } from "../src/reactor.js";
import fs from "node:fs";
import path from "node:path";

describe("reactor: original_event.issue yields type 'issue'", () => {
  it("filters on event.type == 'issue' when original_event.issue is present", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "tmp-react-"));
    const rules = path.join(dir, "reactor.yaml");
    fs.writeFileSync(
      rules,
      `---\n` +
        `on:\n` +
        `  any:\n` +
        `    filters:\n` +
        `      - expression: \${{ event.type == 'issue' }}\n` +
        `emit:\n` +
        `  test:\n` +
        `    type: ok\n`,
      "utf8",
    );
    const eventFile = path.join(dir, "event.json");
    // Minimal payload carrying a composed original_event for issues
    fs.writeFileSync(
      eventFile,
      JSON.stringify({
        repository: { full_name: "a/b" },
        client_payload: {
          original_event: {
            issue: { number: 123 },
            action: "opened",
          },
        },
      }),
      "utf8",
    );

    const res = await handleReactor({ in: eventFile, file: rules });
    expect(res.code).toBe(0);
    const evs = (res.output as any).events || [];
    expect(evs.length).toBe(1);
    expect(evs[0].event_type).toBe("test");
  });
});
