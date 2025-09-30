import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import module from "node:module";
import { pathToFileURL } from "node:url";
import { handleReactor } from "../reactor.js";
import { handleEmit } from "../emit.js";

export interface RunMiniCommandOptions {
  commandName: string;
  args: string[];
  dry?: boolean;
  reactorFile?: string;
  reactorBranch?: string;
  emitSink?: "stdout" | "file" | "github";
  emitOut?: string;
}

type TempFile = { dir: string; file: string };

export async function handleRunCommand(
  opts: RunMiniCommandOptions,
): Promise<{ code: number; errorMessage?: string }> {
  try {
    const commandsDir = path.resolve(".a5c", "cli_commands");
    if (!directoryExists(commandsDir)) {
      return {
        code: 2,
        errorMessage: `run-command: directory '${commandsDir}' not found. Did you run 'a5c init'?`,
      };
    }

    const scriptPath = resolveCommandScript(commandsDir, opts.commandName);
    if (!scriptPath) {
      return {
        code: 2,
        errorMessage: `run-command: command '${opts.commandName}' not found under '${commandsDir}'`,
      };
    }

    ensureModuleResolution(path.dirname(scriptPath));

    const { event } = await executeMiniCommand(scriptPath, opts);
    const events = {
      events: [event],
    }
    if (opts.dry) {
      process.stdout.write(JSON.stringify(events, null, 2) + "\n");
      return { code: 0 };
    }
    
    const tempInputs: TempFile[] = [];
    try {
      const eventTemp = writeTempJson(events, "event");
      tempInputs.push(eventTemp);

      const { code: reactorCode, output, errorMessage } = await handleReactor({
        in: eventTemp.file,
        file: opts.reactorFile,
        branch: opts.reactorBranch,
      });
      if (reactorCode !== 0) {
        return {
          code: reactorCode,
          errorMessage: errorMessage || "run-command: reactor execution failed",
        };
      }

      const reactorOutput = output ?? { events: [] };
      const reactorTemp = writeTempJson(reactorOutput, "reactor-output");
      tempInputs.push(reactorTemp);

      const emitResult = await handleEmit({
        in: reactorTemp.file,
        sink: opts.emitSink,
        out: opts.emitOut,
      });
      if (emitResult.code !== 0) {
        return {
          code: emitResult.code,
          errorMessage: "run-command: emit failed",
        };
      }

      return { code: 0 };
    } finally {
      for (const temp of tempInputs) {
        try {
          fs.rmSync(temp.dir, { recursive: true, force: true });
        } catch {}
      }
    }
  } catch (e: any) {
    return {
      code: 1,
      errorMessage: `run-command: ${String(e?.message || e)}`,
    };
  }
}

async function executeMiniCommand(
  scriptPath: string,
  opts: RunMiniCommandOptions,
): Promise<{ event: any }> {
  const args = [...opts.args];
  const sanitizedName = sanitizeCommandName(opts.commandName);
  const previousEnv = process.env.A5C_RUN_COMMAND_NAME;
  process.env.A5C_RUN_COMMAND_NAME = opts.commandName;

  const program = await loadCommandProgram(scriptPath);
  if (typeof program.exitOverride === "function") {
    program.exitOverride((err: any) => {
      throw err;
    });
  }

  const output = await captureStdout(async () => {
    const argv = ["node", scriptPath, sanitizedName, ...args];
    await program.parseAsync(argv, { from: "user" as any });
  });

  if (previousEnv === undefined) delete process.env.A5C_RUN_COMMAND_NAME;
  else process.env.A5C_RUN_COMMAND_NAME = previousEnv;

  const event = parseJsonOutput(output, opts.commandName);
  return { event };
}

