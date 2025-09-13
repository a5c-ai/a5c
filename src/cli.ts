#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { normalizeCmd } from './commands/normalize.js';
import { enrichCmd } from './commands/enrich.js';

async function main() {
  const argv = yargs(hideBin(process.argv))
    .scriptName('events')
    .usage('$0 <cmd> [args]')
    .command(normalizeCmd)
    .command(enrichCmd)
    .demandCommand(1, 'Please provide a command')
    .strict()
    .help()
    .parse();

  return argv;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});

