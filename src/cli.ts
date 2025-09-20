#!/usr/bin/env node
import { Command, Option } from "commander";
import fs from "node:fs";
import { extractMentions } from "./extractor.js";
import type { ExtractorOptions, MentionSource } from "./types.js";
import { loadConfig, writeJSONFile } from "./config.js";
import { cmdNormalize } from "./commands/normalize.js";
import { handleEnrich } from "./enrich.js";
import { handleReactor } from "./reactor.js";
import { handleGenerateContext } from "./generateContext.js";
import { handleEmit } from "./emit.js";
import { handleRun } from "./commands/run.js";
import { handleParse } from "./commands/parse.js";
import { redactObject } from "./utils/redact.js";
import path from "node:path";
// Avoid loading heavy JSON Schema validator unless needed
// Ajv is required only for the `validate` command; lazy-load it inside the action.

const program = new Command();
program
  .name("events")
  .description("Events CLI - mentions, normalize and enrich")
  .version(readVersion());

// Global logging flags (mapped to env for downstream code)
program
  .option(
    "--log-level <level>",
    "logging level (info|debug|warn|error); maps to A5C_LOG_LEVEL",
  )
  .addOption(
    new Option(
      "--log-format <format>",
      "logging format (pretty|json); maps to A5C_LOG_FORMAT",
    ).choices(["pretty", "json"] as any),
  );

// Normalize and export logging opts to env before any command action
program.hook("preAction", (thisCmd) => {
  const opts = thisCmd.optsWithGlobals?.() || thisCmd.opts?.() || {};
  const lvl = opts.logLevel || opts["log-level"]; // commander camelCase
  const fmt = opts.logFormat || opts["log-format"]; // commander camelCase
  if (lvl) {
    const v = String(lvl).toLowerCase();
    const allowed = new Set([
      "debug",
      "info",
      "warn",
      "error",
      "trace",
      "warning",
    ]);
    if (!allowed.has(v)) {
      process.stderr.write(
        `invalid --log-level: ${lvl} (expected info|debug|warn|error)\n`,
      );
      process.exit(2);
    }
    process.env.A5C_LOG_LEVEL = v === "warning" ? "warn" : v;
  }
  if (fmt) {
    const v = String(fmt).toLowerCase();
    if (!(v === "pretty" || v === "json")) {
      process.stderr.write(
        `invalid --log-format: ${fmt} (expected pretty|json)\n`,
      );
      process.exit(2);
    }
    process.env.A5C_LOG_FORMAT = v;
  }
});

// Explicit `version` subcommand for parity with flag usage
program
  .command("version")
  .description("Print CLI version")
  .option("--json", "print as JSON {version}")
  .action((opts: any) => {
    const v = readVersion();
    if (opts.json) {
      process.stdout.write(JSON.stringify({ version: v }) + "\n");
    } else {
      process.stdout.write(v + "\n");
    }
    process.exit(0);
  });

program
  .command("mentions")
  .description("Extract mentions from text or file")
  .option("-s, --source <source>", "Mention source kind", "pr_body")
  .option("-f, --file <path>", "Path to file (optional)")
  .option("--window <n>", "Context window size", (v) => parseInt(v, 10), 30)
  .option(
    "--known-agent <name...>",
    "Known agent names to boost confidence",
    [],
  )
  .action((opts: any) => {
    const src = opts.source as MentionSource;
    let text = "";
    if (opts.file) {
      text = fs.readFileSync(opts.file, "utf8");
    } else {
      text = fs.readFileSync(0, "utf8"); // stdin
    }
    const options: ExtractorOptions = {
      window: opts.window,
      knownAgents: opts.knownAgent || opts.knownAgents || [],
    };
    try {
      const mentions = extractMentions(text, src, options);
      process.stdout.write(JSON.stringify(mentions, null, 2) + "\n");
      process.exit(0);
    } catch (e: any) {
      process.stderr.write(String(e?.message || e) + "\n");
      process.exit(1);
    }
  });

