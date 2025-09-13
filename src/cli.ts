#!/usr/bin/env node
import { Command } from 'commander';
import { extractMentions } from './extractor.js';
import type { ExtractorOptions, MentionSource } from './types.js';
import fs from 'node:fs';

const program = new Command();
program
  .name('events')
  .description('Events CLI - mentions extractor')
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

program.parseAsync(process.argv);