function parseJsonOutput(output: string, commandName: string): any {
  const trimmed = output.trim();
  if (!trimmed) {
    throw new Error(`command '${commandName}' produced no JSON output`);
  }
  try {
    return JSON.parse(trimmed);
  } catch {}

  const lines = trimmed.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).reverse();
  for (const line of lines) {
    if (!(line.startsWith("{") || line.startsWith("["))) continue;
    try {
      return JSON.parse(line);
    } catch {}
  }
  throw new Error(`command '${commandName}' output is not valid JSON`);
}

function writeTempJson(obj: any, suffix: string): TempFile {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `a5c-run-command-${suffix}-`));
  const file = path.join(dir, `${suffix}-${crypto.randomUUID()}.json`);
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
  return { dir, file };
}

function resolveCommandScript(baseDir: string, commandName: string): string | null {
  const sanitized = sanitizeCommandName(commandName).replace(/\\/g, "/");
  const hasExt = /\.[a-z0-9]+$/i.test(sanitized);
  const candidates: string[] = [];

  if (path.isAbsolute(sanitized)) {
    candidates.push(sanitized);
  } else {
    const targetBase = path.resolve(baseDir, sanitized);
    if (!isPathInside(targetBase, baseDir)) return null;
    if (hasExt) {
      candidates.push(targetBase);
    } else {
      candidates.push(`${targetBase}.js`, `${targetBase}.mjs`, `${targetBase}.cjs`);
      candidates.push(path.join(targetBase, "index.js"));
    }
  }

  for (const candidate of candidates) {
    if (fileExists(candidate)) return candidate;
  }
  return null;
}

function fileExists(p: string): boolean {
  try {
    const st = fs.statSync(p);
    return st.isFile();
  } catch {
    return false;
  }
}

function directoryExists(p: string): boolean {
  try {
    const st = fs.statSync(p);
    return st.isDirectory();
  } catch {
    return false;
  }
}

function isPathInside(child: string, parent: string): boolean {
  const rel = path.relative(parent, child);
  return !rel.startsWith("..") && !path.isAbsolute(rel);
}

function sanitizeCommandName(name: string): string {
  return name.startsWith("@") ? name.slice(1) : name;
}

const nodeModule = module as unknown as {
  globalPaths: string[];
  Module?: { globalPaths: string[]; _initPaths?: () => void };
  _initPaths?: () => void;
};

function ensureModuleResolution(moduleDir: string): void {
  const resolvePaths = nodeModule.Module?.globalPaths || nodeModule.globalPaths;
  if (!Array.isArray(resolvePaths)) return;
  const currentNodePath = process.env.NODE_PATH
    ? process.env.NODE_PATH.split(path.delimiter)
    : [];
  const candidates = new Set<string>([
    ...resolvePaths,
    path.resolve("node_modules"),
    path.resolve(moduleDir, "node_modules"),
    ...currentNodePath,
  ]);
  process.env.NODE_PATH = Array.from(candidates).join(path.delimiter);
  nodeModule.Module?._initPaths?.();
  if (typeof nodeModule._initPaths === "function") nodeModule._initPaths();
}

async function loadCommandProgram(scriptPath: string): Promise<any> {
  const url = pathToFileURL(scriptPath);
  url.searchParams.set("t", Date.now().toString());
  const mod = await import(url.href);
  const program = (mod && (mod.default || mod.program)) || mod;
  if (!program || typeof program.parseAsync !== "function") {
    throw new Error(
      `run-command: default export of '${scriptPath}' is not a commander program`,
    );
  }
  return program;
}

async function captureStdout(fn: () => Promise<void>): Promise<string> {
  const originalWrite = process.stdout.write.bind(process.stdout);
  let buffer = "";
  (process.stdout.write as unknown) = ((chunk: any, encoding?: any, cb?: any) => {
    const str =
      typeof chunk === "string"
        ? chunk
        : Buffer.from(chunk, encoding as BufferEncoding | undefined).toString();
    buffer += str;
    if (typeof cb === "function") cb();
    return true;
  }) as typeof process.stdout.write;
  try {
    await fn();
  } finally {
    (process.stdout.write as unknown) = originalWrite;
  }
  return buffer;
}

