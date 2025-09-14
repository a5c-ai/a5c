#!/usr/bin/env node
import { Command, Option } from 'commander'
import fs from 'node:fs'
import { extractMentions } from './extractor.js'
import type { ExtractorOptions, MentionSource } from './types.js'
import { loadConfig, writeJSONFile } from './config.js'
import { cmdNormalize } from './commands/normalize.js'
import { cmdEnrich } from './commands/enrich.js'
import { handleEmit } from './emit.js'
import { redactObject } from './utils/redact.js'
import path from 'node:path'
import Ajv from 'ajv'

const program = new Command()
program
  .name('events')
  .description('Events CLI - mentions, normalize and enrich')
  .version('0.1.0')

program
  .command('mentions')
  .description('Extract mentions from text or file')
  .option('-s, --source <source>', 'Mention source kind', 'pr_body')
  .option('-f, --file <path>', 'Path to file (optional)')
  .option('--window <n>', 'Context window size', (v) => parseInt(v, 10), 30)
  .option('--known-agent <name...>', 'Known agent names to boost confidence', [])
  .action((opts: any) => {
    const src = opts.source as MentionSource
    let text = ''
    if (opts.file) {
      text = fs.readFileSync(opts.file, 'utf8')
    } else {
      text = fs.readFileSync(0, 'utf8') // stdin
    }
    const options: ExtractorOptions = {
      window: opts.window,
      knownAgents: opts.knownAgent || opts.knownAgents || [],
    }
    try {
      const mentions = extractMentions(text, src, options)
      process.stdout.write(JSON.stringify(mentions, null, 2) + '\n')
      process.exit(0)
    } catch (e: any) {
      process.stderr.write(String(e?.message || e) + '\n')
      process.exit(1)
    }
  })

program
  .command('normalize')
  .description('Normalize an event payload to the standard schema')
  .option('--in <file>', 'input JSON file path')
  .option('--out <file>', 'output JSON file path')
  .addOption(new Option('--source <name>', 'source name (actions|webhook|cli)').default('cli'))
  .option('--validate', 'validate output against NE schema')
  .option('--select <paths>', 'comma-separated dot paths to include in output')
  .option('--filter <expr>', 'filter expression path[=value] to gate output')
  .option('--label <key=value...>', 'labels to attach', collectKeyValue, [])
  .action(async (cmdOpts: any) => {
    const cfg = loadConfig()
    void cfg
    const labels = Object.entries(cmdOpts.label || {}).map(([k, v]) => `${k}=${v}`)
    const { code, output, errorMessage } = await cmdNormalize({
      in: cmdOpts.in,
      source: cmdOpts.source,
      labels,
    })
    if (code !== 0 || !output) {
      if (errorMessage) process.stderr.write(errorMessage + '\n')
      return process.exit(code || 1)
    }
    // optional schema validation (on full output before select/filter)
    if (cmdOpts.validate) {
      try {
        const { validateNE, formatErrors } = await import('./validate.js')
        const res = validateNE(output)
        if (!res.valid) {
          const lines = formatErrors(res.errors)
          process.stderr.write('Validation failed (NE schema):\n' + lines.map((l) => ' - ' + l).join('\n') + '\n')
          return process.exit(3)
        }
      } catch (e: any) {
        process.stderr.write('Validator error: ' + String(e?.message || e) + '\n')
        return process.exit(2)
      }
    }
    // filter/select
    const { selectFields, parseFilter, passesFilter } = await import('./utils/selectFilter.js')
    const filterSpec = parseFilter(cmdOpts.filter)
    if (!passesFilter(output as any, filterSpec)) {
      return process.exit(2)
    }
    const selected = cmdOpts.select ? selectFields(output as any, String(cmdOpts.select).split(',').map((s) => s.trim()).filter(Boolean)) : output
    const safe = redactObject(selected)
    try {
      if (cmdOpts.out) writeJSONFile(cmdOpts.out, safe)
      else process.stdout.write(JSON.stringify(safe, null, 2) + '\n')
    } catch (e: any) {
      process.stderr.write(String(e?.message || e) + '\n')
      return process.exit(1)
    }
    process.exit(0)
  })

