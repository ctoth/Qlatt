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
const len = Math.min(aSamples.length, bSamples.length);

let rmsA = 0;
let rmsB = 0;
for (let i = 0; i < len; i += 1) {
  const va = aSamples[i];
  const vb = bSamples[i];
  rmsA += va * va;
  rmsB += vb * vb;
}
rmsA = len ? Math.sqrt(rmsA / len) : 0;
rmsB = len ? Math.sqrt(rmsB / len) : 0;

const scaleA = normalize && rmsA > 0 ? 1 / rmsA : 1;
const scaleB = normalize && rmsB > 0 ? 1 / rmsB : 1;

let rmsErr = 0;
let maxDelta = 0;
for (let i = 0; i < len; i += 1) {
  const va = aSamples[i] * scaleA;
  const vb = bSamples[i] * scaleB;
  const delta = va - vb;
  rmsErr += delta * delta;
  const ad = Math.abs(delta);
  if (ad > maxDelta) maxDelta = ad;
}
rmsErr = len ? Math.sqrt(rmsErr / len) : 0;

const result = {
  lengthMismatch: aSamples.length - bSamples.length,
  rmsA,
  rmsB,
  rmsError: rmsErr,
  maxDelta,
  sampleRateA: a.sampleRate,
  sampleRateB: b.sampleRate,
};

console.log(JSON.stringify(result, null, 2));
