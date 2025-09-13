#!/usr/bin/env node
import { Command, Option } from 'commander'
import { loadConfig, writeJSONFile } from './config.js'
import { handleNormalize } from './normalize.js'
import { handleEnrich } from './enrich.js'
import { redactObject } from './utils/redact.js'

const program = new Command()
  .name('events')
  .description('Events SDK/CLI – normalize and enrich repository/CI events')
  .version('0.1.0')

program
  .command('normalize')
  .description('Normalize an event payload to the standard schema')
  .option('--in <file>', 'input JSON file path')
  .option('--out <file>', 'output JSON file path')
  .addOption(new Option('--source <name>', 'source name (actions|webhook|cli)').default('cli'))
  .option('--label <key=value...>', 'labels to attach', collectKeyValue, [])
  .action(async (cmdOpts: any) => {
    const cfg = loadConfig()
    const labels = Object.entries(cmdOpts.label || {}).map(([k, v]) => `${k}=${v}`)
    const { code, output } = await handleNormalize({
      in: cmdOpts.in,
      source: cmdOpts.source,
      labels
    })
    const safe = redactObject(output)
    if (cmdOpts.out) writeJSONFile(cmdOpts.out, safe)
    else process.stdout.write(JSON.stringify(safe, null, 2) + '\n')
    process.exit(code)
  })

program
  .command('enrich')
  .description('Enrich a normalized event with metadata and derived info')
  .option('--in <file>', 'input JSON file path')
  .option('--out <file>', 'output JSON file path')
  .option('--rules <file>', 'rules file path (yaml/json)')
  .option('--flag <key=value...>', 'enrichment flags', collectKeyValue, {})
  .option('--label <key=value...>', 'labels to attach', collectKeyValue, [])
  .action(async (cmdOpts: any) => {
    const flags = cmdOpts.flag || {}
    const labels = Object.entries(cmdOpts.label || {}).map(([k, v]) => `${k}=${v}`)
    const { code, output } = await handleEnrich({
      in: cmdOpts.in,
      labels,
      rules: cmdOpts.rules,
      flags
    })
    const safe = redactObject(output)
    if (cmdOpts.out) writeJSONFile(cmdOpts.out, safe)
    else process.stdout.write(JSON.stringify(safe, null, 2) + '\n')
    process.exit(code)
  })

program.parse()

function collectKeyValue(value: string, previous: any) {
  const target = Array.isArray(previous) ? {} as Record<string, string> : previous || {}
  for (const item of Array.isArray(value) ? value : [value]) {
    const [k, v] = String(item).split('=')
    if (k) target[k] = v ?? 'true'
  }
  return target
}
