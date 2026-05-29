// Probe: does dectalk-english give CLAUSE-TYPE intonation?
//   - a yes/no question must RISE at the end (DECtalk's signature terminal rise),
//   - a statement must FALL,
//   - the two must clearly DIFFER,
//   - a comma sentence must show a continuation rise at each comma.
// Chunk dt-6 wired the dead `boundary` IMPULSE layer to emit DECtalk's
// question (-151/+451) and comma (+171/+250) gesture pairs on the final
// stressed vowel, made the hat-fall clause-dependent (?80 /,120 /;:150 /.180),
// and added `f0_layer` to the finalize resolve_points so the impulse commands
// land at their anchored times instead of collapsing to t=0.
import { textToKlattTrack } from "../src/tts-frontend";

function contour(phrase: string) {
  const t = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
  const xs = t.map((f) => (f.params?.F0 as number) ?? 0).filter((x) => x > 0);
  const n = xs.length;
  // Terminal direction: compare the very last voiced frames against the local
  // pre-terminal level (the trough just before the boundary gesture), NOT the
  // mid-phrase hat plateau.  A terminal RISE means the contour turns back UP at
  // the clause end after the hat-fall has brought it down.
  const tail = xs.slice(Math.max(0, n - 12));
  const preTerminal = Math.min(...tail); // the trough near the end
  const finalMean = tail.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, tail.length);
  const last8 = xs.slice(Math.max(0, n - 8)).map((x) => +x.toFixed(0));
  const direction =
    finalMean > preTerminal + 1 ? "RISE" : finalMean < preTerminal - 1 ? "FALL" : "FLAT";
  return {
    frames: n,
    preTerminal: +preTerminal.toFixed(0),
    finalMean: +finalMean.toFixed(0),
    direction,
    finalContour: last8,
  };
}

const phrases = [
  "you are home.",
  "are you home?",
  "how are you today?",
  "i see a cat",
  "i see a cat, a dog, and a bird.",
];
for (const p of phrases) {
  console.log(p);
  console.log("  ", JSON.stringify(contour(p)));
}

// Headline assertion: question RISES, statement FALLS, they differ.
const stmt = contour("you are home.");
const ques = contour("are you home?");
console.log("\nHEADLINE:");
console.log(`  statement "you are home."  -> ${stmt.direction} (preTerminal ${stmt.preTerminal} -> final ${stmt.finalMean})`);
console.log(`  question  "are you home?"  -> ${ques.direction} (preTerminal ${ques.preTerminal} -> final ${ques.finalMean})`);
console.log(`  differ at end? statement final ${stmt.finalMean} Hz vs question final ${ques.finalMean} Hz` +
  ` (delta ${+(ques.finalMean - stmt.finalMean).toFixed(0)} Hz)`);
