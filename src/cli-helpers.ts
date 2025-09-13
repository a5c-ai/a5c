export function resolveNormalizeInput(
  inArg: string | undefined,
  source: string | undefined,
  env: NodeJS.ProcessEnv,
): string | undefined {
  if (inArg) return inArg
  if ((source || '').toLowerCase() === 'actions') {
    const p = env.GITHUB_EVENT_PATH
    if (!p || String(p).trim() === '') {
      throw new Error('GITHUB_EVENT_PATH is not set. Provide --in <file> or set --source cli.')
    }
    return p
  }
  return undefined
}

