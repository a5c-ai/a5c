export interface GithubEntityParsed {
  owner: string;
  repo: string;
  number: number;
}

export interface GithubOwnerRepoParsed {
  owner: string;
  repo: string;
}

/**
 * Parse a GitHub Issue/PR URL (web or API form) into { owner, repo, number }.
 *
 * Supported shapes:
 * - https://github.com/:owner/:repo/issues/:number
 * - https://github.com/:owner/:repo/pull/:number
 * - https://api.github.com/repos/:owner/:repo/issues/:number
 * - https://api.github.com/repos/:owner/:repo/pulls/:number
 *
 * Returns null for invalid inputs.
 */
export function parseGithubEntity(url: any): GithubEntityParsed | null {
  try {
    const s = typeof url === "string" ? url.trim() : "";
    if (!s) return null;
    // Accept query strings/fragments; match path components only
    // Web URL: /:owner/:repo/(issues|pull)/:number
    const web =
      /https?:\/\/[^\s?#]+\/(?<owner>[^\/#]+)\/(?<repo>[^\/#]+)\/(?:issues|pull)\/(?<num>\d+)/i;
    const mWeb = web.exec(s);
    if (mWeb && mWeb.groups) {
      const owner = mWeb.groups.owner;
      const repo = stripGitSuffix(mWeb.groups.repo);
      const num = Number(mWeb.groups.num);
      if (owner && repo && Number.isFinite(num))
        return { owner, repo, number: num };
    }
    // API URL: /repos/:owner/:repo/(issues|pulls)/:number
    const api =
      /https?:\/\/[^\s?#]+\/repos\/(?<owner>[^\/#]+)\/(?<repo>[^\/#]+)\/(?:issues|pulls)\/(?<num>\d+)/i;
    const mApi = api.exec(s);
    if (mApi && mApi.groups) {
      const owner = mApi.groups.owner;
      const repo = stripGitSuffix(mApi.groups.repo);
      const num = Number(mApi.groups.num);
      if (owner && repo && Number.isFinite(num))
        return { owner, repo, number: num };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse a GitHub repo URL (web or API form) into { owner, repo }.
 *
 * Supported shapes:
 * - https://github.com/:owner/:repo[...]
 * - https://api.github.com/repos/:owner/:repo[...]
 *
 * Returns null for invalid inputs.
 */
export function parseGithubOwnerRepo(url: any): GithubOwnerRepoParsed | null {
  try {
    const s = typeof url === "string" ? url.trim() : "";
    if (!s) return null;
    // API first: /repos/:owner/:repo
    const api =
      /https?:\/\/[^\s?#]+\/repos\/(?<owner>[^\/#]+)\/(?<repo>[^\/#]+)(?:[\/#?].*)?$/i;
    const mApi = api.exec(s);
    if (mApi && mApi.groups) {
      const owner = mApi.groups.owner;
      const repo = stripGitSuffix(mApi.groups.repo);
      if (owner && repo) return { owner, repo };
    }
    // Web: /:owner/:repo
    const web =
      /https?:\/\/[^\s?#]+\/(?<owner>[^\/#]+)\/(?<repo>[^\/#]+)(?:[\/#?].*)?$/i;
    const mWeb = web.exec(s);
    if (mWeb && mWeb.groups) {
      const owner = mWeb.groups.owner;
      const repo = stripGitSuffix(mWeb.groups.repo);
      if (owner && repo) return { owner, repo };
    }
    return null;
  } catch {
    return null;
  }
}

function stripGitSuffix(repo: string): string {
  return repo.endsWith(".git") ? repo.slice(0, -4) : repo;
}
