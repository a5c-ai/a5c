import { describe, expect, it } from "vitest";
import { NormalizedEventSchema } from "../src/schema/normalized-event";

describe("Zod NormalizedEvent composed[]", () => {
  it("accepts event with composed items per JSON Schema", () => {
    const event = {
      id: "1",
      provider: "github",
      type: "push",
      occurred_at: new Date().toISOString(),
      repo: { id: 1, name: "repo", full_name: "a/b" },
      actor: { id: 2, login: "u", type: "User" },
      payload: {},
      provenance: { source: "cli" },
      composed: [
        {
          key: "build",
          reason: null,
          labels: ["ci"],
          targets: ["agent"],
          payload: {},
        },
        { key: "deploy" },
      ],
    };

    const parsed = NormalizedEventSchema.parse(event);
    expect(parsed.composed?.length).toBe(2);
    expect(parsed.composed?.[0].key).toBe("build");
  });
});
