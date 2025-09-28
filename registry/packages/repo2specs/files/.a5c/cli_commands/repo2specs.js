// Repo2Specs CLI helper

const program = {
  _exitHandler: undefined,
  exitOverride(handler) {
    this._exitHandler = handler;
  },
  async parseAsync(argv) {
    try {
      const [, , ...rest] = argv;
      if (!rest.length) throw new Error("repo2specs: missing subcommand");
      const sub = rest.shift();
      if (!COMMANDS[sub]) throw new Error(`repo2specs: unknown subcommand '${sub}'`);
      const parsed = parseArgs(rest);
      const event = buildEvent(sub, parsed);
      process.stdout.write(JSON.stringify(event) + "\n");
    } catch (err) {
      if (this._exitHandler) {
        this._exitHandler(err instanceof Error ? err : new Error(String(err)));
        return;
      }
      throw err;
    }
  },
};

const COMMANDS = {
  intake: {
    event: "repo2specs_intake",
  },
  analyse: {
    event: "repo2specs_deep_analysis",
  },
  analyze: {
    event: "repo2specs_deep_analysis",
  },
  followup: {
    event: "repo2specs_followup",
  },
  refresh: {
    event: "repo2specs_refresh",
  },
};

function parseArgs(tokens) {
  const out = { scope: undefined, labels: [] };
  const queue = [...tokens];
  while (queue.length) {
    const token = queue.shift();
    if (!token) continue;
    if (token === "--") break;
    if (token === "--scope") {
      const value = queue.shift();
      if (!value) throw new Error("repo2specs: --scope requires a value");
      out.scope = value;
      continue;
    }
    if (token.startsWith("--scope=")) {
      out.scope = token.slice("--scope=".length);
      continue;
    }
    if (token === "--label" || token === "-l") {
      const value = queue.shift();
      if (!value) throw new Error("repo2specs: --label requires a value");
      out.labels.push(value);
      continue;
    }
    if (token.startsWith("--label=")) {
      out.labels.push(token.slice("--label=".length));
      continue;
    }
    throw new Error(`repo2specs: unrecognised option '${token}'`);
  }
  return out;
}

function buildEvent(command, args) {
  const meta = COMMANDS[command];
  return {
    type: meta.event,
    payload: {
      original_event: {
        type: "cli_repo2specs",
        payload: {
          command,
          scope: args.scope,
          labels: args.labels,
        },
      },
    },
  };
}

export default program;

