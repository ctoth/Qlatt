/**
 * Phase checkpoints and rule attempts are recorded only when a caller asks
 * for them (`captureTooling`), in every phase alike: a checkpoint serializes
 * the whole graph, and the normalization and orthography phases used to take
 * one before and after each of them on every run.
 */

import { describe, expect, it } from "vitest";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const TEXT = "It costs $5.";

describe.each(["dectalk-english", "qlatt-english"])("%s tooling capture", (frontendId) => {
  it("a plain run records no checkpoint and no rule attempt", () => {
    const { utterance } = textToKlattTrackDetailed(TEXT, undefined, 30, { frontendId });
    expect(utterance.checkpoints()).toEqual([]);
    expect(utterance.ruleAttempts()).toEqual([]);
  });

  it("a run that asks for tooling records every phase, the text phases too", () => {
    const { utterance } = textToKlattTrackDetailed(TEXT, undefined, 30, {
      frontendId,
      captureTooling: true,
    });
    const phases = new Set(utterance.checkpoints().map((checkpoint) => checkpoint.phase));
    expect(phases.has("orthography")).toBe(true);
    expect(phases.has("duration")).toBe(true);
    expect([...phases].some((phase) => phase.startsWith("normalization"))).toBe(true);
    const attempted = new Set(utterance.ruleAttempts().map((attempt) => attempt.phase));
    expect([...attempted].some((phase) => phase.startsWith("normalization"))).toBe(true);
  });

  it("the track is the same either way", () => {
    const plain = textToKlattTrackDetailed(TEXT, undefined, 30, { frontendId }).track;
    const captured = textToKlattTrackDetailed(TEXT, undefined, 30, {
      frontendId,
      captureTooling: true,
    }).track;
    expect(captured).toEqual(plain);
  });
});
