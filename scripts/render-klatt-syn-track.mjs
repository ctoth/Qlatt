import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
const lastDuration = Number(args.get("last-duration") ?? 0.005);
const glottalType = (args.get("glottal") ?? "natural").toLowerCase();
const klattRoot =
  args.get("klatt-syn-root") ?? path.join(os.homedir(), "src", "klatt-syn");
const outJson = path.resolve(
  args.get("out-json") ?? path.join(repoRoot, "test", "golden", "klatt-syn-track.json")
);

const klattModuleUrl = pathToFileURL(path.join(klattRoot, "dist", "Klatt.js")).href;
const demoModuleUrl = pathToFileURL(path.join(klattRoot, "dist", "DemoParms.js")).href;

const { generateSound } = await import(klattModuleUrl);
const { demoFrameParms } = await import(demoModuleUrl);

const glottalMap = {
  impulsive: 0,
  natural: 1,
  noise: 2,
};
const glottalSourceType = glottalMap[glottalType] ?? glottalMap.natural;

const mParms = {
  sampleRate,
  glottalSourceType,
};

const frameKeys = new Set(Object.keys(demoFrameParms));
const paramMap = [
  "F0", "AV", "AVS", "AH", "AF", "F1", "F2", "F3", "F4", "F5", "F6",
  "B1", "B2", "B3", "B4", "B5", "B6", "A1", "A2", "A3", "A4", "A5", "A6",
  "AB", "AN", "FNP", "BNP", "FNZ", "BNZ", "SW", "FGP", "BGP", "BGS",
];

const frames = [];
for (let i = 0; i < track.length; i += 1) {
  const event = track[i];
  if (!event?.params) continue;
  const next = track[i + 1];
  const duration = Number.isFinite(next?.time)
    ? Math.max(0.001, next.time - event.time)
    : lastDuration;
  const frame = { ...demoFrameParms, duration };
  for (const key of paramMap) {
    if (!Number.isFinite(event.params[key])) continue;
    if (frameKeys.has(key)) {
      frame[key] = event.params[key];
    }
  }
  frames.push(frame);
}

const outBuf = generateSound(mParms, frames);
const samples = Array.from(outBuf);
let rms = 0;
let peak = 0;
for (const v of samples) {
  rms += v * v;
  const av = Math.abs(v);
  if (av > peak) peak = av;
}
rms = samples.length ? Math.sqrt(rms / samples.length) : 0;

const outPayload = {
  sampleRate,
  glottalSource: glottalType,
  metrics: { rms, peak },
  samples,
  frames,
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(outPayload, null, 2));
console.log(`Wrote ${outJson}`);
