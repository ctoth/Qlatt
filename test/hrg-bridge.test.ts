import { describe, expect, it } from "vitest";
import { buildUtteranceFromPhrase } from "../src/declarative-frontend/hrg/bridge";
import { whyParamAt, frameIndexAt } from "../src/declarative-frontend/hrg";

/**
 * The bridge routes the REAL frontend output through the provenance-stamped HRG
 * and back out as a Klatt frame track. These tests prove the architecture is
 * live: a phrase builds a valid Utterance, lowering yields a non-empty frame
 * track, and a rendered param traces back through the provenance DAG.
 */
const PHRASE = "she sees a calm blue moon";
const FRONTEND = "qlatt-beauty";

describe("HRG bridge: phrase -> stamped Utterance", () => {
  it("builds a valid Word/Syllable/Segment utterance from the realized phones", () => {
    const { utterance, frontendPhones } = buildUtteranceFromPhrase(PHRASE, FRONTEND);

    expect(frontendPhones.length).toBeGreaterThan(0);

    // Every realized phone became a Segment item in the flat Segment list.
    const segments = utterance.segments.listItems();
    expect(segments.length).toBe(frontendPhones.length);

    // Words and syllables were created and wired into the SylStructure tree.
    expect(utterance.words.listItems().length).toBeGreaterThan(0);
    expect(utterance.syllables.listItems().length).toBeGreaterThan(0);
    expect(utterance.sylStructure.roots.length).toBe(utterance.words.listItems().length);

    // Each segment carries a phoneme, a positive duration, and stamped params.
    for (const seg of segments) {
      expect(typeof seg.get("phoneme")).toBe("string");
      const dur = seg.get("dur_ms");
      expect(typeof dur).toBe("number");
      expect(dur as number).toBeGreaterThan(0);
      // The phoneme write is a real provenance DecisionRecord.
      const write = seg.latestWrite("phoneme");
      expect(write?.decisionId).toBeTruthy();
    }

    // The first segment is a leaf of the tree under a syllable under a word.
    const firstSeg = segments[0];
    const treeNode = firstSeg.node("SylStructure");
    expect(treeNode).toBeDefined();
    expect(treeNode?.parent).toBeDefined(); // syllable
    expect(treeNode?.parent?.parent).toBeDefined(); // word
  });
});

describe("HRG bridge: lowering yields a non-empty frame track", () => {
  it("projects the Segment relation into 5 ms Klatt frames with full param columns", () => {
    const { lowered, paramKeys } = buildUtteranceFromPhrase(PHRASE, FRONTEND);

    expect(lowered.frames.length).toBeGreaterThan(0);
    expect(lowered.totalMs).toBeGreaterThan(0);

    // The HRG must carry far more than the default Klatt column set for the
    // beauty engine to make sound (formants, source, parallel gains, switch…).
    expect(paramKeys.length).toBeGreaterThan(20);
    expect(paramKeys).toContain("F0");
    expect(paramKeys).toContain("F1");

    // Frames are time-ordered and every frame carries numeric params.
    let prev = -1;
    for (const frame of lowered.frames) {
      expect(frame.time).toBeGreaterThanOrEqual(prev);
      prev = frame.time;
      expect(typeof frame.params.F1).toBe("number");
    }
  });
});

describe("HRG bridge: a rendered param traces back via whyParamAt", () => {
  it("returns a non-empty decision chain reaching the phoneme write", () => {
    const { lowered } = buildUtteranceFromPhrase(PHRASE, FRONTEND);

    // A voiced frame near the middle of the utterance.
    const midTime = lowered.frames[Math.floor(lowered.frames.length / 2)].time;
    expect(frameIndexAt(lowered, midTime)).toBeGreaterThanOrEqual(0);

    const chain = whyParamAt(lowered, "F0", midTime);
    expect(chain.length).toBeGreaterThan(0);

    // The chain walks the F0 write back to the segment's phoneme realization.
    const subjects = chain.map((d) => d.subject);
    expect(subjects.some((s) => s.endsWith(".F0"))).toBe(true);
    expect(subjects.some((s) => s.endsWith(".phoneme"))).toBe(true);

    // Every decision in the chain carries a reason (explainability is not optional).
    for (const decision of chain) {
      expect(decision.reason.length).toBeGreaterThan(0);
    }
  });
});
