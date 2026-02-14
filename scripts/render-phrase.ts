import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { createServer as createViteServer } from "vite";

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
const includeTrack = (args.get("include-track") ?? "0") === "1";
const leadTime = Number(args.get("lead-time") ?? 0.05);
const tailTime = Number(args.get("tail-time") ?? 0.2);
const noiseSeed = Number(args.get("noise-seed") ?? 20260214);
const persistJson = writeGolden || args.has("out-json");
const persistWav = writeGolden || args.has("out-wav");

type RenderMetrics = { rms: number; peak: number };
type RenderPayload = {
  phrase: string;
  baseF0: number;
  sampleRate: number;
  leadTime: number;
  tailTime: number;
  length: number;
  metrics: RenderMetrics;
  trackSummary: {
    events: number;
    totalTime: number;
    voicedEvents: number;
    f0Min: number;
    f0Max: number;
  };
  samples: number[];
};

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

function toInt16(samples: ArrayLike<number>): Int16Array {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = Math.round(s * 32767);
  }
  return out;
}

function writeWav(filePath: string, samples: ArrayLike<number>, sr: number): void {
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

function rmsError(actual: ArrayLike<number>, expected: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = actual[i] - expected[i];
    sum += delta * delta;
  }
  return expected.length ? Math.sqrt(sum / expected.length) : 0;
}

function maxDelta(actual: ArrayLike<number>, expected: ArrayLike<number>): number {
  let max = 0;
  for (let i = 0; i < expected.length; i += 1) {
    const delta = Math.abs(actual[i] - expected[i]);
    if (delta > max) max = delta;
  }
  return max;
}

async function createServer(root: string): Promise<{ server: Awaited<ReturnType<typeof createViteServer>>; port: number }> {
  const server = await createViteServer({
    root,
    logLevel: "error",
    server: {
      host: "127.0.0.1",
      port: 0,
    },
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    await server.close();
    throw new Error("Failed to start Vite server for offline render.");
  }
  return { server, port: address.port };
}

const chromePath = resolveChromePath();
if (!chromePath) {
  console.error("No Chrome/Edge found. Set CHROME_PATH to continue.");
  process.exit(1);
}

const { server, port } = await createServer(repoRoot);
const browser = await puppeteer.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--autoplay-policy=no-user-gesture-required"],
});

let payload: RenderPayload;
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/test/render-offline.html`, {
    waitUntil: "networkidle0",
  });

  payload = await page.evaluate(
    async (opts) => {
      const runner = (
        window as unknown as Window & { renderOffline: (o: typeof opts) => Promise<RenderPayload> }
      ).renderOffline;
      const result = await runner(opts);
      return result;
    },
    {
      phrase,
      baseF0,
      sampleRate,
      leadTime,
      tailTime,
      includeTrack,
      noiseSeed,
    }
  );
} finally {
  await browser.close();
  await server.close();
}

if (persistJson) {
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(payload, null, 2));
}
if (persistWav) {
  writeWav(outWav, payload.samples, payload.sampleRate);
}

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
  const maxAllowed = 0;
  const rmsAllowed = 0;
  if (
    deltas.lengthMismatch !== 0 ||
    deltas.maxDelta > maxAllowed ||
    deltas.rmsError > rmsAllowed
  ) {
    process.exitCode = 1;
  }
}
