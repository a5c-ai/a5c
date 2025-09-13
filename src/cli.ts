#!/usr/bin/env node
import { Command, Option } from 'commander';
import fs from 'node:fs';
import { extractMentions } from './extractor.js';
import type { ExtractorOptions, MentionSource } from './types.js';
import { loadConfig, writeJSONFile } from './config.js';
import { handleNormalize } from './normalize.js';
import { handleEnrich } from './enrich.js';
import { redactObject } from './utils/redact.js';

const program = new Command();
program
  .name('events')
  .description('Events CLI - mentions, normalize and enrich')
  .version('0.1.0');

program
  .command('mentions')
  .description('Extract mentions from text or file')
  .option('-s, --source <source>', 'Mention source kind', 'pr_body')
  .option('-f, --file <path>', 'Path to file (optional)')
  .option('--window <n>', 'Context window size', (v) => parseInt(v, 10), 30)
  .option('--known-agent <name...>', 'Known agent names to boost confidence', [])
  .action((opts: any) => {
    const src = opts.source as MentionSource;
    let text = '';
    if (opts.file) {
      text = fs.readFileSync(opts.file, 'utf8');
    } else {
      text = fs.readFileSync(0, 'utf8'); // stdin
    }
    const options: ExtractorOptions = {
      window: opts.window,
      knownAgents: opts.knownAgent || opts.knownAgents || [],
    };
    const mentions = extractMentions(text, src, options);
    process.stdout.write(JSON.stringify(mentions, null, 2) + '\n');
  });

program
  .command('normalize')
  .description('Normalize an event payload to the standard schema')
  .option('--in <file>', 'input JSON file path')
  .option('--out <file>', 'output JSON file path')
  .addOption(new Option('--source <name>', 'source name (actions|webhook|cli)').default('cli'))
  .option('--label <key=value...>', 'labels to attach', collectKeyValue, [])
  .action(async (cmdOpts: any) => {
    const cfg = loadConfig();
    void cfg; // currently unused but reserved for future needs
    const labels = Object.entries(cmdOpts.label || {}).map(([k, v]) => `${k}=${v}`);
    const { code, output } = await handleNormalize({
      in: cmdOpts.in,
      source: cmdOpts.source,
      labels,
    });
    const safe = redactObject(output);
    if (cmdOpts.out) writeJSONFile(cmdOpts.out, safe);
    else process.stdout.write(JSON.stringify(safe, null, 2) + '\n');
    process.exit(code);
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
    const flags = cmdOpts.flag || {};
    const labels = Object.entries(cmdOpts.label || {}).map(([k, v]) => `${k}=${v}`);
    const { code, output } = await handleEnrich({
      in: cmdOpts.in,
      labels,
      rules: cmdOpts.rules,
      flags,
    });
    const safe = redactObject(output);
    if (cmdOpts.out) writeJSONFile(cmdOpts.out, safe);
    else process.stdout.write(JSON.stringify(safe, null, 2) + '\n');
    process.exit(code);
  })

program.parseAsync(process.argv);

function collectKeyValue(value: string, previous: any) {
  const target = Array.isArray(previous) ? ({} as Record<string, string>) : previous || {};
  for (const item of (Array.isArray(value) ? value : [value])) {
    const [k, v] = String(item).split('=');
    if (k) target[k] = v ?? 'true';
  }
  return target;
}
