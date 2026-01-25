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

const trackPath = args.get("track-json");
if (!trackPath) {
  console.error("Usage: --track-json path/to/track.json");
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(path.resolve(trackPath), "utf8"));
const track = payload.track ?? payload.trackData ?? payload.frames ?? payload.trackSummary;
if (!Array.isArray(track)) {
  console.error("Track JSON does not include a track array.");
  process.exit(1);
}

const sampleRate = Number(args.get("sample-rate") ?? payload.sampleRate ?? 10000);
const leadTime = Number(args.get("lead-time") ?? payload.leadTime ?? 0.05);
const tailTime = Number(args.get("tail-time") ?? payload.tailTime ?? 0.2);
const agcRmsLevel = Number(args.get("agc-rms") ?? 0.18);
const applyAgc = (args.get("agc") ?? "1") === "1";
const agcMode = args.get("agc-mode") ?? "utterance";
const sourceMode = Number(args.get("source-mode"));
const openPhaseRatio = Number(args.get("open-phase-ratio"));
const includeTelemetry = (args.get("include-telemetry") ?? "0") === "1";
const outJson = path.resolve(
  args.get("out-json") ?? path.join(repoRoot, "test", "golden", "qlatt-track.json")
);
const outWav = path.resolve(
  args.get("out-wav") ?? path.join(repoRoot, "test", "golden", "qlatt-track.wav")
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

function toInt16(samples) {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = Math.round(s * 32767);
  }
  return out;
}

function writeWav(filePath, samples, sr) {
  const pcm = toInt16(samples);
  const byteRate = sr * 2;
  const blockAlign = 2;
  const dataSize = pcm.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sr, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < pcm.length; i += 1) {
    buffer.writeInt16LE(pcm[i], 44 + i * 2);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
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

const result = await page.evaluate(async (opts) => {
  const output = await window.renderOffline(opts);
  return output;
}, {
  phrase: payload.phrase ?? "track",
  baseF0: payload.baseF0 ?? 110,
  sampleRate,
  leadTime,
  tailTime,
  track,
  agcRmsLevel,
  applyAgc,
  agcMode,
  sourceMode: Number.isFinite(sourceMode) ? sourceMode : undefined,
  openPhaseRatio: Number.isFinite(openPhaseRatio) ? openPhaseRatio : undefined,
  includeTelemetry,
});

await browser.close();
server.close();

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
writeWav(outWav, result.samples, result.sampleRate);
console.log(`Wrote ${outJson}`);
console.log(`Wrote ${outWav}`);
