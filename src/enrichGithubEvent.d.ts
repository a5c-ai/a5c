// Type declarations for the JS implementation in src/enrichGithubEvent.js
// Provide explicit declarations so TS does not complain when importing the JS module.

export interface EnrichOptions {
  token?: string
  commitLimit?: number
  fileLimit?: number
  octokit?: any
}

export declare function enrichGithubEvent(event: any, opts?: EnrichOptions): Promise<any>
export declare function createOctokit(token?: string): any
declare const _default: typeof enrichGithubEvent
export default _default

