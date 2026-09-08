// Lienard & Di Benedetto 1999: compare modal and effort-realized controls
// on identical frontend frames, isolating effort from other source contours.
import { loadExperimentConfig } from "../src/experiments/load-experiment-config";
import { expandFormantBanks } from "../src/formant-bank";
import { createConfiguredEvaluator } from "../src/semantics/evaluator-factory";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const phrase = process.argv.slice(2).join(" ") || "The quick brown fox jumps over the lazy dog.";
const { semantics, graph } = await loadExperimentConfig("klatt80-baseline");
expandFormantBanks(graph, semantics);
const { topoEvaluator } = createConfiguredEvaluator();
const { track } = textToKlattTrackDetailed(phrase);
console.log(`Phrase: ${phrase}`);
console.log("time_s,phone,effort_db,AV_before,AV_after,GO");
const seen = new Set<string>();
for (const frame of track) {
  if (frame.phoneme === "SIL" || frame.params.AV <= 0 || !frame.segmentId) continue;
  if (seen.has(frame.segmentId)) continue;
  seen.add(frame.segmentId);
  const values = [0, frame.params.effort ?? 0].map((effort) => {
    const result = topoEvaluator.evaluate(semantics, {
      params: { ...frame.params, effort },
      constants: semantics.constants ?? {},
    });
    if (result.errors.length) throw new Error(JSON.stringify(result.errors));
    return result.values;
  });
  console.log(
    [
      frame.time.toFixed(3),
      frame.phoneme,
      (frame.params.effort ?? 0).toFixed(3),
      Number(values[0].AV).toFixed(3),
      Number(values[1].AV).toFixed(3),
      values[1].GO,
    ].join(","),
  );
}
