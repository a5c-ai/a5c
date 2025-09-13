import type { CommandModule } from 'yargs';
import { readFile, writeFile } from 'node:fs/promises';

export const normalizeCmd: CommandModule = {
  command: 'normalize',
  describe: 'Normalize a provider event payload to a standard schema',
  builder: (yargs) =>
    yargs
      .option('in', { type: 'string', describe: 'Input JSON file (raw event)' })
      .option('out', { type: 'string', describe: 'Output JSON file' })
      .option('provider', { type: 'string', default: 'github', describe: 'Event provider' }),
  handler: async (args) => {
    const inputPath = args.in as string | undefined;
    let payload: any = {};
    if (inputPath) {
      try {
        const text = await readFile(inputPath, 'utf8');
        payload = JSON.parse(text);
      } catch (e) {
        console.error(`Failed to read input file: ${inputPath}`);
        throw e;
      }
    }
    // Basic minimal normalized output stub
    const normalized = {
      id: 'local-dev',
      provider: String(args.provider || 'github'),
      type: 'unknown',
      occurred_at: new Date().toISOString(),
      repo: {},
      ref: {},
      actor: {},
      payload: payload || {},
      enriched: { metadata: {}, derived: {}, correlations: {} },
      labels: [],
      provenance: { source: 'cli' }
    };

    const outPath = args.out as string | undefined;
    const json = JSON.stringify(normalized, null, 2);
    if (outPath) {
      await writeFile(outPath, json);
      console.log(`Wrote ${outPath}`);
    } else {
      console.log(json);
    }
  }
};
