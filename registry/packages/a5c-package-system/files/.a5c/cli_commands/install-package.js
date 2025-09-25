
// imported to cli

// called by the run-command cli command
// a5c run-command install-package -- github://owner/repo/ref/path

// inputs:
// - package uri: string (github://owner/repo/ref/path)

const program = {
  _exitHandler: undefined,
  exitOverride(handler) {
    this._exitHandler = handler;
  },
  async parseAsync(argv) {
    try {
      const [, , ...rest] = argv;
      if (!rest.length) throw new Error("install-package: missing subcommand");
      const sub = rest.shift();
      if (sub !== "install-package") throw new Error("install-package: expected 'install-package'");
      const parsed = parseArgs(rest);
      if (!parsed.pkg) throw new Error("install-package: missing package argument (--package <uri>)");
      const event = buildEvent(parsed.pkg);
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

function parseArgs(tokens) {
  const out = { pkg: undefined };
  const queue = [...tokens];
  while (queue.length) {
    const token = queue.shift();
    if (!token) continue;
    if (token === "--") break;
    if (token === "--package" || token === "-p") {
      const value = queue.shift();
      if (!value) throw new Error("install-package: --package requires a value");
      out.pkg = value;
      continue;
    }
    if (token.startsWith("--package=")) {
      out.pkg = token.slice("--package=".length);
      continue;
    }
    if (!token.startsWith("-")) {
      out.pkg = token;
      continue;
    }
    throw new Error(`install-package: unrecognised option '${token}'`);
  }
  return out;
}

function buildEvent(uri) {
  return {
    type: "a5c_package_installer_request",
    payload: {
      original_event: {
        type: "install_package",
        payload: {
          package: uri,
        },
      },
      issue: {
        html_url: "non-existing-issue",
        number: 1,
        closed: false,
        labels: [],
        body: "install a5c-package-system",
      },
    },
  };
}

export default program;