// Compatibility proxy: preserve old import path by re-exporting from provider module
export * from './providers/github/enrichGithubEvent.js'
export { default } from './providers/github/enrichGithubEvent.js'

