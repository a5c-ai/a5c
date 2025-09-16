// Ambient type for JS module used by TS sources
declare module "./providers/github/enrich.js" {
  export function enrichGithubEvent(event: any, opts?: any): Promise<any>;
  const _default: typeof enrichGithubEvent;
  export default _default;
}
