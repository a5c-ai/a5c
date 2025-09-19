import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { handleEnrich } from "../src/enrich.js";
describe("enrich fallback NE.type mapping", () => {
  it("maps issues webhook to NE type 'issue' (singular)", async () => {
    const { output } = await handleEnrich({
      in: path.resolve("tests/fixtures/github/issues.opened.json"),
    });
    expect(output.type).toBe("issue");
  });
  it("keeps issue_comment webhook as 'issue_comment'", async () => {
    const { output } = await handleEnrich({
      in: path.resolve("samples/issue_comment.created.json"),
    });
    expect(output.type).toBe("issue_comment");
  });
  it("does not emit unsupported 'repository_dispatch' in fallback; uses 'commit' instead", async () => {
    const tmp = path.join(os.tmpdir(), `repo_dispatch_${Date.now()}.json`);
    const payload = {
      client_payload: { foo: "bar" },
      // include minimal repository to mimic GH shape, though not required by fallback
      repository: { full_name: "a/b" },
    } as any;
    fs.writeFileSync(tmp, JSON.stringify(payload), "utf8");
    const { output } = await handleEnrich({ in: tmp });
    expect(output.type).not.toBe("repository_dispatch");
    expect(output.type).toBe("commit");
    fs.unlinkSync(tmp);
  });
});
