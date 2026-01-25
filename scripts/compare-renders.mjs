import fs from "node:fs";
import path from "node:path";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const key = process.argv[i];
  if (!key.startsWith("--")) continue;
  const value = process.argv[i + 1];
  args.set(key.slice(2), value);
}

const aPath = args.get("a");
const bPath = args.get("b");
if (!aPath || !bPath) {
  console.error("Usage: --a path/to/a.json --b path/to/b.json");
  process.exit(1);
}

const a = JSON.parse(fs.readFileSync(path.resolve(aPath), "utf8"));
const b = JSON.parse(fs.readFileSync(path.resolve(bPath), "utf8"));

const aSamples = a.samples ?? [];
const bSamples = b.samples ?? [];
const normalize = (args.get("normalize") ?? "0") === "1";
const maxShift = Number(args.get("max-shift") ?? 0);
const shiftArg = args.get("shift");
const fixedShift = shiftArg !== undefined ? Number(shiftArg) : null;

const shifts = [];
if (Number.isFinite(fixedShift)) {
  shifts.push(fixedShift);
} else if (Number.isFinite(maxShift) && maxShift > 0) {
  for (let s = -maxShift; s <= maxShift; s += 1) shifts.push(s);
} else {
  shifts.push(0);
}

let best = null;
for (const shift of shifts) {
  const aStart = Math.max(0, shift);
  const bStart = Math.max(0, -shift);
  const len = Math.min(aSamples.length - aStart, bSamples.length - bStart);
  if (len <= 0) continue;
  let rmsA = 0;
  let rmsB = 0;
  for (let i = 0; i < len; i += 1) {
    const va = aSamples[aStart + i];
    const vb = bSamples[bStart + i];
    rmsA += va * va;
    rmsB += vb * vb;
  }
  rmsA = Math.sqrt(rmsA / len);
  rmsB = Math.sqrt(rmsB / len);

  const scaleA = normalize && rmsA > 0 ? 1 / rmsA : 1;
  const scaleB = normalize && rmsB > 0 ? 1 / rmsB : 1;

  let rmsErr = 0;
  let maxDelta = 0;
  for (let i = 0; i < len; i += 1) {
    const va = aSamples[aStart + i] * scaleA;
    const vb = bSamples[bStart + i] * scaleB;
    const delta = va - vb;
    rmsErr += delta * delta;
    const ad = Math.abs(delta);
    if (ad > maxDelta) maxDelta = ad;
  }
  rmsErr = Math.sqrt(rmsErr / len);

  const candidate = {
    shift,
    len,
    rmsA,
    rmsB,
    rmsError: rmsErr,
    maxDelta,
  };
  if (!best || candidate.rmsError < best.rmsError) {
    best = candidate;
  }
}

const result = {
  lengthMismatch: aSamples.length - bSamples.length,
  rmsA: best?.rmsA ?? 0,
  rmsB: best?.rmsB ?? 0,
  rmsError: best?.rmsError ?? 0,
  maxDelta: best?.maxDelta ?? 0,
  shift: best?.shift ?? 0,
  overlapLength: best?.len ?? 0,
  sampleRateA: a.sampleRate,
  sampleRateB: b.sampleRate,
};

console.log(JSON.stringify(result, null, 2));
