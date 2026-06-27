// End-to-end sanity sweep of the dectalk-english pipeline through the REAL
// renderer (textToKlattTrack), the way the synth is actually driven — not the
// loose unit assertions. For each phrase prints frame count, voiced-frame
// count, F0 range, and flags any NaN/Inf param or empty/silent output.
// Prints "BEGIN <phrase>" before each so an infinite-loop hang reveals the
// culprit phrase when run under an external timeout.
import { textToKlattTrack } from "../src/tts-frontend";

const phrases = [
  "hello world.",
  "are you home?",
  "how are you today?",
  "in 1984 the year was good.",
  "a butter knife and a city street.",
  "the car started by the store.",
  "she said this ship was certain to win.",
  "one, two, three, four, five.",
  "i see a cat, a dog, and a bird.",
  "strength.",
  "a.",
  "x.",
  "the quick brown fox jumps over the lazy dog near the riverbank at dawn.",
  "antidisestablishmentarianism.",
  "3/4 of the 21st century.",
];

const voices = ["paul", "betty", "harry"];

function check(phrase: string, speaker?: string) {
  const tag = speaker ? `${phrase} [${speaker}]` : phrase;
  console.log("BEGIN", tag);
  const opts: Record<string, unknown> = { frontendId: "dectalk-english" };
  if (speaker) opts.speaker = speaker;
  const t0 = process.hrtime.bigint();
  const track = textToKlattTrack(phrase, 110, 30, opts as never);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6;
  let voiced = 0;
  let nanCount = 0;
  let f0Min = Infinity;
  let f0Max = -Infinity;
  for (const f of track) {
    const p = (f as { params?: Record<string, number> }).params ?? {};
    for (const v of Object.values(p)) {
      if (typeof v === "number" && !Number.isFinite(v)) nanCount++;
    }
    const f0 = p.F0 ?? 0;
    if (f0 > 0) {
      voiced++;
      if (f0 < f0Min) f0Min = f0;
      if (f0 > f0Max) f0Max = f0;
    }
  }
  const flags: string[] = [];
  if (track.length === 0) flags.push("EMPTY");
  if (voiced === 0) flags.push("NO-VOICED(silent)");
  if (nanCount > 0) flags.push(`NaN/Inf=${nanCount}`);
  console.log(
    `  OK ${tag} frames=${track.length} voiced=${voiced} ` +
      `F0=${voiced ? `${f0Min.toFixed(0)}-${f0Max.toFixed(0)}` : "-"} ` +
      `${ms.toFixed(0)}ms ${flags.length ? "*** " + flags.join(" ") : ""}`,
  );
}

for (const p of phrases) check(p);
for (const v of voices) check("hello there, how are you?", v);
console.log("SWEEP COMPLETE");
