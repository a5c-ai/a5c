import { Octokit } from "@octokit/rest";
import { Minimatch } from "minimatch";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function createOctokit(token) {
  if (!token) throw new Error("GitHub token is required");
  return new Octokit({ auth: token, userAgent: "a5c-events/0.1" });
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k];
  return out;
}

async function getCodeOwners(octokit, { owner, repo }) {
  try {
    const res = await octokit.repos.getContent({ owner, repo, path: ".github/CODEOWNERS" });
    if (Array.isArray(res.data)) return [];
    const content = Buffer.from(res.data.content, res.data.encoding || "base64").toString("utf8");
    const rules = [];
    for (const line of content.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const parts = t.split(/\s+/);
      const pattern = parts.shift();
      const owners = parts.filter(Boolean);
      if (pattern && owners.length) rules.push({ pattern, owners, mm: new Minimatch(pattern, { dot: true }) });
    }
    return rules;
  } catch (e) {
    if (e.status === 404) return [];
    return [];
  }
}

function resolveOwnersForFiles(rules, files) {
  const map = {};
  for (const f of files) {
    const owners = new Set();
    for (const r of rules) if (r.mm.match(f)) r.owners.forEach((o) => owners.add(o));
    map[f] = Array.from(owners);
  }
  return map;
}

async function withRetry(fn, { retries = 2, waitMs = 500 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      const status = e.status || e.response?.status;
      if (status === 403 && e.response?.headers?.["x-ratelimit-remaining"] === "0") {
        const reset = Number(e.response?.headers?.["x-ratelimit-reset"]) * 1000 || Date.now() + 60_000;
        const delay = Math.max(reset - Date.now(), waitMs);
        await sleep(delay);
      } else if (attempt < retries) {
        await sleep(waitMs * (attempt + 1));
      } else {
        throw e;
      }
    }
    attempt++;
  }
}

export async function enrichGithubEvent(event, opts) {
  const {
    token,
    commitLimit = 50,
    fileLimit = 200,
  } = opts || {};
  const octokit = opts?.octokit || createOctokit(token);

  const repoInfo = event.repository || event.pull_request?.base?.repo || event.workflow_run?.repository;
  if (!repoInfo) throw new Error("repository info missing on event");
  const [owner, repo] = repoInfo.full_name ? repoInfo.full_name.split("/") : [repoInfo.owner.login, repoInfo.name];

  const codeOwnerRules = await getCodeOwners(octokit, { owner, repo });

  const enriched = { _enrichment: { provider: "github", owner, repo, partial: false, errors: [] } };

  if (event.pull_request) {
    const pr = event.pull_request;
    const number = pr.number || event.number;
    const base = { owner, repo, pull_number: number };

    // PR details including files
    const [prRes, filesRes] = await Promise.all([
      withRetry(() => octokit.pulls.get(base)),
      withRetry(() => octokit.paginate(octokit.pulls.listFiles, { ...base, per_page: 100 }))
    ]);

    const prData = prRes.data;
    const files = filesRes.slice(0, fileLimit).map((f) => pick(f, [
      "filename","status","additions","deletions","changes","patch","sha","blob_url","raw_url"
    ]));

    // Mergeability + conflicts
    const prCheck = await withRetry(() => octokit.pulls.get({ ...base }));

    // Commits summary
    const commits = await withRetry(() => octokit.paginate(octokit.pulls.listCommits, { ...base, per_page: 100 }));
    const commitsSlice = commits.slice(0, commitLimit).map((c) => pick(c, [
      "sha","commit","author","committer","parents"
    ]));

    const changedFiles = files.map((f) => f.filename);
    const ownersMap = resolveOwnersForFiles(codeOwnerRules, changedFiles);

    enriched._enrichment.pr = {
      number: prData.number,
      state: prData.state,
      merged: prData.merged,
      mergeable: prCheck.data.mergeable,
      rebaseable: prCheck.data.rebaseable,
      mergeable_state: prCheck.data.mergeable_state,
      draft: prData.draft,
      head: prData.head?.ref,
      base: prData.base?.ref,
      changed_files: prData.changed_files,
      additions: prData.additions,
      deletions: prData.deletions,
      commits: commitsSlice,
      files,
      owners: ownersMap
    };

    // Branch protection
    try {
      const bp = await withRetry(() => octokit.repos.getBranchProtection({ owner, repo, branch: prData.base.ref }));
      const bpData = bp?.data ?? bp;
      enriched._enrichment.branch_protection = { protected: true, data: bpData };
    } catch (e) {
      enriched._enrichment.branch_protection = { protected: false, partial: true };
      enriched._enrichment.errors.push({ scope: "branch_protection", status: e.status || 0 });
      enriched._enrichment.partial = true;
    }
  } else if (event.commits || event.head_commit || event.ref) {
    // push event enrichment using compare between before..after if present
    const before = event.before;
    const after = event.after;
    if (before && after) {
      try {
        const comp = await withRetry(() => octokit.repos.compareCommits({ owner, repo, base: before, head: after }));
        const files = (comp.data.files || []).slice(0, fileLimit).map((f) => pick(f, [
          "filename","status","additions","deletions","changes","patch","sha","blob_url","raw_url"
        ]));
        const commits = (comp.data.commits || []).slice(0, commitLimit).map((c) => pick(c, ["sha","commit","author","committer","parents"]));
        const ownersMap = resolveOwnersForFiles(codeOwnerRules, files.map((f) => f.filename));
        enriched._enrichment.push = {
          before, after, total_commits: comp.data.total_commits,
          files, commits, owners: ownersMap
        };
      } catch (e) {
        enriched._enrichment.partial = true;
        enriched._enrichment.errors.push({ scope: "compare", status: e.status || 0 });
      }
    }
  }

  return enriched;
}

export default enrichGithubEvent;
