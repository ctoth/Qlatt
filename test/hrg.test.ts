import { describe, expect, it } from "vitest";
import { createProvenanceCollector } from "../src/provenance";
import {
  Utterance,
  evalPath,
  pathNode,
  pathFeature,
  isNavOp,
  lowerToFrames,
  frameIndexAt,
  whyFeature,
  whyParamAt,
  decisionChain,
} from "../src/declarative-frontend/hrg";
import type { Item } from "../src/declarative-frontend/hrg/item";
import type { HrgSchema } from "../src/declarative-frontend/hrg";

const CITE = ["Taylor 2001 HRG"];
const RELATION_INPUT = { reason: "fixture relation construction", citations: CITE };
const TEST_SCHEMA = {
  itemTypes: {
    word: {
      features: {
        text: { kind: "string" },
        pos: { kind: "string" },
      },
    },
    syllable: {
      features: {
        accented: { kind: "boolean" },
      },
    },
    segment: {
      features: {
        phoneme: { kind: "string" },
        dur_ms: { kind: "number" },
        F0: { kind: "number" },
        F1: { kind: "number" },
      },
    },
  },
  relations: {
    Word: { kind: "list", itemTypes: ["word"] },
    Syllable: { kind: "list", itemTypes: ["syllable"] },
    Segment: { kind: "list", itemTypes: ["segment"] },
    SylStructure: { kind: "tree", itemTypes: ["word", "syllable", "segment"] },
  },
} as const satisfies HrgSchema;

/**
 * Build a small "the cat" utterance:
 *   Word:    the          cat
 *   Syll:    [DH AH]      [K AE T]
 *   Segment: DH AH K AE T   (one flat list)
 *   SylStructure tree: word -> syllable -> segment (SHARED segment items)
 *
 * Returns handles needed by the tests.
 */
function buildTheCat() {
  const u = new Utterance(TEST_SCHEMA);

  // Words (flat Word list).
  const theW = u.createItem("word");
  theW.set("text", "the", { reason: "score token", stage: "transcribe", citations: CITE });
  theW.set("pos", "DT", { reason: "POS tag", stage: "transcribe", citations: CITE });
  const catW = u.createItem("word");
  catW.set("text", "cat", { reason: "score token", stage: "transcribe", citations: CITE });
  const catPos = catW.set("pos", "NN", { reason: "POS tag", stage: "transcribe", citations: CITE });
  u.words.append(theW, RELATION_INPUT);
  u.words.append(catW, RELATION_INPUT);

  // Syllables (flat Syllable list).
  const theSyl = u.createItem("syllable");
  const catSyl = u.createItem("syllable");
  u.syllables.append(theSyl, RELATION_INPUT);
  u.syllables.append(catSyl, RELATION_INPUT);

  // Segments (flat Segment list).
  const mk = (phoneme: string, durMs: number): Item => {
    const seg = u.createItem("segment");
    seg.set("phoneme", phoneme, { reason: "inventory lookup", stage: "rules", citations: CITE });
    seg.set("dur_ms", durMs, { reason: "duration rule", stage: "prosody", citations: CITE });
    u.segments.append(seg, RELATION_INPUT);
    return seg;
  };
  const dh = mk("DH", 60);
  const ah = mk("AH", 80);
  const k = mk("K", 70);
  const ae = mk("AE", 120);
  const t = mk("T", 90);

  // SylStructure tree (word -> syllable -> segment), reusing the SAME items.
  const theWNode = u.sylStructure.addRoot(theW, RELATION_INPUT);
  const theSylNode = u.sylStructure.addDaughter(theWNode, theSyl, RELATION_INPUT);
  u.sylStructure.addDaughter(theSylNode, dh, RELATION_INPUT);
  u.sylStructure.addDaughter(theSylNode, ah, RELATION_INPUT);

  const catWNode = u.sylStructure.addRoot(catW, RELATION_INPUT);
  const catSylNode = u.sylStructure.addDaughter(catWNode, catSyl, RELATION_INPUT);
  u.sylStructure.addDaughter(catSylNode, k, RELATION_INPUT);
  u.sylStructure.addDaughter(catSylNode, ae, RELATION_INPUT);
  u.sylStructure.addDaughter(catSylNode, t, RELATION_INPUT);

  const segments = [dh, ah, k, ae, t];
  const anchors = u.beginTransaction({
    ruleId: "fixture_anchors",
    phase: "finalize",
    tag: "timing",
    reason: "fixture segment anchors",
    citations: CITE,
  });
  anchors.partitionAnchors(segments, u.axis.start.id, u.axis.end.id);
  anchors.commit();
  const times = u.beginTransaction({
    ruleId: "fixture_times",
    phase: "finalize",
    tag: "timing",
    reason: "fixture resolved segment times",
    citations: CITE,
  });
  let elapsedMs = 0;
  const resolvedMarks = new Set<string>();
  for (const segment of segments) {
    const anchor = u.intervalAnchor(segment);
    const duration = segment.get("dur_ms");
    if (!anchor || typeof duration !== "number") throw new Error("fixture timing missing");
    if (!resolvedMarks.has(anchor.leftMarkId)) {
      times.resolveMarkTime(anchor.leftMarkId, elapsedMs);
      resolvedMarks.add(anchor.leftMarkId);
    }
    elapsedMs += duration;
    times.resolveMarkTime(anchor.rightMarkId, elapsedMs);
    resolvedMarks.add(anchor.rightMarkId);
  }
  times.commit();

  return { u, theW, catW, catPos, theSyl, catSyl, dh, ah, k, ae, t };
}

