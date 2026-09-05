// Dump F0 contour (time, F0) at decile points for a few phrases, to compare
// the dt-6 resolve_points change before/after. Run on dt-6 tree and on the
// committed tree (via git stash) and diff.
import { textToKlattTrack } from "../src/tts-frontend";

function dump(phrase: string) {
  const t = textToKlattTrack(phrase, 110, 30, { frontendId: "dectalk-english" });
  const v = t.filter((f) => typeof f.params?.F0 === "number" && f.params.F0 > 0);
  const n = v.length;
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const f = v[Math.floor((i * n) / 10)];
    const f0 = f?.params?.F0;
    pts.push(typeof f0 === "number" ? f0.toFixed(0) : "n/a");
  }
  const f0s = v.map((f) => f.params.F0 as number);
  return `${phrase}\n  decile F0: [${pts.join(" ")}]  min=${Math.min(...f0s).toFixed(0)} max=${Math.max(...f0s).toFixed(0)}`;
}
for (const p of [
  "you are home.",
  "one two three four five.",
  "the quick brown fox jumps over the lazy dog.",
]) {
  console.log(dump(p));
}
