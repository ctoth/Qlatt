/**
 * F0 fingerprint script for the renderLayeredF0 → f0-filters WASM extraction.
 *
 * Runs the dectalk-english frontend (layered_additive F0 path, which is what
 * uses renderLayeredF0) over a battery of phrases and dumps every frame's F0
 * value to a file. Used to prove BYTE-EXACT parity before/after the extraction.
 *
 * The qlatt-english frontend uses point_interpolation (not renderLayeredF0),
 * so the battery targets dectalk-english.
 *
 * Usage: npx tsx scripts/f0-fingerprint.ts <output-file>
 */
import { writeFileSync } from "node:fs";
import { textToKlattTrack } from "../src/tts-frontend";

const PHRASES = [
  "hello world.",
  "The quick brown fox jumps over the lazy dog.",
  "How are you today?",
  "This is a test of the DECtalk speech synthesis system.",
  "One, two, three, four, five.",
  "a",
  "I",
  "stop",
  "supercalifragilistic.",
  "Why did the chicken cross the road?",
  "Numbers: 1, 22, 333, 4444.",
  "Question? Exclamation! Statement.",
];

// Vary base F0 and transition to exercise filter / scaling paths.
const CONFIGS: { baseF0: number; transitionMs: number }[] = [
  { baseF0: 110, transitionMs: 30 },
  { baseF0: 90, transitionMs: 10 },
  { baseF0: 180, transitionMs: 50 },
];

const outFile = process.argv[2];
if (!outFile) {
  console.error("Usage: npx tsx scripts/f0-fingerprint.ts <output-file>");
  process.exit(1);
}

// Bit-exact serialization of a double: use the IEEE-754 hex form so no decimal
// rounding can mask a difference.
function f64hex(x: number): string {
  const buf = new ArrayBuffer(8);
  new Float64Array(buf)[0] = x;
  const u = new Uint8Array(buf);
  let s = "";
  for (let i = 7; i >= 0; i--) s += u[i].toString(16).padStart(2, "0");
  return s;
}

const lines: string[] = [];
for (const cfg of CONFIGS) {
  for (const phrase of PHRASES) {
    let track;
    try {
      track = textToKlattTrack(phrase, cfg.baseF0, cfg.transitionMs, {
        frontendId: "dectalk-english",
      });
    } catch (err) {
      lines.push(
        `# ERROR phrase=${JSON.stringify(phrase)} base=${cfg.baseF0} trans=${cfg.transitionMs}: ${String(err)}`,
      );
      continue;
    }
    lines.push(
      `## phrase=${JSON.stringify(phrase)} base=${cfg.baseF0} trans=${cfg.transitionMs} frames=${track.length}`,
    );
    for (let i = 0; i < track.length; i++) {
      const frame = track[i];
      const f0 = frame.params.F0;
      const t = frame.time;
      lines.push(`${i}\t${f64hex(t)}\t${f64hex(typeof f0 === "number" ? f0 : NaN)}`);
    }
  }
}

writeFileSync(outFile, lines.join("\n") + "\n");
console.error(`Wrote ${lines.length} lines to ${outFile}`);
