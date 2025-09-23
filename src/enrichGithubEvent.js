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
    const res = await octokit.repos.getContent({
      owner,
      repo,
      path: ".github/CODEOWNERS",
    });
    if (Array.isArray(res.data)) return [];
    const content = Buffer.from(
      res.data.content,
      res.data.encoding || "base64",
    ).toString("utf8");
    const rules = [];
    for (const line of content.split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const parts = t.split(/\s+/);
      const pattern = parts.shift();
      const owners = parts.filter(Boolean);
      if (pattern && owners.length)
        rules.push({
          pattern,
          owners,
          mm: new Minimatch(pattern, { dot: true }),
        });
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
    for (const r of rules)
      if (r.mm.match(f)) r.owners.forEach((o) => owners.add(o));
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
      if (
        status === 403 &&
        e.response?.headers?.["x-ratelimit-remaining"] === "0"
      ) {
        const reset =
          Number(e.response?.headers?.["x-ratelimit-reset"]) * 1000 ||
          Date.now() + 60_000;
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
    includePatch = false,
  } = opts || {};
  const octokit = opts?.octokit || createOctokit(token);

  const repoInfo =
    event.repository ||
    event.pull_request?.base?.repo ||
    event.workflow_run?.repository;
  if (!repoInfo) throw new Error("repository info missing on event");
  const [owner, repo] = repoInfo.full_name
    ? repoInfo.full_name.split("/")
    : [repoInfo.owner.login, repoInfo.name];

  const codeOwnerRules = await getCodeOwners(octokit, { owner, repo });

  const enriched = {
    _enrichment: {
      provider: "github",
      owner,
      repo,
      partial: false,
      errors: [],
    },
  };

  async function fetchIssueComments(issueNumber, { until } = {}) {
    try {
      const comments = await withRetry(() =>
        octokit.paginate(octokit.issues.listComments, {
          owner,
          repo,
          issue_number: issueNumber,
          per_page: 100,
        }),
      );
      if (until) {
        const ts = new Date(until).getTime();
        return comments.filter((c) => new Date(c.created_at).getTime() < ts);
      }
      return comments;
    } catch (e) {
      enriched._enrichment.errors.push({ scope: "issue_comments", status: e.status || 0 });
      enriched._enrichment.partial = true;
      return [];
    }
  }

  async function fetchReviewComments(prNumber, { until } = {}) {
    try {
      const comments = await withRetry(() =>
        octokit.paginate(octokit.pulls.listReviewComments, {
          owner,
          repo,
          pull_number: prNumber,
          per_page: 100,
        }),
      );
      if (until) {
        const ts = new Date(until).getTime();
        return comments.filter((c) => new Date(c.created_at).getTime() < ts);
      }
      return comments;
    } catch (e) {
      enriched._enrichment.errors.push({ scope: "review_comments", status: e.status || 0 });
      enriched._enrichment.partial = true;
      return [];
    }
  }

  async function fetchCommitChecks(sha) {
    const out = {};
    try {
      const combined = await withRetry(() =>
        octokit.repos.getCombinedStatusForRef({ owner, repo, ref: sha }),
      );
      out.combined_status = combined?.data || combined;
    } catch (e) {
      enriched._enrichment.errors.push({ scope: "combined_status", status: e.status || 0 });
      enriched._enrichment.partial = true;
    }
    try {
      const runs = await withRetry(() =>
        octokit.checks.listForRef({ owner, repo, ref: sha, per_page: 100 }),
      );
      out.check_runs = runs?.data || runs;
    } catch (e) {
      enriched._enrichment.errors.push({ scope: "check_runs", status: e.status || 0 });
      enriched._enrichment.partial = true;
    }
    return out;
  }

  if (event.pull_request) {
    const pr = event.pull_request;
    const number = pr.number || event.number;
    const base = { owner, repo, pull_number: number };

    // PR details including files
    const [prRes, filesRes] = await Promise.all([
      withRetry(() => octokit.pulls.get(base)),
      withRetry(() =>
        octokit.paginate(octokit.pulls.listFiles, { ...base, per_page: 100 }),
      ),
    ]);

    const prData = prRes.data;
    const files = filesRes.slice(0, fileLimit).map((f) => {
      const keys = [
        "filename",
        "status",
        "additions",
        "deletions",
        "changes",
        "sha",
        "blob_url",
        "raw_url",
      ];
      if (includePatch && f.patch) keys.push("patch");
      return pick(f, keys);
    });

    // Mergeability + conflicts
    const prCheck = await withRetry(() => octokit.pulls.get({ ...base }));

    // Commits summary
    const commits = await withRetry(() =>
      octokit.paginate(octokit.pulls.listCommits, { ...base, per_page: 100 }),
    );
    const commitsSlice = commits
      .slice(0, commitLimit)
      .map((c) => pick(c, ["sha", "commit", "author", "committer", "parents"]));

    const changedFiles = files.map((f) => f.filename);
    const ownersMap = resolveOwnersForFiles(codeOwnerRules, changedFiles);
    // Compute stable, deduplicated union of owners across all changed files
    const ownersUnionSet = new Set();
    for (const f of Object.keys(ownersMap)) {
      const arr = Array.isArray(ownersMap[f]) ? ownersMap[f] : [];
      for (const o of arr) ownersUnionSet.add(o);
    }
    const ownersUnion = Array.from(ownersUnionSet).sort();
    const mergeableState = prCheck.data.mergeable_state;
    const hasConflicts =
      mergeableState === "dirty" || mergeableState === "blocked";
    // Labels and review requests
    const prLabels = Array.isArray(prData.labels)
      ? prData.labels.map((l) => l?.name).filter(Boolean)
      : [];
    const requestedReviewers = Array.isArray(prData.requested_reviewers)
      ? prData.requested_reviewers.map((u) => u?.login).filter(Boolean)
      : [];
    const requestedTeams = Array.isArray(prData.requested_teams)
      ? prData.requested_teams.map((t) => t?.slug || t?.name).filter(Boolean)
      : [];

    enriched._enrichment.pr = {
      number: prData.number,
      state: prData.state,
      merged: prData.merged,
      mergeable: prCheck.data.mergeable,
      rebaseable: prCheck.data.rebaseable,
      mergeable_state: mergeableState,
      has_conflicts: hasConflicts,
      draft: prData.draft,
      head: prData.head?.ref,
      head_sha: prData.head?.sha,
      base: prData.base?.ref,
      changed_files: prData.changed_files,
      additions: prData.additions,
      deletions: prData.deletions,
      labels: prLabels,
      requested_reviewers: requestedReviewers,
      requested_teams: requestedTeams,
      commits: commitsSlice,
      files,
      owners: ownersMap,
      ...(ownersUnion.length
        ? { owners_union: ownersUnion }
        : { owners_union: [] }),
    };

    // PR comments (issue discussion) and review comments
    try {
      const issueComments = await fetchIssueComments(number);
      const reviewComments = await fetchReviewComments(number);
      enriched._enrichment.pr.comments = issueComments;
      enriched._enrichment.pr.review_comments = reviewComments;
    } catch {}

    // Status checks for head commit
    if (prData.head?.sha) {
      try {
        const checks = await fetchCommitChecks(prData.head.sha);
        enriched._enrichment.pr.checks = checks;
      } catch {}
    }

    // Branch protection
    try {
      const bp = await withRetry(() =>
        octokit.repos.getBranchProtection({
          owner,
          repo,
          branch: prData.base.ref,
        }),
      );
      const bpData = bp?.data ?? bp;
      // Project key flags when available
      const flags = {};
      try {
        const rpr = bpData?.required_pull_request_reviews;
        if (rpr && typeof rpr === "object") {
          if (rpr.dismiss_stale_reviews != null)
            flags.dismiss_stale_reviews = !!rpr.dismiss_stale_reviews;
          if (rpr.required_approving_review_count != null)
            flags.required_approvals = Number(
              rpr.required_approving_review_count,
            );
        }
        const rlh = bpData?.required_linear_history;
        if (rlh && typeof rlh === "object" && "enabled" in rlh)
          flags.linear_history = !!rlh.enabled;
        const rsc = bpData?.required_status_checks;
        if (rsc && typeof rsc === "object")
          flags.has_required_status_checks = true;
      } catch {}
      enriched._enrichment.branch_protection = {
        protected: true,
        data: bpData,
        ...(Object.keys(flags).length ? { flags } : {}),
      };
    } catch (e) {
      enriched._enrichment.branch_protection = {
        protected: false,
        partial: true,
      };
      enriched._enrichment.errors.push({
        scope: "branch_protection",
        status: e.status || 0,
      });
      enriched._enrichment.partial = true;
    }
  } else if (event.commits || event.head_commit || event.ref) {
    // push event enrichment using compare between before..after if present
    const before = event.before;
    const after = event.after;
    if (before && after) {
      try {
        const comp = await withRetry(() =>
          octokit.repos.compareCommits({
            owner,
            repo,
            base: before,
            head: after,
          }),
        );
        const files = (comp.data.files || []).slice(0, fileLimit).map((f) => {
          const keys = [
            "filename",
            "status",
            "additions",
            "deletions",
            "changes",
            "sha",
            "blob_url",
            "raw_url",
          ];
          if (includePatch && f.patch) keys.push("patch");
          return pick(f, keys);
        });
        const commits = (comp.data.commits || [])
          .slice(0, commitLimit)
          .map((c) =>
            pick(c, ["sha", "commit", "author", "committer", "parents"]),
          );
        const ownersMap = resolveOwnersForFiles(
          codeOwnerRules,
          files.map((f) => f.filename),
        );
        enriched._enrichment.push = {
          before,
          after,
          total_commits: comp.data.total_commits,
          files,
          commits,
          owners: ownersMap,
        };

        // Status checks for the pushed head commit (after)
        if (after) {
          try {
            enriched._enrichment.push.checks = await fetchCommitChecks(after);
          } catch {}
        }
      } catch (e) {
        enriched._enrichment.partial = true;
        enriched._enrichment.errors.push({
          scope: "compare",
          status: e.status || 0,
        });
      }
    }
  }

  // Issue events: enrich with issue comments
  if (event.issue && !event.pull_request) {
    try {
      const number = event.issue.number || event.number;
      const comments = await fetchIssueComments(number);
      enriched._enrichment.issue = {
        ...(enriched._enrichment.issue || {}),
        number,
        comments,
      };
    } catch {}
  }

  // Issue comment event: fetch original issue and previous comments only
  if (event.comment && event.issue && !event.pull_request) {
    try {
      const number = event.issue.number || event.number;
      const until = event.comment?.created_at;
      const commentsBefore = await fetchIssueComments(number, { until });
      enriched._enrichment.issue_comment_context = {
        issue: event.issue,
        comments_before: commentsBefore,
      };
    } catch {}
  }

  // PR review comment event: fetch PR issue comments, review comments before this
  if (event.comment && (event.pull_request || event.issue?.pull_request)) {
    try {
      const prNumber = event.pull_request?.number || event.issue?.number;
      const until = event.comment?.created_at;
      const issueCommentsBefore = await fetchIssueComments(prNumber, { until });
      const reviewCommentsBefore = await fetchReviewComments(prNumber, {
        until,
      });
      enriched._enrichment.pr_comment_context = {
        pull_request: event.pull_request || { number: prNumber },
        comments_before: issueCommentsBefore,
        review_comments_before: reviewCommentsBefore,
      };
      // Also include status checks for current head sha if available
      const headSha = event.pull_request?.head?.sha;
      if (headSha) {
        enriched._enrichment.pr_comment_context.checks = await fetchCommitChecks(
          headSha,
        );
      }
    } catch {}
  }

  return enriched;
}

export default enrichGithubEvent;
// @ts-nocheck