describe("HRG item identity across relations", () => {
  it("the same item object lives in a flat list and a tree leaf", () => {
    const { u, ae } = buildTheCat();
    const segNode = ae.node("Segment");
    const treeNode = ae.node("SylStructure");
    expect(segNode).toBeDefined();
    expect(treeNode).toBeDefined();
    // Two nodes, ONE shared item.
    expect(segNode!.item).toBe(ae);
    expect(treeNode!.item).toBe(ae);
    expect(segNode!.item).toBe(treeNode!.item);
    expect(u.getItem(ae.id)).toBe(ae);
  });

  it("a feature written via one relation's node is visible via the other", () => {
    const { ae } = buildTheCat();
    // Write through the bare item (as a rule selecting from the Segment list would).
    ae.set("F1", 660, { reason: "AE F1 target", citations: CITE });
    // Read back via the SylStructure tree node's shared item.
    const treeNode = ae.node("SylStructure")!;
    expect(treeNode.item.get("F1")).toBe(660);
  });
});

describe("HRG path navigation", () => {
  it("next/prev across the flat Segment list", () => {
    const { dh, ah } = buildTheCat();
    const dhSeg = dh.node("Segment")!;
    expect(pathFeature(dhSeg, "n.phoneme")).toBe("AH");
    expect(pathFeature(dhSeg, "phoneme")).toBe("DH");
    const ahSeg = ah.node("Segment")!;
    expect(pathFeature(ahSeg, "p.phoneme")).toBe("DH");
    expect(pathNode(dhSeg, "p")).toBeNull(); // off the front
  });

  it("parent / daughter1 / daughtern over the SylStructure tree", () => {
    const { catSyl, k, t } = buildTheCat();
    const sylNode = catSyl.node("SylStructure")!;
    expect(pathFeature(sylNode, "daughter1.phoneme")).toBe("K");
    expect(pathFeature(sylNode, "daughtern.phoneme")).toBe("T");
    expect(pathFeature(sylNode, "daughter2.phoneme")).toBe("AE");
    // From a leaf segment, parent is its syllable; the K's parent has 3 daughters.
    const kNode = k.node("SylStructure")!;
    expect(pathNode(kNode, "parent")).toBe(sylNode);
    const tNode = t.node("SylStructure")!;
    expect(pathNode(tNode, "parent")).toBe(sylNode);
  });

  it("relation switch reaches the owning word from a syllable", () => {
    const { catSyl } = buildTheCat();
    const sylNode = catSyl.node("SylStructure")!;
    // R:SylStructure.parent.R:Word -> owning word (in the Word relation)
    const wordNode = pathNode(sylNode, "R:SylStructure.parent.R:Word");
    expect(wordNode).toBeDefined();
    expect(wordNode!.relation.name).toBe("Word");
    expect(wordNode!.item.get("text")).toBe("cat");
    expect(pathFeature(sylNode, "R:SylStructure.parent.R:Word.pos")).toBe("NN");
  });

  it("reaches the owning word from a deep segment, then the previous word", () => {
    const { ae } = buildTheCat();
    const aeSeg = ae.node("Segment")!;
    // segment -> SylStructure -> parent(syl) -> parent(word) -> Word relation
    expect(pathFeature(aeSeg, "R:SylStructure.parent.parent.R:Word.text")).toBe("cat");
    // ...and the word before it.
    expect(pathFeature(aeSeg, "R:SylStructure.parent.parent.R:Word.p.text")).toBe("the");
  });

  it("isNavOp distinguishes operators from feature names", () => {
    for (const op of ["n", "p", "nn", "pp", "parent", "first", "last", "daughter1", "daughtern", "R:Word"]) {
      expect(isNavOp(op)).toBe(true);
    }
    for (const name of ["phoneme", "pos", "F1", "text"]) {
      expect(isNavOp(name)).toBe(false);
    }
  });

  it("paths that fall off the graph return null / undefined", () => {
    const { t } = buildTheCat();
    const tSeg = t.node("Segment")!;
    expect(pathNode(tSeg, "n")).toBeNull(); // last segment
    expect(pathFeature(tSeg, "n.phoneme")).toBeUndefined();
    expect(evalPath(tSeg, "R:Nonexistent").node).toBeNull();
  });
});

