// Read-only comparison input for #205. Run from each candidate/control checkout.
// Prints metrics, compatibility hashes, and segment write evidence; never updates goldens.
// node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node
//   <candidate>/scripts/review-syllabification-goldens.mjs
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const source = (name) => import(pathToFileURL(resolve("src", name)).href);
const { textToKlattTrackDetailed } = await source("tts-frontend.ts");
const { summarizeTrackMetrics } = await source("analysis/track-metrics.ts");
const output = { corpora: [], tones: [] };
function render(phrase, baseF0, options) {
  const { track, utterance } = textToKlattTrackDetailed(phrase, baseF0, 30, options);
  const segments = utterance
    .relation("Segment")
    .listItems()
    .filter(
      (item) =>
        item.get("active") !== false &&
        [
          "seashells",
          "seashore",
          "balloon",
          "thrilled",
          "again",
          "numbers",
          "violets",
          "shoals",
          "soft",
          "safe",
          "fuzzy",
          "fussy",
          "sassy",
          "feisty",
          "zesty",
          "shifty",
        ].includes(item.get("word")),
    )
    .map((item) => ({
      id: item.id,
      features: Object.fromEntries(
        ["phoneme", "word", "duration", "stress"].map((key) => [key, item.get(key)]),
      ),
      syllable: item.nodes.get("SylStructure")?.parent?.item.id,
      durationWrites: item.writes("duration").map(({ value, reason }) => ({ value, reason })),
    }));
  return { track, segments };
}
for (const name of ["declarative-corpus-summary", "crystal-tempo-corpus-summary"]) {
  const golden = JSON.parse(readFileSync(`test/golden/${name}.json`, "utf8"));
  const summaries = golden.summaries.map(({ phrase }) => {
    const { track, segments } = render(phrase, golden.baseF0, { rate: golden.rate });
    return { phrase, metrics: summarizeTrackMetrics(track), segments };
  });
  output.corpora.push({ name, summaries });
}
for (const frontendId of ["qlatt-english", "qlatt-beauty", "dectalk-english"]) {
  for (const phrase of ["The cat sat.", "Did Bob buy a blue balloon?", "Gag, gang; go!", "sip sip."]) {
    const { track, segments } = render(phrase, frontendId === "qlatt-beauty" ? undefined : 110, {
      frontendId,
    });
    const payload = track.map(({ provenance, ...frame }) => {
      if (frontendId === "dectalk-english") return frame;
      const { FTP, FTZ, BTP, BTZ, DF1, DB1, effort, ...params } = frame.params;
      return { ...frame, params };
    });
    output.tones.push({
      frontendId,
      phrase,
      segments,
      hash: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
    });
  }
}
console.log(JSON.stringify(output));