program
  .command("normalize")
  .description("Normalize an event payload to the standard schema")
  .option("--in <file>", "input JSON file path")
  .option("--out <file>", "output JSON file path")
  .addOption(
    new Option(
      "--source <name>",
      "source name (action|webhook|cli); accepts 'actions' as input alias; persists 'action'",
    ).default("cli"),
  )
  .option("--select <paths>", "comma-separated dot paths to include in output")
  .option("--filter <expr>", "filter expression path[=value] to gate output")
  .option("--label <key=value...>", "labels to attach", collectKeyValue, [])
  .action(async (cmdOpts: any) => {
    const cfg = loadConfig();
    void cfg;
    const labels = Object.entries(cmdOpts.label || {}).map(
      ([k, v]) => `${k}=${v}`,
    );
    const { code, output, errorMessage } = await cmdNormalize({
      in: cmdOpts.in,
      source: cmdOpts.source,
      labels,
    });
    if (code !== 0 || !output) {
      if (errorMessage) process.stderr.write(errorMessage + "\n");
      return process.exit(code || 1);
    }
    // filter/select
    const { selectFields, parseFilter, passesFilter } = await import(
      "./utils/selectFilter.js"
    );
    const filterSpec = parseFilter(cmdOpts.filter);
    if (!passesFilter(output as any, filterSpec)) {
      return process.exit(2);
    }
    const selected = cmdOpts.select
      ? selectFields(
          output as any,
          String(cmdOpts.select)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        )
      : output;
    const safe = redactObject(selected);
    try {
      if (cmdOpts.out) writeJSONFile(cmdOpts.out, safe);
      else process.stdout.write(JSON.stringify(safe, null, 2) + "\n");
    } catch (e: any) {
      process.stderr.write(String(e?.message || e) + "\n");
      return process.exit(1);
    }
    process.exit(0);
  });

program
  .command("generate_context")
  .description("Render a prompt/context file from templates and event context")
  .option("--in <file>", "input JSON event file (default: stdin)")
  .option("--template <uri>", "root template URI (md/yaml)")
  .option("--out <file>", "output file (default: stdout)")
  .option(
    "--var <key=value...>",
    "extra template variables",
    collectKeyValue,
    {},
  )
  .option(
    "--token <str>",
    "GitHub token for github:// URIs (default: env tokens)",
  )
  .action(async (cmdOpts: any) => {
    const { code, output, errorMessage } = await handleGenerateContext({
      in: cmdOpts.in,
      template: cmdOpts.template,
      out: cmdOpts.out,
      vars: cmdOpts.var,
      token: cmdOpts.token,
    });
    if (code !== 0) {
      if (errorMessage) process.stderr.write(errorMessage + "\n");
      return process.exit(code);
    }
    if (typeof output === "string") {
      if (cmdOpts.out) fs.writeFileSync(cmdOpts.out, output, "utf8");
      else process.stdout.write(output);
    }
    process.exit(0);
  });

program
  .command("enrich")
  .description("Enrich a normalized event with metadata and derived info")
  .option("--in <file>", "input JSON file path")
  .option("--out <file>", "output JSON file path")
  .option("--rules <file>", "rules file path (yaml/json)")
  .option("--flag <key=value...>", "enrichment flags", collectKeyValue, {})
  .option(
    "--use-github",
    "enable GitHub API enrichment (requires token; A5C_AGENT_GITHUB_TOKEN preferred). On missing token, exits with code 3",
  )
  .option("--select <paths>", "comma-separated dot paths to include in output")
  .option("--filter <expr>", "filter expression path[=value] to gate output")
  .option("--label <key=value...>", "labels to attach", collectKeyValue, [])
  .action(async (cmdOpts: any) => {
    const flags = { ...(cmdOpts.flag || {}) } as Record<string, any>;
    // Default input: $GITHUB_EVENT_PATH if --in not provided
    const envIn = process.env.GITHUB_EVENT_PATH;
    const inPath: string | undefined = cmdOpts.in || envIn || undefined;
    if (!inPath) {
      process.stderr.write(
        "enrich: missing input; provide --in or set GITHUB_EVENT_PATH\n",
      );
      return process.exit(2);
    }

    // Determine --use-github behavior: offline by default; enable only when flag is set
    // Optional escape hatch for CI: A5C_EVENTS_AUTO_USE_GITHUB=true auto-enables when a token exists
    const cfg = loadConfig();
    const token = cfg.githubToken;
    const explicitUseGithub = !!(cmdOpts.useGithub || cmdOpts["use-github"]);
    const autoEnv = String(
      process.env.A5C_EVENTS_AUTO_USE_GITHUB || "",
    ).toLowerCase();
    const autoRequested =
      autoEnv === "1" ||
      autoEnv === "true" ||
      autoEnv === "yes" ||
      autoEnv === "on";
    const requestedUseGithub = explicitUseGithub || (autoRequested && !!token);
    if (explicitUseGithub && !token) {
      process.stderr.write(
        "GitHub enrichment failed: token is required when --use-github is set\n",
      );
      return process.exit(3);
    }
    if (requestedUseGithub && token) flags.use_github = "true";
    const labels = Object.entries(cmdOpts.label || {}).map(
      ([k, v]) => `${k}=${v}`,
    );
    const { code, output } = await handleEnrich({
      in: inPath,
      labels,
      rules: cmdOpts.rules,
      flags,
    });
    if (code !== 0 || !output) {
      return process.exit(code || 1);
    }
    const { selectFields, parseFilter, passesFilter } = await import(
      "./utils/selectFilter.js"
    );
    const filterSpec = parseFilter(cmdOpts.filter);
    if (!passesFilter(output as any, filterSpec)) {
      return process.exit(2);
    }
    const selected = cmdOpts.select
      ? selectFields(
          output as any,
          String(cmdOpts.select)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        )
      : output;
    const safe = redactObject(selected);
    try {
      if (cmdOpts.out) writeJSONFile(cmdOpts.out, safe);
      else process.stdout.write(JSON.stringify(safe, null, 2) + "\n");
    } catch (e: any) {
      process.stderr.write(String(e?.message || e) + "\n");
      return process.exit(1);
    }
    process.exit(0);
  });

