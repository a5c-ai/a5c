import { describe, it, expect } from "vitest";
import { stable } from "../src/utils/stable.js";

describe("stable utility", () => {
  it("masks ISO date-time strings", () => {
    const input = { created_at: "2024-06-01T12:34:56Z" };
    const out: any = stable(input);
    expect(out.created_at).toBe("<iso-8601>");
  });

  it("masks 40-hex sha strings", () => {
    const sha40 = "0123456789abcdef0123456789abcdef01234567";
    const out: any = stable({ commit: sha40 });
    expect(out.commit).toBe("<sha>");
  });

  it("masks id/_id/sha-like keys with values and normalizes run_id", () => {
    const obj = {
      id: "temp-abc123",
      run_id: 123456,
      build_id: "a1b2c3d",
      shortsha: "deadbee",
      head_sha: "deadbee",
    };
    const out: any = stable(obj);
    expect(out.id).toBe("<id>");
    expect(out.run_id).toBe(0);
    expect(out.build_id).toBe("<build_id>");
    expect(out.shortsha).toBe("<shortsha>");
    expect(out.head_sha).toBe("<head_sha>");
  });
});
