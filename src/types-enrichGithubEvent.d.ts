// Ambient shims for JS modules imported by TS
// Keep both legacy and new provider paths covered to satisfy TS during build.

// Legacy local module path
declare module './enrichGithubEvent.js' {
  export function enrichGithubEvent(event: any, opts?: any): Promise<any>
  const _default: typeof enrichGithubEvent
  export default _default
}

// Provider shim path introduced by commands refactor
declare module './providers/github/enrich.js' {
  export function enrichGithubEvent(event: any, opts?: any): Promise<any>
  const _default: typeof enrichGithubEvent
  export default _default
}
