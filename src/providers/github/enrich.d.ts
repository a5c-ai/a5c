export interface EnrichOptions {
  token?: string;
  commitLimit?: number;
  fileLimit?: number;
  octokit?: any;
}

export declare function enrichGithubEvent(
  event: any,
  opts?: EnrichOptions,
): Promise<any>;
export default enrichGithubEvent;
