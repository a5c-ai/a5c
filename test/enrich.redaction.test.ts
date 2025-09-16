import { describe, it, expect } from "vitest";
import { handleEnrich } from "../src/enrich.js";

// These tests verify that the enrich output is safe for logging by ensuring
// token-like strings are redacted. The CLI calls redactObject before emitting
// results; handleEnrich itself composes the structure. We replicate the
// redaction step here to validate behavior near enrich.

import { redactObject } from "../src/utils/redact.js";

describe("enrich output redaction", () => {
  it("masks token-like strings in enriched metadata and fields", async () => {
    const { output } = await handleEnrich({
      in: "samples/issue_comment.created.json",
      labels: [],
      rules: undefined,
      flags: {},
    });

    // Inject token-like content into a few places to simulate accidental inclusion
    const withSecrets: any = {
      ...output,
      enriched: {
        ...(output.enriched as any),
        metadata: {
          ...(output.enriched as any)?.metadata,
          bearer: "Bearer abcdefghijklmnop123456",
        },
        derived: {
          ...(output.enriched as any)?.derived,
          token_hint: "ghp_1234567890abcdef1234567890abcdef1234",
        },
      },
    };

    const safe = redactObject(withSecrets);
    // Expect complete masking for both Bearer and ghp_ tokens
    expect(JSON.stringify(safe)).not.toContain("ghp_123456");
    expect(JSON.stringify(safe)).not.toContain("Bearer abcdef");
    // And the generic mask string should appear
    expect(JSON.stringify(safe)).toContain("REDACTED");
  });
});
