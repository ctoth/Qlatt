import { describe, expect, it } from "vitest";
import { lowerToFrames, readLowerOptions, Utterance } from "../src/declarative-frontend/hrg";
import { recordFrameEvaluation, withFrameSchema } from "../src/declarative-frontend/hrg/frame";
import { decisionChain } from "../src/declarative-frontend/hrg/provenance-query";
import {
  checkRequestedAttributes,
  RequestedAttributes,
} from "../src/declarative-frontend/hrg/requested-attributes";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import {
  compileRuleEngineSpec,
  loadBundledRulepackSpec,
} from "../src/declarative-frontend/rule-pack";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

function fixture(initialSilenceMs = 50) {
  const utterance = new Utterance(
    withFrameSchema({
      itemTypes: {
        segment: {
          features: {
            duration: { kind: "number" },
            phoneme: { kind: "string" },
            type: { kind: "string" },
            F1: { kind: "number" },
            F2: { kind: "number" },
          },
        },
      },
      relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
    }),
  );
  const meta = {
    ruleId: "fixture",
    phase: "input",
    tag: "fixture",
    reason: "test source",
    citations: ["engineering test fixture"],
  };
  const tx = utterance.beginTransaction(meta);
  const items = [400, 800, 1200].map((f1, i) => {
    const item = tx.createItem("segment", `s${i}`);
    tx.set(item, "duration", 100);
    tx.set(item, "phoneme", "AA");
    tx.set(item, "type", "vowel");
    tx.set(item, "F1", f1);
    tx.set(item, "F2", 2000);
    tx.append("Segment", item);
    return item;
  });
  tx.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
  tx.commit();
  const timing = utterance.beginTransaction(meta);
  items.forEach((item, i) => {
    const anchor = utterance.intervalAnchor(item)!;
    timing.resolveMarkTime(anchor.leftMarkId, i * 100);
    timing.resolveMarkTime(anchor.rightMarkId, (i + 1) * 100);
  });
  timing.commit();
  const options = structuredClone(
    readLowerOptions(loadBundledRulepackSpec("qlatt-english").output.lowering),
  );
  options.columns = ["F1", "F2"];
  options.timeline.initial_silence_ms = { value: initialSilenceMs };
  options.transitions.blend.keys = ["F1", "F2"];
  return { utterance, items, options };
}

