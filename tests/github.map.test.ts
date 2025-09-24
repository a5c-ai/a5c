import { describe, it, expect } from "vitest";
import { mapToNE } from "../src/providers/github/map.js";

const baseRepo = {
  id: 1,
  name: "a5c",
  full_name: "a5c-ai/a5c",
};

describe("providers/github/map", () => {
  it("maps workflow_run with provenance workflow (name, run_id)", () => {
    const payload: any = {
      repository: baseRepo,
      workflow_run: {
        id: 999,
        run_id: 999,
        name: "CI",
        head_branch: "a5c/main",
        head_sha: "0123456789abcdef0123456789abcdef01234567",
        updated_at: "2024-06-01T00:00:00Z",
      },
    };
    const ne = mapToNE(payload, { source: "test" });
    expect(ne.type).toBe("workflow_run");
    expect(ne.repo?.full_name).toBe("a5c-ai/a5c");
    expect(ne.ref?.name).toBe("a5c/main");
    expect(ne.ref?.type).toBe("branch");
    expect(ne.ref && "sha" in ne.ref).toBe(true);
    expect(ne.provenance?.workflow?.name).toBe("CI");
    expect(ne.provenance?.workflow?.run_id).toBe(999);
  });

  it("maps check_run with branch ref and sha", () => {
    const payload: any = {
      repository: baseRepo,
      check_run: {
        id: 321,
        head_sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        check_suite: {
          id: 777,
          head_branch: "feature/x",
          head_sha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        },
        started_at: "2024-05-01T00:00:00Z",
      },
    };
    const ne = mapToNE(payload, { source: "test" });
    expect(ne.type).toBe("check_run");
    expect(ne.ref?.type).toBe("branch");
    expect(ne.ref?.name).toBe("feature/x");
    expect(ne.ref && "sha" in ne.ref).toBe(true);
  });

  it("maps push branch refs", () => {
    const payload: any = {
      repository: baseRepo,
      ref: "refs/heads/a5c/main",
      after: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      head_commit: {
        id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        timestamp: "2024-04-01T00:00:00Z",
      },
    };
    const ne = mapToNE(payload, { source: "webhook" });
    expect(ne.type).toBe("push");
    expect(ne.ref?.type).toBe("branch");
    expect(ne.ref?.name).toBe("a5c/main");
    expect(ne.ref?.sha).toBe("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
  });

  it("maps push tag refs", () => {
    const payload: any = {
      repository: baseRepo,
      ref: "refs/tags/v1.2.3",
      after: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      head_commit: {
        id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        timestamp: "2024-04-01T00:00:00Z",
      },
    };
    const ne = mapToNE(payload, { source: "webhook" });
    expect(ne.type).toBe("push");
    expect(ne.ref?.type).toBe("tag");
    expect(ne.ref?.name).toBe("v1.2.3");
  });

  it("maps release with tag ref and occurred_at", () => {
    const payload: any = {
      repository: baseRepo,
      release: {
        id: 555,
        tag_name: "v1.2.3",
        target_commitish: "0123456789abcdef0123456789abcdef01234567",
        published_at: "2024-07-01T00:00:00Z",
      },
    };
    const ne = mapToNE(payload, { source: "webhook" });
    expect(ne.type).toBe("release");
    expect(ne.ref?.type).toBe("tag");
    expect(ne.ref?.name).toBe("v1.2.3");
    expect(ne.occurred_at).toBe("2024-07-01T00:00:00.000Z");
  });

  it("maps deployment and ref from deployment.ref", () => {
    const payload: any = {
      repository: baseRepo,
      deployment: {
        id: 777,
        ref: "a5c/main",
        created_at: "2024-08-01T00:00:00Z",
      },
    };
    const ne = mapToNE(payload, { source: "webhook" });
    expect(ne.type).toBe("deployment");
    expect(ne.ref?.type).toBe("branch");
    expect(ne.ref?.name).toBe("a5c/main");
  });

  it("maps workflow_job to job with branch ref", () => {
    const payload: any = {
      repository: baseRepo,
      workflow_job: {
        id: 4242,
        run_id: 123,
        head_branch: "feature/job",
        head_sha: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        started_at: "2024-06-15T00:00:00Z",
      },
    };
    const ne = mapToNE(payload, { source: "action" });
    expect(ne.type).toBe("job");
    expect(ne.ref?.type).toBe("branch");
    expect(ne.ref?.name).toBe("feature/job");
    expect(ne.ref?.sha).toBe("bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
  });

  it("maps alert when alert payload is present", () => {
    const payload: any = {
      repository: baseRepo,
      alert: {
        id: 9001,
        number: 101,
        created_at: "2024-09-01T00:00:00Z",
      },
    };
    const ne = mapToNE(payload, { source: "webhook" });
    expect(ne.type).toBe("alert");
    expect(ne.id).toBe("101");
  });
});
