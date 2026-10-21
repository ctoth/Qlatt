import { getCelEvalCount, resetCelCounters } from "../src/declarative-frontend/cel-expressions";
import { preloadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { createDiagnostics } from "../src/diagnostics";
import { textToKlattTrackDetailed } from "../src/tts-frontend";
import type { KlattFrame } from "../src/tts-frontend-types";

export const frontends = ["qlatt-english", "qlatt-beauty", "dectalk-english"];

interface Measurement {
  frontendId: string;
  captureTooling: boolean;
  tracks: Omit<KlattFrame, "provenance">[][];
  medianMs: number;
  passes: {
    latencyMs: number;
    decisions: number;
    journalEntries: number;
    celEvaluations: number;
  }[];
}

// Engineering benchmark protocol from #243: one warm-up, five measured passes.
export async function measureFrames(phrases: string[]) {
  const results: Measurement[] = [];
  for (const frontendId of frontends) {
    await preloadBundledRulepackSpec(frontendId);
    for (const captureTooling of [false, true]) {
      const run = () => {
        const tracks = [];
        let latencyMs = 0;
        let decisions = 0;
        let journalEntries = 0;
        resetCelCounters();
        for (const phrase of phrases) {
          const start = performance.now();
          const result = textToKlattTrackDetailed(phrase, 110, 30, {
            frontendId,
            captureTooling,
            diagnostics: createDiagnostics(),
          });
          latencyMs += performance.now() - start;
          decisions += result.utterance.provenance.size;
          journalEntries += result.utterance.journal().length;
          // Preserve every synthesis field, row order, and parameter insertion order.
          tracks.push(result.track.map(({ provenance: _provenance, ...row }) => row));
        }
        return { latencyMs, decisions, journalEntries, celEvaluations: getCelEvalCount(), tracks };
      };
      console.info(`${frontendId} tooling=${captureTooling}: warm-up`);
      run();
      const passes = Array.from({ length: 5 }, (_, index) => {
        console.info(`${frontendId} tooling=${captureTooling}: pass ${index + 1}/5`);
        return run();
      });
      const reference = JSON.stringify(passes[0].tracks);
      if (passes.some((pass) => JSON.stringify(pass.tracks) !== reference)) {
        throw new Error(`Nondeterministic tracks: ${frontendId}/${captureTooling}`);
      }
      const ordinary = results.find(
        (result) => result.frontendId === frontendId && !result.captureTooling,
      );
      if (captureTooling && ordinary && JSON.stringify(ordinary.tracks) !== reference) {
        throw new Error(`Tooling changes synthesis output: ${frontendId}`);
      }
      results.push({
        frontendId,
        captureTooling,
        tracks: passes[0].tracks,
        medianMs: passes.map((p) => p.latencyMs).sort((a, b) => a - b)[2],
        passes: passes.map(({ tracks: _tracks, ...metrics }) => metrics),
      });
    }
  }
  return results;
}