program
  .command('enrich')
  .description('Enrich a normalized event with metadata and derived info')
  .option('--in <file>', 'input JSON file path')
  .option('--out <file>', 'output JSON file path')
  .option('--rules <file>', 'rules file path (yaml/json)')
  .option('--flag <key=value...>', 'enrichment flags', collectKeyValue, {})
  .option('--use-github', 'enable GitHub API enrichment (requires GITHUB_TOKEN)')
  .option('--select <paths>', 'comma-separated dot paths to include in output')
  .option('--filter <expr>', 'filter expression path[=value] to gate output')
  .option('--label <key=value...>', 'labels to attach', collectKeyValue, [])
  .option('--validate', 'validate output against NE schema')
  .action(async (cmdOpts: any) => {
    const flags = { ...(cmdOpts.flag || {}) }
    if (cmdOpts.useGithub || cmdOpts['use-github']) flags.use_github = 'true'
    const labels = Object.entries(cmdOpts.label || {}).map(([k, v]) => `${k}=${v}`)
    const { code, output, errorMessage } = await cmdEnrich({
      in: cmdOpts.in,
      labels,
      rules: cmdOpts.rules,
      flags,
    })
    if (code !== 0 || !output) {
      if (errorMessage) process.stderr.write(errorMessage + '\n')
      return process.exit(code || 1)
    }
    const { selectFields, parseFilter, passesFilter } = await import('./utils/selectFilter.js')
    const filterSpec = parseFilter(cmdOpts.filter)
    if (!passesFilter(output as any, filterSpec)) {
      return process.exit(2)
    }
    // optional schema validation (on full output before select/filter)
    if (cmdOpts.validate) {
      try {
        const { validateNE, formatErrors } = await import('./validate.js')
        const res = validateNE(output)
        if (!res.valid) {
          const lines = formatErrors(res.errors)
          process.stderr.write('Validation failed (NE schema):\n' + lines.map((l) => ' - ' + l).join('\n') + '\n')
          return process.exit(3)
        }
      } catch (e: any) {
        process.stderr.write('Validator error: ' + String(e?.message || e) + '\n')
        return process.exit(2)
      }
    }
    const selected = cmdOpts.select ? selectFields(output as any, String(cmdOpts.select).split(',').map((s) => s.trim()).filter(Boolean)) : output
    const safe = redactObject(selected)
    try {
      if (cmdOpts.out) writeJSONFile(cmdOpts.out, safe)
      else process.stdout.write(JSON.stringify(safe, null, 2) + '\n')
    } catch (e: any) {
      process.stderr.write(String(e?.message || e) + '\n')
      return process.exit(1)
    }
    process.exit(0)
  })

program
  .command('emit')
  .description("Emit an event to a sink (stdout or file)")
  .option('--in <file>', 'input JSON file path (default: stdin)')
  .option('--out <file>', 'output JSON file path (for file sink)')
  .option('--sink <name>', 'sink name (stdout|file)', 'stdout')
  .action(async (cmdOpts: any) => {
    const { code, output } = await handleEmit({
      in: cmdOpts.in,
      out: cmdOpts.out,
      sink: cmdOpts.sink,
    })
    // handleEmit already wrote to sink; also print redacted to stdout if sink=file and no --quiet flag (future)
    if (cmdOpts.sink !== 'file' && !cmdOpts.out) {
      const safe = redactObject(output)
      process.stdout.write(JSON.stringify(safe, null, 2) + '\n')
    }
    process.exit(code)
  })

program
  .command('validate')
  .description('Validate a JSON payload against the NE schema')
  .option('--in <file>', 'input JSON file path (defaults to stdin if omitted)')
  .option('--schema <file>', 'schema file path', 'docs/specs/ne.schema.json')
  .option('--quiet', 'print nothing on success, only errors', false)
  .action(async (cmdOpts: any) => {
    try {
      const inputStr = cmdOpts.in ? fs.readFileSync(path.resolve(cmdOpts.in), 'utf8') : fs.readFileSync(0, 'utf8')
      const data = JSON.parse(inputStr)
      const schema = JSON.parse(fs.readFileSync(path.resolve(cmdOpts.schema), 'utf8'))
      const ajv = new Ajv({ strict: false, allErrors: true })
      // Inline minimal 2020-12 meta-schema so Ajv can compile referenced schema
      const meta2020 = {
        $id: 'https://json-schema.org/draft/2020-12/schema',
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        $vocabulary: {
          'https://json-schema.org/draft/2020-12/vocab/core': true,
          'https://json-schema.org/draft/2020-12/vocab/applicator': true,
          'https://json-schema.org/draft/2020-12/vocab/unevaluated': true,
          'https://json-schema.org/draft/2020-12/vocab/validation': true,
          'https://json-schema.org/draft/2020-12/vocab/meta-data': true,
          'https://json-schema.org/draft/2020-12/vocab/format-annotation': true,
          'https://json-schema.org/draft/2020-12/vocab/content': true
        },
        type: ['object', 'boolean']
      } as const
      // Minimal date-time support to avoid ajv-formats ESM issues in CLI runtime
      ajv.addFormat('date-time', {
        type: 'string',
        validate: (s: string) => /\d{4}-\d{2}-\d{2}T\d{2}:.+Z/.test(s)
      } as any)
      // ensure meta registered
      // @ts-ignore
      ajv.addMetaSchema(meta2020)
      const validate = ajv.compile(schema)
      const ok = validate(data)
      if (!ok) {
        const errs = validate.errors || []
        const out = {
          valid: false,
          errorCount: errs.length,
          errors: errs.map((e) => ({
            instancePath: e.instancePath,
            schemaPath: e.schemaPath,
            message: e.message,
            params: e.params
          }))
        }
        process.stdout.write(JSON.stringify(out, null, 2) + '\n')
        process.exit(2)
      }
      if (!cmdOpts.quiet) {
        process.stdout.write(JSON.stringify({ valid: true }, null, 2) + '\n')
      }
      process.exit(0)
    } catch (err: any) {
      const msg = String(err?.message || err)
      process.stderr.write(`validate: ${msg}\n`)
      process.exit(1)
    }
  })

program.parseAsync(process.argv)

function collectKeyValue(value: string | string[], previous: any) {
  const target = Array.isArray(previous) ? ({} as Record<string, string>) : previous || {}
  for (const item of (Array.isArray(value) ? value : [value])) {
    const [k, v] = String(item).split('=')
    if (k) target[k] = v ?? 'true'
  }
  return target
}