describe("Frame foundation", () => {
  it.each(["qlatt-english", "qlatt-beauty", "dectalk-english"])(
    "declares every emitted %s parameter in the selected output columns",
    (frontendId) => {
      const spec = loadBundledRulepackSpec(frontendId);
      const { track } = textToKlattTrackDetailed("hello world", 110, 30, { frontendId });
      const columns = readLowerOptions(spec.output.lowering).columns;
      const missing = [...new Set(track.flatMap((row) => Object.keys(row.params)))].filter(
        (key) => !columns.includes(key),
      );
      expect(missing).toEqual([]);
    },
  );
  it("emits each event from typed clocks and evaluated values without numeric writes", () => {
    const { track, utterance } = textToKlattTrackDetailed("hello world", 110, 30);
    const frames = utterance.getRelation("Frames")?.listItems();
    expect(frames).toHaveLength(track.length);
    frames!.forEach((frame, i) => {
      expect(frame.type).toBe("frame");
      expect(utterance.resolveAnchorTime(frame)).toBeCloseTo(
        frame.get("controlTimeMs") as number,
        10,
      );
      expect(frame.get("outputTimeMs")).toBeCloseTo(track[i].time * 1000, 10);
      for (const key of Object.keys(track[i].params)) {
        expect(frame.has(key)).toBe(false);
        expect(frame.latestWrite(key)).toBeUndefined();
        const chain = decisionChain(utterance.provenance, track[i].provenance![key]);
        expect(chain[0].citations.length).toBeGreaterThan(0);
      }
      expect(frame.has("segment")).toBe(false);
    });
  });

  it("memoizes authored F1 copying and projects its actual source ancestry without writes", () => {
    const { utterance, items, options } = fixture();
    options.transitions.blend.keys = [];
    const program = checkRequestedAttributes(
      loadBundledRulepackSpec("qlatt-english"),
      "frame_copy",
    );
    const result = lowerToFrames(utterance, options, { frameCopy: program });
    const index = result.frames.findIndex((row) => row.segmentId === "s0");
    const row = result.frames[index];
    const frame = utterance.relation("Frames").listItems()[index];
    expect(row.params.F1).toBe(400);
    expect(Object.keys(row.params)).toEqual(["F1", "F2"]);
    const chain = decisionChain(utterance.provenance, row.provenance!.F1);
    expect(chain[0].type).toBe("attribute_evaluated");
    expect(chain[0].subject).toBe(`item:${frame.id}.copied_f1`);
    expect(chain[0].reason).toContain("frame-schema.yaml");
    expect(chain.some((record) => record.subject.endsWith(".frame_segments"))).toBe(true);
    expect(chain.map((record) => record.id)).toContain(items[0].latestWrite("F1")!.decisionId);
    expect(chain.map((record) => record.id)).not.toContain(items[0].latestWrite("F2")!.decisionId);
    expect(frame.latestWrite("F1")).toBeUndefined();
    expect(
      utterance
        .journal()
        .filter((entry) => entry.metadata.ruleId.startsWith("lowering."))
        .map((entry) => entry.metadata.ruleId),
    ).not.toContain("lowering.frame_copy");

    const before = [utterance.committedGeneration(), utterance.journal()];
    const request = new RequestedAttributes(utterance, program);
    const first = request.evaluate(frame, "copied_f1");
    expect(request.evaluate(frame, "copied_f1")).toBe(first);
    expect(request.evaluationCount).toBe(3);
    expect(request.evaluate(frame, "copied_f1", "values").value).toBe(first.value);
    expect(first.evidence!.reads.some((read) => read.subject === `${items[0].id}.F1`)).toBe(true);
    const projected = new WeakMap();
    const id = recordFrameEvaluation(utterance, program, first.evidence!, projected);
    const count = utterance.provenance.size;
    expect(recordFrameEvaluation(utterance, program, first.evidence!, projected)).toBe(id);
    expect(utterance.provenance.size).toBe(count);
    expect([utterance.committedGeneration(), utterance.journal()]).toEqual(before);
  });

  it("retains both midpoint sources and an intermediate computation without unrelated fields", () => {
    const { utterance, items, options } = fixture();
    const anchors = items.map((item) => utterance.intervalAnchor(item));
    const durations = items.map((item) => item.latestWrite("duration"));
    const result = lowerToFrames(utterance, options);
    const row = result.frames.find((row) => row.segmentId === "s0" && row.params.F1 === 540)!;
    expect(row).toBeDefined();
    const chain = decisionChain(utterance.provenance, row.provenance!.F1);
    expect(chain.map((record) => record.id)).toEqual(
      expect.arrayContaining([
        items[0].latestWrite("F1")!.decisionId,
        items[1].latestWrite("F1")!.decisionId,
      ]),
    );
    expect(chain.some((record) => record.subject.endsWith("._transition_F1_start"))).toBe(true);
    expect(chain.map((record) => record.id)).not.toContain(items[2].latestWrite("F1")!.decisionId);
    expect(chain.map((record) => record.id)).not.toContain(items[0].latestWrite("F2")!.decisionId);
    expect(items.map((item) => utterance.intervalAnchor(item))).toEqual(anchors);
    expect(items.map((item) => item.latestWrite("duration"))).toEqual(durations);
  });

  it("preserves coincident initial events and rejects zero duration with the existing diagnostic", () => {
    const { utterance, items, options } = fixture(0);
    const result = lowerToFrames(utterance, options);
    expect(result.frames.slice(0, 2).map((row) => [row.time, row.segmentId])).toEqual([
      [0, undefined],
      [0, "s0"],
    ]);
    items[0].set("duration", 0, {
      reason: "invalid input fixture",
      citations: ["engineering test fixture"],
    });
    expect(() => lowerToFrames(utterance, options)).toThrow("E_HRG_LOWER_DURATION_REQUIRED");
    expect(utterance.diagnostics.getEntries().at(-1)?.code).toBe("HRG_LOWER_DURATION_REQUIRED");
  });

  it("tracks the Segment association and source field through current.segment", () => {
    const { utterance, options } = fixture();
    lowerToFrames(utterance, options);
    const frame = utterance
      .relation("Frames")
      .listItems()
      .find((item) => utterance.associatedItems(item, "segment").length)!;
    const source = utterance.associatedItems(frame, "segment")[0];
    const spec = compileRuleEngineSpec({
      relations: {
        Frames: { type: "parallel", features: { F1: [] } },
        Segment: { type: "base", features: { F1: [] } },
      },
      rules: {
        copy: {
          select: { relation: "Frames", where: "current.segment != null" },
          apply: [{ field: "F1", op: "set", value: "current.segment.F1", tag: "frame_copy" }],
          citations: ["engineering association fixture"],
        },
      },
      phases: [{ name: "test", rules: ["copy"] }],
    });
    runGraphRuleEngine(utterance, spec);
    expect(frame.latestWrite("F1")!.parents).toEqual(
      expect.arrayContaining([
        source.latestWrite("F1")!.decisionId,
        utterance.latestAssociationWrites(frame, "segment")[0].decisionId,
      ]),
    );
    expect(frame.has("segment")).toBe(false);
  });
});
