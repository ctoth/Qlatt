#!/usr/bin/env node
/**
 * Quick diagnostic: dump track frames showing amplitude progression
 * Usage: npx ts-node scripts/dump-track.ts "phrase"
 */
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const phrase = process.argv[2] || "The quick brown fox jumps over the lazy dog.";
const result = textToKlattTrackDetailed(phrase, { baseF0: 110 });
const track = result.track;

console.log(`Phrase: "${phrase}"`);
console.log(`Track frames: ${track.length}`);
console.log(`Total duration: ${track[track.length - 1]?.time?.toFixed(3)}s`);
console.log();

// Phone sequence with durations
console.log("=== Phone sequence with durations ===");
let totalDur = 0;
for (const ph of result.frontendPhones) {
  const dur = ph.durationMs ?? 0;
  totalDur += dur;
  const stress = ph.stress !== undefined && ph.stress !== null ? ` stress=${ph.stress}` : "";
  console.log(
    `  ${String(ph.phoneme).padEnd(8)} ${String(Math.round(dur)).padStart(6)}ms${stress}  word=${ph.word ?? ""}`
  );
}
console.log(`  TOTAL: ${Math.round(totalDur)}ms`);
console.log();

// Track amplitude progression
console.log("=== Track frame amplitudes ===");
console.log(
  "Time(s)".padEnd(10),
  "Phoneme".padEnd(10),
  "AV".padStart(4),
  "AF".padStart(4),
  "AH".padStart(4),
  "GO".padStart(4),
  "EeDb".padStart(7),
  "RdOff".padStart(7),
  "F0".padStart(7),
  "SW".padStart(3),
  "F1".padStart(5),
  "F2".padStart(6),
  "F3".padStart(6)
);
for (const frame of track) {
  const p = frame.params || {};
  console.log(
    frame.time.toFixed(4).padEnd(10),
    (frame.phoneme || "SIL").padEnd(10),
    String(p.AV ?? 0).padStart(4),
    String(p.AF ?? 0).padStart(4),
    String(p.AH ?? 0).padStart(4),
    String(p.GO ?? 47).padStart(4),
    String((p.EePhraseDb ?? 0).toFixed ? (p.EePhraseDb as number).toFixed(2) : p.EePhraseDb ?? 0).padStart(7),
    String((p.RdPhraseOffset ?? 0).toFixed ? (p.RdPhraseOffset as number).toFixed(3) : p.RdPhraseOffset ?? 0).padStart(7),
    String((p.F0 ?? 0).toFixed ? (p.F0 as number).toFixed(1) : p.F0 ?? 0).padStart(7),
    String(p.SW ?? 0).padStart(3),
    String(p.F1 ?? 0).padStart(5),
    String(p.F2 ?? 0).padStart(6),
    String(p.F3 ?? 0).padStart(6)
  );
}
