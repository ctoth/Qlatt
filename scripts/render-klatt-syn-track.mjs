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
const disableAgc = (args.get("no-agc") ?? "0") === "1";
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

const toDb = (lin) => (lin > 0 ? 20 * Math.log10(lin) : -99);
const ndbScale = {
  A1: -58,
  A2: -65,
  A3: -73,
  A4: -78,
  A5: -79,
  A6: -80,
  AN: -58,
  AB: -84,
  AV: -72,
  AH: -87,
  AF: -72,
  AVS: -44,
};

const frames = [];
for (let i = 0; i < track.length; i += 1) {
  const event = track[i];
  if (!event?.params) continue;
  const next = track[i + 1];
  const duration = Number.isFinite(next?.time)
    ? Math.max(0.001, next.time - event.time)
    : lastDuration;
  const p = event.params;
  const fricDbAdjusted = (p.SW === 1) ? Math.max(p.AF ?? -70, p.AH ?? -70) : (p.AF ?? -70);
  const voiceLin = Math.pow(10, ((p.AV ?? -70) + ndbScale.AV) / 20);
  const avsLin = Math.pow(10, ((p.AVS ?? -70) + ndbScale.AVS) / 20) * 10;
  const aspLin = Math.pow(10, ((p.AH ?? -70) + ndbScale.AH) / 20);
  const fricLin = Math.pow(10, ((fricDbAdjusted ?? -70) + ndbScale.AF) / 20);
  const bypassLin = Math.pow(10, ((p.AB ?? -70) + ndbScale.AB) / 20);

  const oralFormantFreq = [
    p.F1 ?? demoFrameParms.oralFormantFreq[0],
    p.F2 ?? demoFrameParms.oralFormantFreq[1],
    p.F3 ?? demoFrameParms.oralFormantFreq[2],
    p.F4 ?? demoFrameParms.oralFormantFreq[3],
    p.F5 ?? demoFrameParms.oralFormantFreq[4],
    p.F6 ?? demoFrameParms.oralFormantFreq[5],
  ];
  const oralFormantBw = [
    p.B1 ?? demoFrameParms.oralFormantBw[0],
    p.B2 ?? demoFrameParms.oralFormantBw[1],
    p.B3 ?? demoFrameParms.oralFormantBw[2],
    p.B4 ?? demoFrameParms.oralFormantBw[3],
    p.B5 ?? demoFrameParms.oralFormantBw[4],
    p.B6 ?? demoFrameParms.oralFormantBw[5],
  ];
  const oralFormantDb = [
    (p.A1 ?? -70) + ndbScale.A1,
    (p.A2 ?? -70) + ndbScale.A2,
    (p.A3 ?? -70) + ndbScale.A3,
    (p.A4 ?? -70) + ndbScale.A4,
    (p.A5 ?? -70) + ndbScale.A5,
    (p.A6 ?? -70) + ndbScale.A6,
  ];

  const frame = {
    ...demoFrameParms,
    duration,
    f0: p.F0 ?? 0,
    oralFormantFreq,
    oralFormantBw,
    oralFormantDb,
    nasalFormantFreq: p.FNP ?? demoFrameParms.nasalFormantFreq,
    nasalFormantBw: p.BNP ?? demoFrameParms.nasalFormantBw,
    nasalAntiformantFreq: p.FNZ ?? demoFrameParms.nasalAntiformantFreq,
    nasalAntiformantBw: p.BNZ ?? demoFrameParms.nasalAntiformantBw,
    nasalFormantDb: (p.AN ?? -70) + ndbScale.AN,
    cascadeEnabled: p.SW === 1 ? false : true,
    parallelEnabled: true,
    cascadeVoicingDb: toDb(voiceLin),
    parallelVoicingDb: toDb(avsLin),
    cascadeAspirationDb: toDb(aspLin),
    parallelAspirationDb: toDb(aspLin),
    fricationDb: toDb(fricLin),
    parallelBypassDb: toDb(bypassLin),
    ...(disableAgc ? { gainDb: 0, agcRmsLevel: NaN } : null),
  };
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
