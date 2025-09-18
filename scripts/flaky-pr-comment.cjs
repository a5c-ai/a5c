#!/usr/bin/env node
/**
 * Flaky tests PR commenter
 * - Reads summary from /tmp/flaky.json (produced by scripts/flaky-detector.cjs)
 * - On pull_request events, upserts a PR comment with a stable marker
 * - Ensures a "flaky-test" label exists and applies it when flakies are found
 *
 * Designed to be resilient: errors are caught and do not throw.
 */
const fs = require("fs");
const { execSync } = require("child_process");

function safeReadJSON(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}

function main() {
  const eventName = process.env.GITHUB_EVENT_NAME || "";
  if (eventName !== "pull_request") return; // only on PRs

  const res = safeReadJSON("/tmp/flaky.json", { found: false, flakies: [] });
  const lines = [];
  lines.push("<!-- a5c:flaky-detector -->");
  lines.push("## 🧪 Flaky Tests Summary");
  if (!res || !res.found || !Array.isArray(res.flakies) || res.flakies.length === 0) {
    lines.push("No flaky tests detected (no mixed pass/fail across retries).");
  } else {
    lines.push("The following tests appear flaky (failures followed by passes within the run):\n");
    lines.push("| Test | File/Class | Attempts | Failed | Passed |");
    lines.push("|---|---|---:|---:|---:|");
    const esc = (s) => String(s ?? "").replaceAll("|", "\\|");
    for (const f of res.flakies) {
      const loc = f.file || f.classname || "";
      lines.push(`| ${esc(f.name)} | ${esc(loc)} | ${f.attempts} | ${f.failed_runs} | ${f.passed_runs} |`);
    }
  }
  fs.writeFileSync("/tmp/flaky.md", lines.join("\n"));

  const pr = safeReadJSON(process.env.GITHUB_EVENT_PATH || "", {}).pull_request?.number;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!pr || !repo) return;

  // Ensure label exists and apply when flakies found
  const label = "flaky-test";
  try {
    try {
      execSync(`gh label view "${label}" --repo ${repo}`, { stdio: "ignore" });
    } catch {
      try {
        execSync(
          `gh label create "${label}" --color f9d0c4 --description "Tests detected as flaky in CI" --repo ${repo}`
        );
      } catch {}
    }
    if (res.found) {
      try {
        execSync(`gh pr edit ${pr} --repo ${repo} --add-label "${label}"`, { stdio: "ignore" });
      } catch {}
    }
  } catch {}

  // Upsert comment with stable marker
  try {
    const existing = execSync(
      `gh api repos/${repo}/issues/${pr}/comments --jq ".[] | select(.body | contains(\"a5c:flaky-detector\")) | .id"`
    )
      .toString()
      .trim();
    if (existing) {
      execSync(
        `gh api -X PATCH -H "Accept: application/vnd.github+json" repos/${repo}/issues/comments/${existing} -f body@/tmp/flaky.md`
      );
    } else {
      execSync(`gh pr comment ${pr} --repo ${repo} -F /tmp/flaky.md`);
    }
  } catch {}
}

main();
