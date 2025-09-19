import { describe, it, expect } from "vitest";
import { handleEnrich } from "../src/enrich.js";

describe("repository_dispatch → NE custom type", () => {
  it("maps raw repository_dispatch payload to type=custom and validates shape", async () => {
    const res = await handleEnrich({
      in: "samples/repository_dispatch.json",
      flags: {},
    });
    expect(res.code).toBe(0);
    const ne: any = res.output;
    expect(ne).toBeTruthy();
    expect(ne.provider).toBe("github");
    expect(ne.type).toBe("custom");
    // ensure payload preserved
    expect(ne.payload?.action).toBe("ci:notify");
    expect(ne.payload?.client_payload?.status).toBe("ok");
  });
});
