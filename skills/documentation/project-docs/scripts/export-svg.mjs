#!/usr/bin/env node
// Export the SVG an archify diagram page offers, by driving a headless Chrome through DevTools.
// Usage: node export-svg.mjs <diagram.html> [<out.svg>] [--chrome <path>] [--timeout <ms>]
// Exit: 0 written, 1 the viewer did not offer the SVG, 2 usage or environment.
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { findChrome, launch } from './lib/cdp.mjs';

const USAGE = 'usage: node export-svg.mjs <diagram.html> [<out.svg>] [--chrome <path>] [--timeout <ms>]';
const EXPORT_BUTTON = '#btn-export';
const SVG_ITEM = '#export-menu [data-format="svg"]';

class ExitError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function parseArgs(argv) {
  const positional = [];
  const options = { chrome: undefined, timeout: 20000 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--chrome' || arg === '--timeout') {
      const value = argv[++i];
      if (value === undefined) throw new ExitError(2, `expected a value after ${arg}, got nothing\n${USAGE}`);
      if (arg === '--chrome') options.chrome = value;
      else {
        options.timeout = Number(value);
        if (!Number.isInteger(options.timeout) || options.timeout <= 0) {
          throw new ExitError(2, `expected --timeout to be a positive integer of milliseconds, got "${value}"`);
        }
      }
    } else if (arg.startsWith('--')) {
      throw new ExitError(2, `expected --chrome or --timeout, got unknown option "${arg}"\n${USAGE}`);
    } else positional.push(arg);
  }
  if (positional.length < 1 || positional.length > 2) {
    throw new ExitError(2, `expected one diagram page and an optional output path, got ${positional.length} arguments\n${USAGE}`);
  }
  const html = resolve(positional[0]);
  if (!existsSync(html) || !statSync(html).isFile()) throw new ExitError(2, `expected an existing HTML file, got "${positional[0]}"`);
  const svg = resolve(positional[1] ?? html.replace(/\.html?$/i, '') + '.svg');
  if (!existsSync(dirname(svg))) throw new ExitError(2, `expected the output folder to exist, got "${dirname(svg)}"`);
  return { html, svg, ...options };
}

function readGenerator(html) {
  const text = readFileSync(html, 'utf8');
  for (const tag of text.match(/<meta\b[^>]*>/gi) ?? []) {
    if (!/\bname\s*=\s*["']generator["']/i.test(tag)) continue;
    return tag.match(/\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i)?.slice(1).find((v) => v !== undefined) ?? null;
  }
  return null;
}

// Runs in the page before its own scripts: keeps each Blob behind an object URL and,
// when a download link points at an SVG blob, holds it instead of downloading it.
const CAPTURE = `(() => {
  const blobs = new Map();
  const create = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (object) => { const url = create(object); if (object instanceof Blob) blobs.set(url, object); return url; };
  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    const blob = blobs.get(this.href);
    if (this.hasAttribute('download') && blob && /^image\\/svg\\+xml\\b/.test(blob.type)) {
      window.__projectDocsSvg = blob;
      return;
    }
    return click.call(this);
  };
})();`;

function waitForEvent(browser, event, sessionId, ms, what) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new ExitError(1, `expected ${what} within ${ms} ms, got nothing`)), ms);
    browser.on(event, (params, from) => { if (from === sessionId) { clearTimeout(timer); resolve(params); } });
  });
}

async function exportSvg({ html, timeout }, browser) {
  const external = [];
  browser.on('Network.requestWillBeSent', ({ request }) => {
    if (!/^(file|data|blob):/i.test(request.url)) external.push(request.url);
  });
  const { targetId } = await browser.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await browser.send('Target.attachToTarget', { targetId, flatten: true });
  await browser.send('Page.enable', {}, sessionId);
  await browser.send('Network.enable', {}, sessionId);
  await browser.send('Page.addScriptToEvaluateOnNewDocument', { source: CAPTURE }, sessionId);

  const loaded = waitForEvent(browser, 'Page.loadEventFired', sessionId, timeout, `the page ${html} to load`);
  const navigation = await browser.send('Page.navigate', { url: pathToFileURL(html).href }, sessionId);
  if (navigation.errorText) throw new ExitError(2, `expected ${html} to open in Chrome, got ${navigation.errorText}`);
  await loaded;

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await browser.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }, sessionId);
    if (exceptionDetails) throw new ExitError(1, `expected the viewer script to run, got: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    return result.value;
  };
  const press = async (selector) => {
    const found = await evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.click(); return true; })()`);
    if (!found) throw new ExitError(1, `expected the viewer to have ${selector} in ${html}, found none`);
  };
  await press(EXPORT_BUTTON);
  await press(SVG_ITEM);

  const base64 = await evaluate(`(async () => {
    const deadline = Date.now() + ${timeout};
    while (!window.__projectDocsSvg && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
    if (!window.__projectDocsSvg) return null;
    const bytes = new Uint8Array(await window.__projectDocsSvg.arrayBuffer());
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return btoa(binary);
  })()`);
  if (base64 === null) {
    throw new ExitError(1, `expected ${SVG_ITEM} to offer an image/svg+xml download within ${timeout} ms, got none`);
  }
  return { bytes: Buffer.from(base64, 'base64'), external };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const found = args.chrome !== undefined
    ? { path: existsSync(args.chrome) ? args.chrome : null, tried: [args.chrome] }
    : findChrome({});
  if (!found.path) {
    throw new ExitError(2, `expected a Chrome executable (pass --chrome <path> or set CHROME_PATH), tried: ${found.tried.join(', ') || 'nothing'}`);
  }

  let browser;
  const stop = async (signal) => {
    await browser?.close();
    process.exit(signal === 'SIGINT' ? 130 : 143);
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    browser = await launch(found.path).catch((error) => { throw new ExitError(2, error.message); });
    const { bytes, external } = await exportSvg(args, browser);
    writeFileSync(args.svg, bytes);
    process.stdout.write(JSON.stringify({
      html: args.html, svg: args.svg, bytes: bytes.length, generator: readGenerator(args.html), external_requests: external,
    }) + '\n');
    if (external.length) process.stderr.write(`warning: expected only file:, data: or blob: requests, got ${external.length} other: ${external.join(', ')}\n`);
  } finally {
    await browser?.close();
  }
}

main().catch((error) => {
  process.stderr.write(`export-svg: ${error.message}\n`);
  process.exitCode = error instanceof ExitError ? error.code : 2;
});
