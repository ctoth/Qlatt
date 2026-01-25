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
const sampleRate = Number(args.get("sample-rate") ?? 22050);
const outJson = args.get("out-json")
  ? path.resolve(args.get("out-json"))
  : path.join(repoRoot, "test", "golden", "phrase-hello-world.json");
const outWav = args.get("out-wav")
  ? path.resolve(args.get("out-wav"))
  : path.join(repoRoot, "test", "golden", "phrase-hello-world.wav");
const goldenPath = args.get("golden")
  ? path.resolve(args.get("golden"))
  : path.join(repoRoot, "test", "golden", "phrase-hello-world.json");
const writeGolden = args.get("write-golden") === "1";
const leadTime = Number(args.get("lead-time") ?? 0.05);
const tailTime = Number(args.get("tail-time") ?? 0.2);

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

function rmsError(actual, expected) {
  let sum = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = actual[i] - expected[i];
    sum += delta * delta;
  }
  return expected.length ? Math.sqrt(sum / expected.length) : 0;
}

function maxDelta(actual, expected) {
  let max = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = Math.abs(actual[i] - expected[i]);
    if (delta > max) max = delta;
  }
  return max;
}

async function createServer(root) {
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
  server.listen(0);
  await once(server, "listening");
  const { port } = server.address();
  return { server, port };
}

const chromePath = resolveChromePath();
if (!chromePath) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to continue.");
  process.exit(1);
}

const { server, port } = await createServer(repoRoot);
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
});

await browser.close();
server.close();

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(payload, null, 2));
writeWav(outWav, payload.samples, payload.sampleRate);

if (!writeGolden) {
  if (!fs.existsSync(goldenPath)) {
    console.error(`Golden missing at ${goldenPath}. Re-run with --write-golden 1.`);
    process.exit(1);
  }
  const golden = JSON.parse(fs.readFileSync(goldenPath, "utf8"));
  const len = Math.min(payload.samples.length, golden.samples.length);
  const actual = payload.samples.slice(0, len);
  const expected = golden.samples.slice(0, len);
  const deltas = {
    lengthMismatch: payload.samples.length - golden.samples.length,
    maxDelta: maxDelta(actual, expected),
    rmsError: rmsError(actual, expected),
  };
  console.log(JSON.stringify({ compare: deltas }, null, 2));
  const maxAllowed = 1e-3;
  if (deltas.maxDelta > maxAllowed) {
    process.exitCode = 1;
  }
}