program
  .command("emit")
  .description("Emit an event to a sink (stdout or file)")
  .option("--in <file>", "input JSON file path (default: stdin)")
  .option("-s, --single <file>", "single event file path (use '-' for stdin)")
  .option("--out <file>", "output JSON file path (for file sink)")
  .option("--sink <name>", "sink name (stdout|file|github)")
  .action(async (cmdOpts: any) => {
    const inputPath = cmdOpts.single || cmdOpts.in;
    const { code } = await handleEmit({
      in: inputPath,
      out: cmdOpts.out,
      sink: cmdOpts.sink,
    });
    process.exit(code);
  });

program
  .command("reactor")
  .description(
    "Apply reactor rules to produce custom events (stdin->stdout by default)",
  )
  .option("--in <file>", "input JSON file path (default: stdin)")
  .option(
    "--out <file>",
    "output JSON file path (default: stdout; contains {events: [...]})",
  )
  .option(
    "--file <path>",
    "reactor rules path (file or directory), default .a5c/events/",
  )
  .option(
    "--branch <name>",
    "config branch for remote YAML when not present locally (default: env A5C_EVENT_CONFIG_BRANCH or 'main')",
  )
  .option(
    "--metadata-match <key=value...>",
    "filter by doc.metadata key=val (repeatable)",
    collectKeyValue,
    {},
  )
  .action(async (cmdOpts: any) => {
    try {
      const { code, output, errorMessage } = await handleReactor({
        in: cmdOpts.in,
        out: cmdOpts.out,
        file: cmdOpts.file,
        branch: cmdOpts.branch || process.env.A5C_EVENT_CONFIG_BRANCH || "main",
        metadataMatch: cmdOpts.metadataMatch || cmdOpts["metadata-match"] || {},
      });
      if (code !== 0) {
        if (errorMessage) process.stderr.write(errorMessage + "\n");
        return process.exit(code);
      }
      if (cmdOpts.out) writeJSONFile(cmdOpts.out, output);
      else process.stdout.write(JSON.stringify(output, null, 2) + "\n");
      process.exit(0);
    } catch (e: any) {
      process.stderr.write(String(e?.message || e) + "\n");
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate a JSON payload against the NE schema")
  .option("--in <file>", "input JSON file path (defaults to stdin if omitted)")
  .option("--schema <file>", "schema file path", "docs/specs/ne.schema.json")
  .option("--quiet", "print nothing on success, only errors", false)
  .action(async (cmdOpts: any) => {
    try {
      const { default: Ajv } = await import("ajv");
      const inputStr = cmdOpts.in
        ? fs.readFileSync(path.resolve(cmdOpts.in), "utf8")
        : fs.readFileSync(0, "utf8");
      const data = JSON.parse(inputStr);
      const schema = JSON.parse(
        fs.readFileSync(path.resolve(cmdOpts.schema), "utf8"),
      );
      const ajv = new Ajv({ strict: false, allErrors: true });
      // Inline minimal 2020-12 meta-schema so Ajv can compile referenced schema
      const meta2020 = {
        $id: "https://json-schema.org/draft/2020-12/schema",
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $vocabulary: {
          "https://json-schema.org/draft/2020-12/vocab/core": true,
          "https://json-schema.org/draft/2020-12/vocab/applicator": true,
          "https://json-schema.org/draft/2020-12/vocab/unevaluated": true,
          "https://json-schema.org/draft/2020-12/vocab/validation": true,
          "https://json-schema.org/draft/2020-12/vocab/meta-data": true,
          "https://json-schema.org/draft/2020-12/vocab/format-annotation": true,
          "https://json-schema.org/draft/2020-12/vocab/content": true,
        },
        type: ["object", "boolean"],
      } as const;
      // Minimal date-time support to avoid ajv-formats ESM issues in CLI runtime
      ajv.addFormat("date-time", {
        type: "string",
        validate: (s: string) => /\d{4}-\d{2}-\d{2}T\d{2}:.+Z/.test(s),
      } as any);
      // ensure meta registered
      // @ts-ignore
      ajv.addMetaSchema(meta2020);
      const validate = ajv.compile(schema);
      const ok = validate(data);
      if (!ok) {
        const errs = validate.errors || [];
        const out = {
          valid: false,
          errorCount: errs.length,
          errors: errs.map((e) => ({
            instancePath: e.instancePath,
            schemaPath: e.schemaPath,
            message: e.message,
            params: e.params,
          })),
        };
        process.stdout.write(JSON.stringify(out, null, 2) + "\n");
        process.exit(2);
      }
      if (!cmdOpts.quiet) {
        process.stdout.write(JSON.stringify({ valid: true }, null, 2) + "\n");
      }
      process.exit(0);
    } catch (err: any) {
      const msg = String(err?.message || err);
      process.stderr.write(`validate: ${msg}\n`);
      process.exit(1);
    }
  });

program
  .command("run")
  .description(
    "Run an AI provider CLI using predefined profiles (see predefined.yaml)",
  )
  .option(
    "--in <uri>",
    "prompt input (file://, github://, path, or '-' for stdin)",
  )
  .option("--out <file>", "output file to write final content (optional)")
  .option("--profile <name>", "profile name from predefined.yaml")
  .option("--model <name>", "model override for the selected profile")
  .option("--mcps <file>", "path to mcps.json (default .a5c/mcps.json)")
  .option(
    "--config <uri>",
    "path/URI to config YAML overriding predefined.yaml (file:// or github:// supported)",
  )
  .action(async (cmdOpts: any) => {
    const { code, errorMessage } = await handleRun({
      in: cmdOpts.in,
      out: cmdOpts.out,
      profile: cmdOpts.profile,
      model: cmdOpts.model,
      mcps: cmdOpts.mcps,
      config: cmdOpts.config,
    });
    if (code !== 0 && errorMessage) process.stderr.write(errorMessage + "\n");
    process.exit(code);
  });

program
  .command("parse")
  .description("Parse streamed stdout logs into JSON events (stdin->stdout)")
  .option("--type <name>", "parser type (codex)")
  .action(async (cmdOpts: any) => {
    const { code, errorMessage } = await handleParse({ type: cmdOpts.type });
    if (code !== 0 && errorMessage) process.stderr.write(errorMessage + "\n");
    process.exit(code);
  });

program.parseAsync(process.argv);

function collectKeyValue(value: string | string[], previous: any) {
  const target = Array.isArray(previous)
    ? ({} as Record<string, string>)
    : previous || {};
  for (const item of Array.isArray(value) ? value : [value]) {
    const [k, v] = String(item).split("=");
    if (k) target[k] = v ?? "true";
  }
  return target;
}

function readVersion(): string {
  try {
    const pkgUrl = new URL("../package.json", import.meta.url);
    const pkgStr = fs.readFileSync(pkgUrl, "utf8");
    const pkg = JSON.parse(pkgStr) as { version?: string };
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}
