// Find a local Chrome and drive it through the DevTools protocol, with Node only.
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const STARTUP_MS = 15000;
const CLOSE_MS = 5000;

const CANDIDATES = {
  darwin: () => [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  ],
  linux: () => [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
  ],
  win32: (env) => ['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA']
    .filter((key) => env[key])
    .map((key) => join(env[key], 'Google', 'Chrome', 'Application', 'chrome.exe')),
};

// Explicit path first, then CHROME_PATH, then the usual install locations of the platform.
export function findChrome({ explicit, env = process.env, platform = process.platform } = {}) {
  const tried = [];
  const candidates = [explicit, env.CHROME_PATH, ...(CANDIDATES[platform]?.(env) ?? [])];
  for (const candidate of candidates) {
    if (!candidate) continue;
    tried.push(candidate);
    if (existsSync(candidate)) return { path: candidate, tried };
  }
  return { path: null, tried };
}

function waitForExit(proc, ms) {
  if (proc.exitCode !== null || proc.signalCode !== null) return Promise.resolve(true);
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    proc.once('exit', () => { clearTimeout(timer); resolve(true); });
  });
}

function readDevToolsUrl(proc) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => reject(new Error(
      `expected Chrome to print "DevTools listening on ws://..." within ${STARTUP_MS} ms, got: ${stderr.trim().slice(-300) || 'no output'}`)), STARTUP_MS);
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) { clearTimeout(timer); resolve(match[1]); }
    });
    proc.once('error', (error) => { clearTimeout(timer); reject(new Error(`expected to start Chrome, got: ${error.message}`)); });
    proc.once('exit', (code, signal) => {
      clearTimeout(timer);
      reject(new Error(`expected Chrome to keep running, it exited with ${signal ?? code}: ${stderr.trim().slice(-300) || 'no output'}`));
    });
  });
}

// The browser's helper processes keep writing for a moment after it exits, so a first removal can find the
// folder busy. Retry instead of failing: true when the folder is gone, false when it could not be removed.
export async function removeTree(path, { attempts = 25, delay = 200, remove = (target) => rmSync(target, { recursive: true, force: true }) } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      remove(path);
      return true;
    } catch {
      if (attempt < attempts) await new Promise((done) => setTimeout(done, delay));
    }
  }
  return false;
}

// Start a headless Chrome on a fresh temporary profile; close() stops it, removes the profile and returns
// the profile path only when it could not be removed.
export async function launch(chromePath) {
  const profile = mkdtempSync(join(tmpdir(), 'project-docs-chrome-'));
  const proc = spawn(chromePath, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-sync',
    '--disable-background-networking', '--disable-component-update', '--disable-default-apps',
    '--metrics-recording-only', '--password-store=basic', '--use-mock-keychain', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  let socket = null;
  let closed = false;
  let leftover = null;
  const close = async () => {
    if (closed) return leftover;
    closed = true;
    // Ask the browser to end itself first: that also ends its helper processes, which a signal to the
    // main process does not.
    try {
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ id: 0, method: 'Browser.close' }));
    } catch { /* fall through to the signals */ }
    if (!(await waitForExit(proc, CLOSE_MS))) {
      proc.kill('SIGTERM');
      if (!(await waitForExit(proc, CLOSE_MS))) {
        proc.kill('SIGKILL');
        await waitForExit(proc, CLOSE_MS);
      }
    }
    try { socket?.close(); } catch { /* the socket may already be gone */ }
    leftover = (await removeTree(profile)) ? null : profile;
    return leftover;
  };

  try {
    const url = await readDevToolsUrl(proc);
    socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', () => reject(new Error(`expected a DevTools connection at ${url}, got a socket error`)), { once: true });
    });
  } catch (error) {
    await close();
    throw error;
  }

  let nextId = 0;
  const pending = new Map();
  const listeners = new Map();
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id !== undefined) {
      const call = pending.get(message.id);
      if (!call) return;
      pending.delete(message.id);
      if (message.error) call.reject(new Error(`${call.method} failed: ${message.error.message}`));
      else call.resolve(message.result);
      return;
    }
    for (const listener of listeners.get(message.method) ?? []) listener(message.params, message.sessionId);
  });
  socket.addEventListener('close', () => {
    for (const call of pending.values()) call.reject(new Error(`${call.method} failed: the DevTools connection closed`));
    pending.clear();
  });

  return {
    send(method, params = {}, sessionId) {
      if (closed) return Promise.reject(new Error(`${method} failed: Chrome is already closed`));
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, { method, resolve, reject });
        socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      });
    },
    on(event, listener) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(listener);
    },
    close,
  };
}
