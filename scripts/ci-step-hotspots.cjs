#!/usr/bin/env node
/*
  Computes per-step durations for the current job by querying the GitHub API
  for the workflow run and job that matches this execution context. Emits:
  - ::warning/::error annotations for steps exceeding thresholds
  - Appends a p95 summary and top-N slow steps table to GITHUB_STEP_SUMMARY

  Env vars used (from composite action inputs):
    INPUT_WARN_MS, INPUT_ERROR_MS, INPUT_P95_WARN_MS, INPUT_P95_ERROR_MS, INPUT_TOP_N
    GH_TOKEN (required for gh api), GITHUB_* (standard Actions env)
*/
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

function getEnv(name, def = "") {
  return process.env[name] ?? def;
}

function ghApi(args, inputJson) {
  const res = spawnSync("gh", ["api", ...args], {
    encoding: "utf8",
    env: process.env,
    input: inputJson ? JSON.stringify(inputJson) : undefined,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (res.status !== 0) {
    throw new Error(`gh api failed: ${res.stderr || res.stdout}`);
  }
  try {
    return JSON.parse(res.stdout || "{}");
  } catch (e) {
    throw new Error(
      `Failed to parse gh api response: ${(res.stdout || "").slice(0, 500)} ...`,
    );
  }
}

function isoToMs(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

function percentile(data, p) {
  if (!data.length) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function ms(n) {
  return Number.isFinite(n) ? n : 0;
}
function fmtMs(n) {
  n = Math.max(0, Math.floor(ms(n)));
  const s = Math.floor(n / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m || h) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return `${parts.join(" ")} (${n} ms)`;
}

function annotate(level, title, message) {
  const lvl = level === "error" ? "error" : "warning";
  process.stdout.write(`::${lvl} title=${title}::${message}\n`);
}

(async function main() {
  try {
    const warnMs = Number(getEnv("INPUT_WARN_MS", "300000"));
    const errorMs = Number(getEnv("INPUT_ERROR_MS", "900000"));
    const p95WarnMs = Number(getEnv("INPUT_P95_WARN_MS", "420000"));
    const p95ErrorMs = Number(getEnv("INPUT_P95_ERROR_MS", "1200000"));
    const topN = Math.max(1, Number(getEnv("INPUT_TOP_N", "10")));

    const repo = getEnv("GITHUB_REPOSITORY"); // owner/repo
    const runId = getEnv("GITHUB_RUN_ID");
    const jobName = getEnv("GITHUB_JOB"); // ID of job definition
    const matrixJson = getEnv("JOB_NAME") || ""; // fallback, not standard

    // Fetch jobs for this run
    const jobsResp = ghApi([
      `/repos/${repo}/actions/runs/${runId}/jobs`,
      "--paginate",
    ]);
    const jobs = jobsResp.jobs || jobsResp || [];

    // Try to heuristically pick the job for current runner by matching runner_name or job_name
    const currentRunnerName = getEnv("RUNNER_NAME", "").toLowerCase();
    const attempt = Number(getEnv("GITHUB_RUN_ATTEMPT", "1"));
    let job =
      jobs.find(
        (j) =>
          String(j.run_attempt || 1) === String(attempt) &&
          String(j.runner_name || "").toLowerCase() === currentRunnerName,
      ) ||
      jobs.find((j) => (j.name || "").includes(jobName)) ||
      jobs[0];
    if (!job)
      throw new Error(
        "Unable to identify current job from workflow run jobs list",
      );

    // Each job has steps with started_at/completed_at
    const steps = (job.steps || [])
      .map((s) => {
        const start = isoToMs(s.started_at);
        const end = isoToMs(s.completed_at);
        const dur = start != null && end != null ? end - start : null;
        return {
          name: s.name || "(unnamed)",
          status: s.conclusion || s.status,
          started_at: s.started_at,
          completed_at: s.completed_at,
          duration_ms: dur,
        };
      })
      .filter((s) => s.duration_ms != null);

    if (!steps.length) {
      console.log("No step timings available; skipping annotations.");
      return;
    }

    const durations = steps.map((s) => s.duration_ms);
    const p95 = percentile(durations, 95);

    // Emit annotations for individual steps
    for (const s of steps) {
      if (s.duration_ms >= errorMs) {
        annotate(
          "error",
          "Long-running step",
          `${s.name} took ${fmtMs(s.duration_ms)}`,
        );
      } else if (s.duration_ms >= warnMs) {
        annotate(
          "warning",
          "Slow step",
          `${s.name} took ${fmtMs(s.duration_ms)}`,
        );
      }
    }

    // Emit overall p95 annotation
    if (p95 >= p95ErrorMs) {
      annotate("error", "High p95 step duration", `p95: ${fmtMs(p95)}`);
    } else if (p95 >= p95WarnMs) {
      annotate("warning", "Elevated p95 step duration", `p95: ${fmtMs(p95)}`);
    }

    // Append summary
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath && fs.existsSync(path.dirname(summaryPath))) {
      const top = steps
        .slice()
        .sort((a, b) => b.duration_ms - a.duration_ms)
        .slice(0, topN);
      const lines = [];
      lines.push("## Step Hotspots");
      lines.push("");
      lines.push(`p95 duration: ${fmtMs(p95)}`);
      lines.push("");
      lines.push("| Rank | Step | Duration | Started | Finished |");
      lines.push("|---:|---|---:|---|---|");
      top.forEach((s, i) => {
        lines.push(
          `| ${i + 1} | ${s.name.replace(/\|/g, "\\|")} | ${s.duration_ms} ms | ${s.started_at} | ${s.completed_at} |`,
        );
      });
      lines.push("");
      fs.appendFileSync(summaryPath, lines.join("\n") + "\n");
    }
  } catch (err) {
    console.error("Step hotspots analysis failed:", err.message);
    // Do not fail the job by default; emit a warning annotation
    annotate("warning", "Step hotspots failed", String(err.message || err));
  }
})();
