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
const defaultOut = path.join(repoRoot, "test", "golden", "klatt_syn_frame.json");
const sampleRate = Number(args.get("sample-rate") ?? 22050);
const duration = Number(args.get("duration") ?? 0.1);
const glottalType = (args.get("glottal") ?? "natural").toLowerCase();
const klattRoot =
  args.get("klatt-syn-root") ?? path.join(os.homedir(), "src", "klatt-syn");

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

const frame = {
  ...demoFrameParms,
  duration,
};
const mParms = {
  sampleRate,
  glottalSourceType,
};

const outBuf = generateSound(mParms, [frame]);
const samples = Array.from(outBuf.slice(0, 512));
let rms = 0;
let peak = 0;
for (const v of samples) {
  rms += v * v;
  const av = Math.abs(v);
  if (av > peak) peak = av;
}
rms = samples.length ? Math.sqrt(rms / samples.length) : 0;

const payload = {
  sampleRate,
  duration,
  glottalSource: glottalType,
  frame,
  metrics: { rms, peak },
  samples,
};

const outPath = path.resolve(args.get("out") ?? defaultOut);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
console.log(`Wrote ${outPath}`);
