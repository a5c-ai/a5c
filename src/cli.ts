#!/usr/bin/env node
import { Command, Option } from 'commander'
import fs from 'node:fs'
import { extractMentions } from './extractor.js'
import type { ExtractorOptions, MentionSource } from './types.js'
import { loadConfig, writeJSONFile } from './config.js'
import { cmdNormalize } from './commands/normalize.js'
import { cmdEnrich } from './commands/enrich.js'
import { redactObject } from './utils/redact.js'

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
    process.exit(0)
  })

program
  .command('enrich')
  .description('Enrich a normalized event. No network calls unless --use-github (token required).')
  .option('--in <file>', 'input JSON file path')
  .option('--out <file>', 'output JSON file path')
  .option('--rules <file>', 'rules file path (yaml/json)')
  .option('--flag <key=value...>', 'enrichment flags', collectKeyValue, {})
  .option('--use-github', 'enable GitHub API enrichment (requires GITHUB_TOKEN)')
  .option('--select <paths>', 'comma-separated dot paths to include in output')
  .option('--filter <expr>', 'filter expression path[=value] to gate output')
  .option('--label <key=value...>', 'labels to attach', collectKeyValue, [])
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
    process.exit(0)
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
