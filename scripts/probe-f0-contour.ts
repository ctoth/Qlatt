/**
 * F0-contour probe for the layered-additive F0 renderer (dectalk-english).
 *
 * Renders a phrase through the dectalk frontend and prints the per-frame F0
 * contour (time, Hz) plus a summary of the contour shape near the END of the
 * utterance, so a smooth GLIDE ramp (monotone movement to a held target) can be
 * distinguished from an IMPULSE spike+decay (a single-frame peak that decays).
 *
 * Usage:
 *   npx tsx scripts/probe-f0-contour.ts "<phrase>" [baseF0] [--frontend <id>] [--tail N] [--full]
 *
 * --tail N : print the last N frames in full (default 24).
 * --full   : print every frame.
 */
import { textToKlattTrack } from "../src/tts-frontend.ts";

const rawArgs = process.argv.slice(2);
let phrase = "are you home?";
let baseF0 = 110;
let frontendId = "dectalk-english";
let tail = 24;
let full = false;

const positional: string[] = [];
for (let i = 0; i < rawArgs.length; i += 1) {
  const a = rawArgs[i];
  if (a === "--frontend") {
    frontendId = rawArgs[++i];
  } else if (a === "--tail") {
    tail = Number(rawArgs[++i]);
  } else if (a === "--full") {
    full = true;
  } else {
    positional.push(a);
  }
}
if (positional[0] != null) phrase = positional[0];
if (positional[1] != null) baseF0 = Number(positional[1]);

// textToKlattTrack returns the KlattFrame[] track directly (see f0-fingerprint.ts).
const track = textToKlattTrack(phrase, baseF0, 30, { frontendId });

type Frame = { time: number; params: { F0?: number } };
const frames = track as unknown as Frame[];

const f0s = frames.map((f) => (typeof f.params.F0 === "number" ? f.params.F0 : NaN));
const times = frames.map((f) => f.time);

let nan = 0;
let min = Infinity;
let max = -Infinity;
let argmax = -1;
for (let i = 0; i < f0s.length; i += 1) {
  const v = f0s[i];
  if (!Number.isFinite(v)) {
    nan += 1;
    continue;
  }
  if (v < min) min = v;
  if (v > max) {
    max = v;
    argmax = i;
  }
}

console.log(`phrase=${JSON.stringify(phrase)} frontend=${frontendId} baseF0=${baseF0}`);
console.log(`frames=${frames.length} nan=${nan} f0_min=${min.toFixed(2)} f0_max=${max.toFixed(2)} argmax_frame=${argmax}/${frames.length - 1}`);

const start = full ? 0 : Math.max(0, frames.length - tail);
console.log(`--- F0 contour (frame: time_s -> Hz) [${full ? "full" : `last ${frames.length - start}`}] ---`);
for (let i = start; i < frames.length; i += 1) {
  const v = f0s[i];
  console.log(`${i}\t${times[i].toFixed(4)}\t${Number.isFinite(v) ? v.toFixed(2) : "NaN"}`);
}

// Tail-shape summary over the VOICED tail (exclude trailing SIL frames where
// F0 == 0, which would otherwise mask the terminal gesture as a "fall").
let lastVoiced = frames.length - 1;
while (lastVoiced > 0 && (!Number.isFinite(f0s[lastVoiced]) || f0s[lastVoiced] <= 1e-9)) {
  lastVoiced -= 1;
}
const voicedEnd = lastVoiced + 1; // exclusive
const window = Math.min(tail, voicedEnd);
const wStart = voicedEnd - window;
let risingSteps = 0;
let fallingSteps = 0;
for (let i = wStart + 1; i < voicedEnd; i += 1) {
  const d = f0s[i] - f0s[i - 1];
  if (d > 1e-9) risingSteps += 1;
  else if (d < -1e-9) fallingSteps += 1;
}
const endF0 = f0s[voicedEnd - 1];
const preWindowF0 = f0s[Math.max(0, wStart - 1)];
console.log(`--- tail summary (last ${window} VOICED frames; voiced_end_frame=${voicedEnd - 1}) ---`);
console.log(`pre_window_F0=${preWindowF0.toFixed(2)} end_F0=${endF0.toFixed(2)} delta=${(endF0 - preWindowF0).toFixed(2)}`);
console.log(`rising_steps=${risingSteps} falling_steps=${fallingSteps}`);
console.log(`tail_direction=${endF0 > preWindowF0 + 1e-6 ? "RISE" : endF0 < preWindowF0 - 1e-6 ? "FALL" : "FLAT"}`);
