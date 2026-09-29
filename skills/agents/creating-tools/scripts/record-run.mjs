#!/usr/bin/env node
// record-run.mjs — runs a tool and archives the run under docs/tools/<slug>/runs/<ts>/.
// Captures command.txt + run.log + output/, exports RUN_OUTPUT_DIR and moves output/latest.
//
// Single-source Node (no deps) so it runs the same on native Windows, macOS and Linux
// — same contract/outputs as the former record-run.sh. Invoke: `node record-run.mjs …`.

import { spawnSync } from "node:child_process";
import {
  appendFileSync, existsSync, mkdirSync, openSync, closeSync,
  rmSync, statSync, symlinkSync, writeFileSync,
} from "node:fs";
import { constants as osConstants } from "node:os";
import { join, resolve } from "node:path";

const USAGE = `Usage: record-run.mjs <tool-slug> [--docs-dir DIR] -- <command> [args...]
  Runs <command> (from the current cwd, with RUN_OUTPUT_DIR pointing at the run)
  and captures command.txt + run.log + output/ under
  docs/tools/<slug>/runs/<YYYY-MM-DD_HH-MM-SS>/, then updates output/latest.
`;

function usage(code = 0) {
  process.stderr.write(USAGE);
  process.exit(code);
}

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

// Shell-style quoting (%q): re-runnable. Leaves simple tokens untouched;
// wraps the rest in single quotes, escaping the inner quotes.
function shQuote(s) {
  if (s === "") return "''";
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, "'\\''")}'`;
}

const argv = process.argv.slice(2);
if (argv.length < 1) usage(1);
if (argv[0] === "-h" || argv[0] === "--help") usage(0);

const slug = argv[0];
let docsDir = "docs/tools";
const command = [];
for (let i = 1; i < argv.length; i++) {
  const flag = argv[i];
  if (flag === "--docs-dir") {
    const v = argv[i + 1];
    if (v === undefined || v === "") { process.stderr.write("--docs-dir requires a value\n"); usage(1); }
    docsDir = v;
    i++;
  } else if (flag === "--") {
    command.push(...argv.slice(i + 1));
    break;
  } else if (flag === "-h" || flag === "--help") {
    usage(0);
  } else {
    process.stderr.write(`unknown flag before '--': ${flag}\n`);
    usage(1);
  }
}
if (command.length < 1) { process.stderr.write("missing the command after '--'\n"); usage(1); }

const toolDir = join(docsDir, slug);
if (!existsSync(toolDir) || !statSync(toolDir).isDirectory()) {
  process.stderr.write(`${toolDir} does not exist — run first: node scaffold-tool.mjs ${slug}\n`);
  process.exit(1);
}

const ts = stamp();
const runDir = join(toolDir, "runs", ts);
mkdirSync(join(runDir, "output"), { recursive: true });
const absOut = resolve(runDir, "output");

const commandTxt = join(runDir, "command.txt");
const runLog = join(runDir, "run.log");

// command.txt — exact command + args (re-runnable).
writeFileSync(commandTxt, `${command.map(shQuote).join(" ")} \n`);

// Run capturing stdout+stderr; the tool may write results to $RUN_OUTPUT_DIR.
const logFd = openSync(runLog, "w");
let result;
try {
  result = spawnSync(command[0], command.slice(1), {
    stdio: ["inherit", logFd, logFd],
    env: { ...process.env, RUN_OUTPUT_DIR: absOut },
  });
} finally {
  closeSync(logFd);
}

let code;
if (typeof result.status === "number") {
  code = result.status;
} else if (result.signal) {
  const n = osConstants.signals[result.signal];
  code = n ? 128 + n : 1; // bash: death by signal => 128+n
} else if (result.error) {
  appendFileSync(runLog, `${result.error.message}\n`);
  code = result.error.code === "ENOENT" ? 127 : 126; // not found / not executable
} else {
  code = 1;
}
appendFileSync(commandTxt, `exit_code=${code}\n`);

// output/latest -> this run (best-effort; a FS without symlinks does not break it).
try {
  const latest = join(toolDir, "output", "latest");
  rmSync(latest, { force: true });
  symlinkSync(join("..", "runs", ts, "output"), latest);
} catch { /* FS without symlinks (or no permission on Windows): the run does not break */ }

process.stderr.write(`run archived in ${runDir} (exit ${code})\n`);
process.exit(code);