describe("HRG write-stamping and provenance chain", () => {
  it("a first write records a feature_write DecisionRecord with citations", () => {
    const u = new Utterance(TEST_SCHEMA);
    const seg = u.createItem("segment");
    const write = seg.set("F1", 500, { reason: "AE F1 target", citations: ["Peterson & Barney 1952"] });
    expect(write.version).toBe(0);
    const decisions = u.provenance.getDecisions();
    const record = decisions.find((d) => d.id === write.decisionId)!;
    expect(record.type).toBe("feature_write");
    expect(record.subject).toBe(`item:${seg.id}.F1`);
    expect(record.citations).toContain("Peterson & Barney 1952");
    expect(record.reason).toBe("AE F1 target");
  });

  it("an overwrite is append-only and links to the prior value's decision", () => {
    const u = new Utterance(TEST_SCHEMA);
    const seg = u.createItem("segment");
    const v0 = seg.set("dur_ms", 120, { reason: "inherent duration", citations: ["Klatt 1976"] });
    const v1 = seg.set("dur_ms", 84, {
      reason: "consonant_position shortening",
      citations: ["Klatt 1976 Table III"],
    });
    // Current value is the latest; history is retained.
    expect(seg.get("dur_ms")).toBe(84);
    const history = seg.writes("dur_ms");
    expect(history.map((w) => w.value)).toEqual([120, 84]);
    expect(v1.version).toBe(1);
    // The overwrite's decision lists the prior value's decision as a parent.
    const record = u.provenance.getDecisions().find((d) => d.id === v1.decisionId)!;
    expect(record.type).toBe("feature_overwrite");
    expect(record.parents ?? []).toContain(v0.decisionId);
    // "why did dur change?" walks back to the value it replaced.
    const chain = whyFeature(u, seg, "dur_ms");
    expect(chain[0].id).toBe(v1.decisionId);
    expect(chain.map((d) => d.id)).toContain(v0.decisionId);
  });

  it("read-set parents thread a derivation chain (pos -> accent -> F0)", () => {
    const u = new Utterance(TEST_SCHEMA);
    const word = u.createItem("word");
    const posWrite = word.set("pos", "NN", { reason: "POS tag", stage: "transcribe", citations: ["MITalk"] });

    const syl = u.createItem("syllable");
    const accentWrite = syl.set("accented", true, {
      reason: "content_word_accent matched (POS=noun)",
      stage: "prosody",
      citations: ["O'Shaughnessy 1976"],
      parents: [posWrite.decisionId],
    });

    const seg = u.createItem("segment");
    const f0Write = seg.set("F0", 140, {
      reason: "H* accent peak",
      stage: "prosody",
      citations: ["Taylor 2000"],
      parents: [accentWrite.decisionId],
    });

    const chain = decisionChain(u.provenance, f0Write.decisionId);
    const ids = chain.map((d) => d.id);
    expect(ids[0]).toBe(f0Write.decisionId);
    expect(ids).toContain(accentWrite.decisionId);
    expect(ids).toContain(posWrite.decisionId);
    // The citations of every step are recoverable from the chain.
    const allCitations = chain.flatMap((d) => d.citations);
    expect(allCitations).toEqual(expect.arrayContaining(["Taylor 2000", "O'Shaughnessy 1976", "MITalk"]));
  });
});

