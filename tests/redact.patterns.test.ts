import { describe, it, expect } from "vitest";
import { redactString } from "../src/utils/redact";

describe("redactString – additional patterns", () => {
  it("redacts URL basic auth credentials", () => {
    const input = "https://user:pass123@example.com/path";
    const out = redactString(input);
    // Basic auth creds (including scheme) are redacted; host/path remain
    expect(out).toBe("REDACTEDexample.com/path");
  });

  it("redacts Slack tokens", () => {
    const input = "token=xoxb-123456789012-abcdefABCDEF";
    const out = redactString(input);
    expect(out).toBe("token=REDACTED");
  });
});
