export interface EnrichOptions {
  token?: string
  commitLimit?: number
  fileLimit?: number
  octokit?: any
  includePatch?: boolean
}

export declare function enrichGithubEvent(event: any, opts?: EnrichOptions): Promise<any>
declare const _default: typeof enrichGithubEvent
export default _default

// Optional factory that the JS module may export; typed loosely on purpose.
export declare function createOctokit(token?: string): any
