import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs";
import path from "node:path";

export interface ParseOptions {
  type?: string;
  out?: string;
  pretty?: boolean;
}

export type CodexEvent = {
  type:
    | "user_instructions_event"
    | "tokens_used"
    | "thinking"
    | "codex"
    | "exec"
    | "exec_result"
    | "banner";
  timestamp: string;
  raw: string;
  // Optional fields depending on type
  fields?: Record<string, unknown>;
};

// Streaming, line-by-line parser for Codex stdout format
export class CodexStdoutParser {
  private currentTimestamp: string | null = null;
  private currentType:
    | "user_instructions_event"
    | "thinking"
    | "codex"
    | "exec"
    | "exec_result"
    | "banner"
    | null = null;
  private bufferLines: string[] = [];
  private currentExecMeta: {
    command?: string;
    cwd?: string;
    status?: string;
    durationMs?: number;
    exitCode?: number;
  } | null = null;

  // Regexes
  private readonly tsRe = /^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})\]/;
  private readonly headerUserInstructions = /^User instructions:\s*$/;
  private readonly headerThinking = /^thinking\s*$/;
  private readonly headerCodex = /^codex\s*$/;
  private readonly headerExec = /^exec\s+(.+?)\s+in\s+(.+)\s*$/;
  private readonly headerTokensUsed = /^tokens used:\s*(\d+)\s*$/i;
  private readonly bannerFirst = /^OpenAI Codex\s+(v?.+)$/;
  private readonly bannerRule = /^-+$/;
  private readonly kvLine = /^([^:]+):\s*(.*)$/;
  private readonly successLine = /^(.+?)\s+succeeded\s+in\s+(\d+)ms:$/;
  private readonly exitLine = /^(.+?)\s+exited\s+(\d+)\s+in\s+([0-9.]+)s:$/;

  parseLine(line: string): CodexEvent[] {
    const events: CodexEvent[] = [];

    // New timestamp header may appear with inline content, e.g.:
    // "[2025-09-19T11:58:08] User instructions:" or "[ts] thinking"
    // We should flush previous event, set timestamp, and continue parsing the
    // remainder of the line (after the "] ") in the same call.
    let currentLine = line;
    const tsMatch = this.tsRe.exec(line);
    if (tsMatch) {
      const rest = line.slice(tsMatch[0].length).trimStart();
      if (this.currentType === "exec") {
        // Special-case: exec header is followed by a timestamped result line.
        // Do not flush "exec" yet; continue parsing the rest as part of exec.
        this.currentTimestamp = tsMatch[1];
        // keep currentType = "exec" and existing buffer
        if (rest.length === 0) return events;
        currentLine = rest;
      } else {
        this.flushIfAny(events);
        this.currentTimestamp = tsMatch[1];
        // After timestamp, the next non-empty line defines the subtype
        this.currentType = null;
        this.bufferLines = [];
        if (rest.length === 0) return events;
        currentLine = rest;
      }
    }

    // If we don't have a timestamp yet, ignore preamble
    if (!this.currentTimestamp) return events;

    this.processWithinTimestamp(currentLine, events);
    return events;
  }

  private processWithinTimestamp(
    currentLine: string,
    events: CodexEvent[],
  ): void {
    // Determine subtype if not set
    if (!this.currentType) {
      // Exec result header can appear as its own timestamped line
      const succ = this.successLine.exec(currentLine);
      if (succ) {
        this.currentType = "exec_result";
        this.bufferLines = [currentLine];
        this.currentExecMeta = {
          ...(this.currentExecMeta || {}),
          command: succ[1],
          status: "succeeded",
          durationMs: Number(succ[2]),
        };
        return;
      }
      const ex = this.exitLine.exec(currentLine);
      if (ex) {
        this.currentType = "exec_result";
        this.bufferLines = [currentLine];
        const seconds = Number(ex[3]);
        const durationMs = Number.isFinite(seconds)
          ? Math.round(seconds * 1000)
          : undefined;
        this.currentExecMeta = {
          ...(this.currentExecMeta || {}),
          command: ex[1],
          status: "exited",
          exitCode: Number(ex[2]),
          durationMs,
        };
        return;
      }
      // Tokens used is a single-line event with value
      const tokenM = this.headerTokensUsed.exec(currentLine);
      if (tokenM) {
        events.push({
          type: "tokens_used",
          timestamp: this.currentTimestamp || "",
          raw: currentLine,
          fields: { tokens: Number(tokenM[1]) },
        });
        return;
      }
      if (this.headerUserInstructions.test(currentLine)) {
        this.currentType = "user_instructions_event";
        this.bufferLines = [currentLine];
        return;
      }
      if (this.headerThinking.test(currentLine)) {
        this.currentType = "thinking";
        this.bufferLines = [currentLine];
        return;
      }
      if (this.headerCodex.test(currentLine)) {
        this.currentType = "codex";
        this.bufferLines = [currentLine];
        return;
      }
      // exec header
      const execM = this.headerExec.exec(currentLine);
      if (execM) {
        this.currentType = "exec";
        this.bufferLines = [currentLine];
        this.currentExecMeta = { command: execM[1], cwd: execM[2] };
        // Emit exec header immediately with parsed command and path
        events.push({
          type: "exec",
          timestamp: this.currentTimestamp || "",
          raw: currentLine,
          fields: { command: execM[1], cwd: execM[2] },
        });
        return;
      }
      // Banner start: first line with version
      const bannerM = this.bannerFirst.exec(currentLine);
      if (bannerM) {
        this.currentType = "banner";
        this.bufferLines = [currentLine];
        return;
      }
      // Anything else: treat as body of previous header; but without type, we ignore
      return;
    }

    // We have an active type; accumulate until we detect the next timestamp in caller
    this.bufferLines.push(currentLine);

    // Special handling for exec result: it has a structured closing line
    if (this.currentType === "exec_result") {
      // exec_result body can be multiline; no explicit terminator other than next timestamp
      return;
    }

    if (this.currentType === "exec") {
      // After an exec header, we expect an outcome line like: "<cmd> succeeded in Nms:" then body lines
      const m = this.successLine.exec(currentLine);
      if (m) {
        // Switch to exec_result and store metadata; include this line in buffer
        this.currentType = "exec_result";
        this.bufferLines = [currentLine];
        this.currentExecMeta = {
          ...(this.currentExecMeta || {}),
          command: this.currentExecMeta?.command || m[1],
          status: "succeeded",
          durationMs: Number(m[2]),
        };
        return;
      }
      const e = this.exitLine.exec(currentLine);
      if (e) {
        this.currentType = "exec_result";
        this.bufferLines = [currentLine];
        const seconds = Number(e[3]);
        const durationMs = Number.isFinite(seconds)
          ? Math.round(seconds * 1000)
          : undefined;
        this.currentExecMeta = {
          ...(this.currentExecMeta || {}),
          command: this.currentExecMeta?.command || e[1],
          status: "exited",
          exitCode: Number(e[2]),
          durationMs,
        };
        return;
      }
      return;
    }

    if (this.currentType === "banner") {
      // Banner ends on a line with only dashes after we've seen at least one section of keys and a closing dashes
      // We parse banner once we see the trailing dashed rule (second dashed line)
      if (this.bannerRule.test(currentLine)) {
        // When we got here, bufferLines includes the first line (version) and possibly a dashed line
        // If we now have two dashed separators, we can emit
        const dashedIdxs = this.bufferLines
          .map((l, i) => (this.bannerRule.test(l) ? i : -1))
          .filter((i) => i >= 0);
        if (dashedIdxs.length >= 2) {
          const fields: Record<string, unknown> = {};
          // Extract key: val pairs between the dashed lines
          const start = dashedIdxs[0] + 1;
          const end = dashedIdxs[1];
          for (let i = start; i < end; i++) {
            const kv = this.kvLine.exec(this.bufferLines[i]);
            if (kv) fields[kv[1].trim()] = kv[2].trim();
          }
          const versionMatch = this.bannerFirst.exec(this.bufferLines[0]);
          if (versionMatch) {
            // Preserve leading 'v' and any suffix in the captured version string
            fields["version"] = this.bufferLines[0]
              .replace(/^OpenAI Codex\s+/, "")
              .trim();
          }
          const raw = this.bufferLines.join("\n");
          events.push({
            type: "banner",
            timestamp: this.currentTimestamp || "",
            raw,
            fields,
          });
          // Reset to await next timestamp
          this.currentType = null;
          this.bufferLines = [];
        }
      }
      return;
    }

    // For user_instructions_event, thinking, codex: no internal terminator; they end on next timestamp (handled by flush)
    return;
  }

  flushIfAny(out: CodexEvent[]): void {
    if (!this.currentTimestamp || !this.currentType) {
      this.currentTimestamp = null;
      this.currentType = null;
      this.bufferLines = [];
      this.currentExecMeta = null;
      return;
    }
    // Avoid duplicating the exec header event: it's emitted immediately on detection
    if (this.currentType !== "exec") {
      const raw = this.bufferLines.join("\n");
      let fields: Record<string, unknown> | undefined = undefined;
      if (this.currentType === "exec_result") {
        const lines = raw.split(/\r?\n/);
        const result = lines.length > 1 ? lines.slice(1).join("\n") : "";
        fields = { ...(this.currentExecMeta || {}), result };
      } else if (this.currentType === "thinking") {
        const thought = this.stripHeaderAndTrim(raw, "thinking");
        fields = { thought };
      } else if (this.currentType === "codex") {
        const explanation = this.stripHeaderAndTrim(raw, "codex");
        fields = { explanation };
      }
      const evt: CodexEvent = {
        type: this.currentType,
        timestamp: this.currentTimestamp,
        raw,
        fields,
      };
      out.push(evt);
    }
    this.currentTimestamp = null;
    this.currentType = null;
    this.bufferLines = [];
    this.currentExecMeta = null;
  }

  private stripHeaderAndTrim(raw: string, header: string): string {
    const lines = raw.split(/\r?\n/);
    if (lines.length === 0) return "";
    const first = lines[0];
    const headerRe = new RegExp(`^${header}\\s*$`, "i");
    const rest = headerRe.test(first) ? lines.slice(1) : lines;
    return rest.join("\n").trim();
  }
}

