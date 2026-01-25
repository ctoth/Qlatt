import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { once } from "node:events";
import puppeteer from "puppeteer-core";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const value = process.argv[i + 1];
  args.set(key.slice(2), value);
}

const scriptPath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(scriptPath), "..");

const phrase = args.get("phrase") ?? "hello world";
const baseF0 = Number(args.get("base-f0") ?? 110);
const sampleRate = Number(args.get("sample-rate") ?? 10000);
const leadTime = Number(args.get("lead-time") ?? 0);
const tailTime = Number(args.get("tail-time") ?? 0);
const outJson = path.resolve(
  args.get("out-json") ?? path.join(repoRoot, "test", "golden", "track.json")
);

function resolveChromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function createServer(root) {
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".wasm": "application/wasm",
  };
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const safePath = urlPath === "/" ? "/test/render-offline.html" : urlPath;
    const filePath = safePath.startsWith("/worklets/")
      ? path.resolve(root, "public", safePath.slice(1))
      : path.resolve(root, `.${safePath}`);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const type = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": type });
      fs.createReadStream(filePath).pipe(res);
    });
  });
  return server;
}

const chromePath = resolveChromePath();
if (!chromePath) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to continue.");
  process.exit(1);
}

const server = createServer(repoRoot);
server.listen(0);
await once(server, "listening");
const { port } = server.address();

const browser = await puppeteer.launch({
  headless: "new",
  executablePath: chromePath,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
await page.goto(`http://localhost:${port}/test/render-offline.html`, {
  waitUntil: "networkidle0",
});

const payload = await page.evaluate(async (opts) => {
  const result = await window.renderOffline(opts);
  return result;
}, {
  phrase,
  baseF0,
  sampleRate,
  leadTime,
  tailTime,
  includeTrack: true,
});

await browser.close();
server.close();

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(payload, null, 2));
console.log(`Wrote ${outJson}`);