describe("HRG lowering to Klatt frames", () => {
  it("segments -> durations -> a 5 ms param track that round-trips", () => {
    const { u, dh, ae } = buildTheCat();
    // Give two segments distinct F1 targets so we can locate them in time.
    dh.set("F1", 300, { reason: "DH F1", citations: CITE });
    ae.set("F1", 660, { reason: "AE F1", citations: CITE });

    const track = lowerToFrames(u, { columns: ["F1"], durationKey: "dur_ms" });
    // Total = 60+80+70+120+90 = 420 ms; 5 ms frames => floor(420/5)+1 = 85 frames.
    expect(track.totalMs).toBe(420);
    expect(track.frames.length).toBe(85);
    expect(track.paramKeys).toContain("F1");

    // First frame is the DH segment.
    expect(track.frames[0].time).toBeCloseTo(0, 9);
    expect(track.frames[0].phoneme).toBe("DH");
    expect(track.frames[0].params.F1).toBe(300);

    // AE spans [60+80+70=210ms, 330ms). Sample at 250 ms.
    const aeIndex = frameIndexAt(track, 0.25);
    expect(track.frames[aeIndex].phoneme).toBe("AE");
    expect(track.frames[aeIndex].params.F1).toBe(660);
  });

});

describe("HRG end-to-end: build -> lower -> trace why", () => {
  it("traces an F0 value back through accent and POS", () => {
    const { u, catSyl, ae, catPos } = buildTheCat();

    // Prosody stage: cat's syllable is accented because its word is a noun.
    const accent = catSyl.set("accented", true, {
      reason: "content_word_accent matched (POS=noun)",
      stage: "prosody",
      citations: ["O'Shaughnessy 1976"],
      parents: [catPos.decisionId],
    });
    // Realize an H* peak on the accented vowel; base F0 elsewhere.
    ae.set("F0", 140, {
      reason: "H* accent peak on nuclear vowel",
      stage: "prosody",
      citations: ["Taylor 2000"],
      parents: [accent.decisionId],
    });
    // Give the vowel an F1 too, and a baseline F0 on the first segment.
    ae.set("F1", 660, { reason: "AE F1 target", citations: CITE });

    const track = lowerToFrames(u, { columns: ["F0", "F1"], durationKey: "dur_ms" });

    // The AE vowel spans [210ms, 330ms): sample F0 at 250 ms.
    const aeIndex = frameIndexAt(track, 0.25);
    expect(track.frames[aeIndex].phoneme).toBe("AE");
    expect(track.frames[aeIndex].params.F0).toBe(140);

    // Ask the lowered track: "why is F0 140 here?"
    const chain = whyParamAt(track, "F0", 0.25);
    const reasons = chain.map((d) => d.reason);
    expect(reasons[0]).toBe("H* accent peak on nuclear vowel");
    expect(reasons).toContain("content_word_accent matched (POS=noun)");
    expect(reasons).toContain("POS tag");
    // The chain reaches the owning word's POS decision (catPos).
    expect(chain.map((d) => d.id)).toContain(catPos.decisionId);
    // And the path that justified the accent is itself navigable on the graph.
    const sylNode = catSyl.node("SylStructure")!;
    expect(pathFeature(sylNode, "R:SylStructure.parent.R:Word.pos")).toBe("NN");
  });
});
