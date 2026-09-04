// Dump per-frame TL (spectral tilt) from a render-phrase --include-track JSON,
// to confirm per-phoneme TL targets reach the synthesizer track. Reusable
// (AGENTS.md Principle 4): node scripts/inspect-track-tilt.mjs <render-track.json>
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: inspect-track-tilt.mjs <track.json>");
  process.exit(1);
}
const d = JSON.parse(readFileSync(path, "utf8"));
const track = d.track || [];

// Each track entry is a frame; find the TL field (params may be nested).
function getTL(frame) {
  if (frame == null) return undefined;
  if (typeof frame.TL === "number") return frame.TL;
  if (frame.params && typeof frame.params.TL === "number") return frame.params.TL;
  if (frame.values && typeof frame.values.TL === "number") return frame.values.TL;
  return undefined;
}
function getTime(frame) {
  return frame?.time ?? frame?.t ?? frame?.startTime ?? undefined;
}
function getPhone(frame) {
  return frame?.phoneme ?? frame?.phone ?? frame?.label ?? "";
}

console.log("phrase:", d.phrase, "| frames:", track.length);
console.log("sample frame keys:", Object.keys(track[0] ?? {}).join(", "));
const seen = new Map();
let _printed = 0;
for (const f of track) {
  const tl = getTL(f);
  const ph = getPhone(f);
  const key = `${ph}:${tl}`;
  if (!seen.has(key)) {
    seen.set(key, true);
    console.log(`  t=${String(getTime(f)).padStart(8)}  phone=${String(ph).padEnd(6)} TL=${tl}`);
    _printed++;
  }
}
const tls = track.map(getTL).filter((x) => typeof x === "number");
const uniq = [...new Set(tls)].sort((a, b) => a - b);
console.log("distinct TL values across track:", uniq.join(", ") || "(none found)");
