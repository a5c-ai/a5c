import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

dotenv.config()

export type AppConfig = {
  githubToken?: string
  debug?: boolean
}

export function loadConfig(): AppConfig {
  return {
    githubToken: process.env.A5C_AGENT_GITHUB_TOKEN || process.env.GITHUB_TOKEN,
    debug: (process.env.DEBUG || '').toLowerCase() === 'true'
  }
}

export function readJSONFile<T = unknown>(filePath?: string): T | undefined {
  if (!filePath) return undefined
  const abs = path.resolve(filePath)
  const data = fs.readFileSync(abs, 'utf8')
  return JSON.parse(data) as T
}

export function writeJSONFile(filePath: string, data: unknown): void {
  const abs = path.resolve(filePath)
  fs.mkdirSync(path.dirname(abs), { recursive: true })
  fs.writeFileSync(abs, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

export function dirname(importMetaUrl: string): string {
  const __filename = fileURLToPath(importMetaUrl)
  return path.dirname(__filename)
}

