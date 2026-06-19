#!/usr/bin/env node
// z-build visual companion — a zero-dependency live-reload preview server.
//
// Serves the newest *.html file in a content directory to a browser tab and
// reloads it automatically whenever you write a new screen. Choices come back
// through chat, so there is no auth / event-capture machinery — just preview.
//
// Usage:
//   node server.js [--dir <session-dir>] [--port <n>] [--host <h>] [--open] [--idle-min <n>]
//
// On start it prints a JSON line { url, port, contentDir, pid, infoFile } and
// also writes it to <session-dir>/server-info.json. Write your HTML fragments
// into contentDir; the newest file (by mtime) is what the browser shows.

const http = require("http");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

// ---- args ----------------------------------------------------------------
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};
const has = (name) => args.includes(`--${name}`);

const sessionDir =
  opt("dir") || fs.mkdtempSync(path.join(os.tmpdir(), "z-build-visual-"));
const contentDir = path.join(sessionDir, "content");
const infoFile = path.join(sessionDir, "server-info.json");
const host = opt("host", "127.0.0.1");
const wantPort = parseInt(opt("port", "0"), 10);
const idleMs = parseInt(opt("idle-min", "240"), 10) * 60 * 1000;

fs.mkdirSync(contentDir, { recursive: true });

// ---- newest-file + frame --------------------------------------------------
function newestHtml() {
  let best = null;
  for (const name of fs.readdirSync(contentDir)) {
    if (!name.toLowerCase().endsWith(".html")) continue;
    const full = path.join(contentDir, name);
    const m = fs.statSync(full).mtimeMs;
    if (!best || m > best.m) best = { full, m };
  }
  return best ? fs.readFileSync(best.full, "utf8") : null;
}

// The companion is a pure viewer: it shows screens and live-reloads. Choices
// come back through chat, so there is no click-capture or input affordance.
const SSE = `<script>
  try { new EventSource("/__events").onmessage = () => location.reload(); } catch (e) {}
</script>`;

const WAITING = `<div class="wait"><p class="subtitle">Waiting for the first screen…</p></div>`;

function frame(inner) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>z-build · visual companion</title>
<style>
  :root{--bg:#0f1115;--panel:#1a1d24;--line:#2a2f3a;--fg:#e6e8ec;--mut:#9aa3b2;--acc:#6ea8fe}
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--fg);
    font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif}
  header{padding:12px 24px;border-bottom:1px solid var(--line);color:var(--mut);
    font-size:13px;letter-spacing:.04em;text-transform:uppercase}
  main{max-width:1100px;margin:0 auto;padding:32px 24px}
  h2{font-size:24px;margin:0 0 6px} h3{font-size:17px;margin:0 0 6px}
  .subtitle{color:var(--mut);margin:0 0 24px} .label{font-size:12px;letter-spacing:.08em;
    text-transform:uppercase;color:var(--mut)} .section{margin-bottom:28px}
  .wait{display:flex;align-items:center;justify-content:center;min-height:60vh}
  .options,.cards{display:grid;gap:14px} .cards{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}
  .option{display:flex;gap:14px;align-items:flex-start;padding:16px;border:1px solid var(--line);
    border-radius:10px;background:var(--panel)}
  .letter{width:30px;height:30px;flex:none;border-radius:50%;background:var(--acc);color:#0b0d12;
    font-weight:700;display:flex;align-items:center;justify-content:center}
  .card{border:1px solid var(--line);border-radius:10px;background:var(--panel);overflow:hidden}
  .card-image{height:150px;background:#10131a;display:flex;align-items:center;justify-content:center;color:var(--mut)}
  .card-body{padding:14px}
  .split{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .mockup{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--panel)}
  .mockup-header{padding:8px 12px;background:#10131a;border-bottom:1px solid var(--line);
    font-size:12px;color:var(--mut)} .mockup-body{padding:16px}
  .pros-cons{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .pros,.cons{border:1px solid var(--line);border-radius:10px;padding:14px;background:var(--panel)}
  .pros h4{color:#7ee0a6;margin:0 0 8px} .cons h4{color:#f0a4a4;margin:0 0 8px}
  .mock-nav{padding:10px 14px;background:#10131a;border:1px solid var(--line);border-radius:8px;margin-bottom:10px}
  .mock-sidebar{width:160px;flex:none;padding:14px;background:#10131a;border:1px solid var(--line);border-radius:8px}
  .mock-content{flex:1;padding:14px;border:1px dashed var(--line);border-radius:8px}
  .mock-button{padding:9px 16px;background:var(--acc);color:#0b0d12;border:0;border-radius:8px;font-weight:600}
  .mock-input{padding:9px 12px;background:#10131a;border:1px solid var(--line);border-radius:8px;color:var(--fg);width:100%}
  .placeholder{padding:24px;border:1px dashed var(--line);border-radius:8px;color:var(--mut);text-align:center}
</style></head><body>
<header>z-build · visual companion</header>
<main>${inner}</main>
${SSE}
</body></html>`;
}

// ---- server ---------------------------------------------------------------
let clients = new Set();
let lastActivity = Date.now();

const server = http.createServer((req, res) => {
  lastActivity = Date.now();
  if (req.url === "/__events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("retry: 1000\n\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  if (req.url === "/favicon.ico") {
    res.writeHead(204).end();
    return;
  }
  const content = newestHtml();
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  if (!content) return res.end(frame(WAITING));
  const head = content.trimStart().slice(0, 20).toLowerCase();
  if (head.startsWith("<!doctype") || head.startsWith("<html")) {
    // full document: inject the live-reload client before </body>
    return res.end(
      content.includes("</body>")
        ? content.replace("</body>", SSE + "</body>")
        : content + SSE
    );
  }
  res.end(frame(content));
});

// debounced reload broadcast on content changes
let timer = null;
fs.watch(contentDir, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    for (const c of clients) c.write("data: reload\n\n");
  }, 80);
});

// idle shutdown so we never leak an orphan server
setInterval(() => {
  if (Date.now() - lastActivity > idleMs && clients.size === 0) {
    try { fs.writeFileSync(path.join(sessionDir, "server-stopped"), ""); } catch {}
    process.exit(0);
  }
}, 60 * 1000).unref();

function openBrowser(url) {
  const cmd =
    process.platform === "darwin" ? "open"
    : process.platform === "win32" ? "cmd"
    : "xdg-open";
  const a = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try { spawn(cmd, a, { stdio: "ignore", detached: true }).unref(); } catch {}
}

server.listen(wantPort, host, () => {
  const port = server.address().port;
  const url = `http://${host}:${port}/`;
  const info = { url, port, contentDir, sessionDir, pid: process.pid, infoFile };
  fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));
  try { fs.rmSync(path.join(sessionDir, "server-stopped"), { force: true }); } catch {}
  console.log(JSON.stringify(info));
  if (has("open")) openBrowser(url);
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));
