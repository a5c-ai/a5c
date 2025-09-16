import { describe, it, expect } from "vitest";
import { handleNormalize } from "../src/normalize.js";

// Utility to assert ISO timestamp format (simple check)
function isIso8601(s?: string) {
  return !!s && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:.+Z/.test(s);
}

describe("handleNormalize", () => {
  it("produces minimal NormalizedEvent with payload and provenance", async () => {
    const { code, output } = await handleNormalize({
      in: "samples/push.json",
      source: "cli",
      labels: ["k=v"],
    });
    expect(code).toBe(0);
    expect(output).toBeTruthy();
    // Required minimal fields per current type/interface (MVP until #75)
    expect(typeof output.id).toBe("string");
    expect(output.provider).toBe("github");
    expect(typeof output.type).toBe("string");
    expect(isIso8601(output.occurred_at)).toBe(true);
    expect(output.payload).toBeTruthy();
    expect(output.labels).toEqual(["k=v"]);
    expect(output.provenance?.source).toBe("cli");
  });
});
