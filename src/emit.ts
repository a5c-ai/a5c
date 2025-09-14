import fs from 'node:fs'
import { writeJSONFile, readJSONFile } from './config.js'
import { redactObject } from './utils/redact.js'

export interface EmitOptions {
  in?: string
  out?: string
  sink?: 'stdout' | 'file'
}

export async function handleEmit(opts: EmitOptions): Promise<{ code: number; output: any }> {
  try {
    let obj: any
    if (opts.in) {
      obj = readJSONFile(opts.in)
    } else {
      const raw = fs.readFileSync(0, 'utf8')
      obj = JSON.parse(raw)
    }
    const safe = redactObject(obj)
    const sink = opts.sink || (opts.out ? 'file' : 'stdout')
    if (sink === 'file') {
      if (!opts.out) throw new Error('Missing --out for file sink')
      writeJSONFile(opts.out, safe)
    } else {
      process.stdout.write(JSON.stringify(safe, null, 2) + '\n')
    }
    return { code: 0, output: safe }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`[emit] error: ${msg}\n`)
    return { code: 1, output: { error: msg } }
  }
}

