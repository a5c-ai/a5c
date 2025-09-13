import fs from 'node:fs'
import path from 'node:path'

export function getVersionSync(): string {
  try {
    // Resolve from CJS/ESM compiled dist alongside package root
    // Walk up from this file to find package.json
    let dir = path.resolve(path.dirname(new URL(import.meta.url).pathname))
    // in src during dev; in dist during runtime
    for (let i = 0; i < 5; i++) {
      const candidate = path.join(dir, 'package.json')
      if (fs.existsSync(candidate)) {
        const pkg = JSON.parse(fs.readFileSync(candidate, 'utf8'))
        if (pkg && typeof pkg.version === 'string') return pkg.version
      }
      dir = path.dirname(dir)
    }
  } catch {}
  // Fallback to env injected by build/release tooling if present
  if (process.env.npm_package_version) return process.env.npm_package_version
  return '0.0.0'
}