export async function handleParse(
  opts: ParseOptions,
): Promise<{ code: number; errorMessage?: string }> {
  if ((opts.type || "").toLowerCase() !== "codex") {
    return {
      code: 2,
      errorMessage: "parse: unsupported --type (expected 'codex')",
    };
  }

  const parser = new CodexStdoutParser();
  // Optional file writer for JSONL streaming
  let fileStream: fs.WriteStream | null = null;
  if (opts.out) {
    const outPath = path.resolve(String(opts.out));
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fileStream = fs.createWriteStream(outPath, {
      flags: "w",
      encoding: "utf8",
    });
  }
  const rl = readline.createInterface({ input, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const events = parser.parseLine(line);
    for (const evt of events) {
      const rawLine = JSON.stringify(evt);
      if (fileStream) fileStream.write(rawLine + "\n");
      if (opts.pretty) output.write(JSON.stringify(evt, null, 2) + "\n");
      else output.write(rawLine + "\n");
    }
  });
  return await new Promise((resolve) => {
    rl.on("close", () => {
      const tail: CodexEvent[] = [];
      parser.flushIfAny(tail);
      for (const evt of tail) {
        const rawLine = JSON.stringify(evt);
        if (fileStream) fileStream.write(rawLine + "\n");
        if (opts.pretty) output.write(JSON.stringify(evt, null, 2) + "\n");
        else output.write(rawLine + "\n");
      }
      if (fileStream) fileStream.end();
      resolve({ code: 0 });
    });
  });
}
