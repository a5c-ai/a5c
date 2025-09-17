import { describe, it, expect } from "vitest";
import { handleReactor } from "../src/reactor.js";
import fs from "node:fs";
import path from "node:path";

describe("reactor buildExpressionEvent sets type 'issue'", () => {
  it("promotes original_event.issue to event.type==='issue' in expressions", async () => {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "tmp-react-"));
    const rules = path.join(dir, "reactor.yaml");
    fs.writeFileSync(
      rules,
      [
        "---",
        "on:",
        "  any:",
        "    filters:",
        "      - expression: ${{ event.type == 'issue' }}",
        "emit:",
        "  test:",
        "    type: ok",
        "",
      ].join("\n"),
      "utf8",
    );
    const eventFile = path.join(dir, "event.json");
    const input = {
      client_payload: {
        original_event: {
          issue: { id: 1, number: 123 },
          action: "opened",
          repository: { full_name: "a/b" },
        },
      },
    };
    fs.writeFileSync(eventFile, JSON.stringify(input), "utf8");

    const res = await handleReactor({ in: eventFile, file: rules });
    expect(res.code).toBe(0);
    const evs = (res.output as any)?.events || [];
    expect(evs.length).toBe(1);
    expect(evs[0].event_type).toBe("test");
  });
});
