#!/usr/bin/env node
// scaffold-tool.mjs — creates the docs/tools/<slug>/ structure for a new tool.
// Idempotent: never overwrites an already-edited README; ensures runs/ and output/; creates docs/tools if missing.
//
// Single-source Node (no deps) so it runs the same on native Windows, macOS and Linux
// — same contract/outputs as the former scaffold-tool.sh. Invoke: `node scaffold-tool.mjs …`.

import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const USAGE = `Usage: scaffold-tool.mjs <tool-slug> [--type T] [--repo ALIAS] [--path REL] [--docs-dir DIR]
  <tool-slug>     short, clear, descriptive name (kebab-case). No numbering.
  --type T        script | cli | helper | generator | config-template   (default: script)
  --repo ALIAS    alias of the source where the code lives (code-in-repo model)
  --path REL      relative path of the code inside the repo
  --docs-dir DIR  root of docs/tools (default: docs/tools, relative to the cwd)

Creates docs/tools/<slug>/{README.md, runs/, output/} and adds the tool to the docs/tools/README.md index.
`;

function usage(code = 0) {
  process.stderr.write(USAGE);
  process.exit(code);
}

function die(msg) {
  process.stderr.write(`${msg}\n`);
  process.exit(1);
}

function ymd(d = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const argv = process.argv.slice(2);
if (argv.length < 1) usage(1);
if (argv[0] === "-h" || argv[0] === "--help") usage(0);
if (argv[0].startsWith("-")) {
  process.stderr.write("the first argument must be the slug\n");
  usage(1);
}

const slug = argv[0];
let type = "script";
let repo = "";
let relpath = "";
let docsDir = "docs/tools";

for (let i = 1; i < argv.length; i++) {
  const flag = argv[i];
  const needValue = (name) => {
    const v = argv[i + 1];
    if (v === undefined || v === "") die(`${name} requires a value`);
    i++;
    return v;
  };
  switch (flag) {
    case "--type": type = needValue("--type"); break;
    case "--repo": repo = needValue("--repo"); break;
    case "--path": relpath = needValue("--path"); break;
    case "--docs-dir": docsDir = needValue("--docs-dir"); break;
    case "-h": case "--help": usage(0); break;
    default:
      process.stderr.write(`unknown flag: ${flag}\n`);
      usage(1);
  }
}

// valid slug: kebab-case (a-z, 0-9, hyphens), no hyphen at the start/end.
if (slug === "" || slug.startsWith("-") || slug.endsWith("-") || /[^a-z0-9-]/.test(slug)) {
  die(`invalid slug '${slug}' — use kebab-case (a-z, 0-9, hyphens)`);
}

const toolDir = join(docsDir, slug);
mkdirSync(join(toolDir, "runs"), { recursive: true }); // creates docs/tools if missing
mkdirSync(join(toolDir, "output"), { recursive: true });

const readme = join(toolDir, "README.md");
if (existsSync(readme)) {
  process.stderr.write(`preserved: ${readme} already exists (not overwritten)\n`);
} else {
  const template = join(SCRIPT_DIR, "..", "assets", "README.template.md");
  const today = ymd();
  const model = repo ? "code-in-repo" : "self-contained";
  if (existsSync(template)) {
    const rendered = readFileSync(template, "utf8")
      .replaceAll("{{SLUG}}", slug)
      .replaceAll("{{TYPE}}", type)
      .replaceAll("{{MODEL}}", model)
      .replaceAll("{{REPO}}", repo || "self-contained")
      .replaceAll("{{PATH}}", relpath || "./")
      .replaceAll("{{DATE}}", today);
    writeFileSync(readme, rendered);
  } else {
    writeFileSync(
      readme,
      `# ${slug}\n\n> **Type**: ${type} · **Model**: ${model} · **Repo**: ${repo || "self-contained"} · **Path**: ${relpath || "./"} · **Created**: ${today}\n\n## Purpose\n\n[what it does and when to use it]\n`,
    );
  }
  process.stdout.write(`created: ${readme}\n`);
}

// docs/tools/README.md index (creates the header if missing; adds the row if absent).
const index = join(docsDir, "README.md");
if (!existsSync(index)) {
  writeFileSync(
    index,
    "# Tools\n\nAuxiliary tools (skill `creating-tools`).\n\n| Tool | Purpose | Repo | Created |\n|---|---|---|---|\n",
  );
}
const indexBody = existsSync(index) ? readFileSync(index, "utf8") : "";
if (!indexBody.includes(`(${slug}/README.md)`)) {
  appendFileSync(index, `| [${slug}](${slug}/README.md) | — | ${repo || "self-contained"} | ${ymd()} |\n`);
  process.stdout.write(`index updated: ${index}\n`);
}

process.stdout.write(`OK — docs/tools/${slug}/ ready (runs/ + output/ + README.md).\n`);
