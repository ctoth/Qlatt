import { describe, expect, it } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { TemporalAxis, UndoLog, Utterance } from "../src/declarative-frontend/hrg";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import { createDiagnostics } from "../src/diagnostics";
import {
  type AddDecisionInput,
  createProvenanceCollector,
  type DecisionRecord,
  type ProvenanceCollector,
} from "../src/provenance";

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        dur_ms: { kind: "number" },
        energy: { kind: "number" },
      },
    },
    syllable: { features: { stress: { kind: "number" } } },
  },
  relations: {
    Segment: { kind: "list", itemTypes: ["segment"] },
    Syllable: { kind: "list", itemTypes: ["syllable"] },
    SylStructure: { kind: "tree", itemTypes: ["syllable", "segment"] },
  },
} as const satisfies HrgSchema;

const INPUT = { reason: "fixture", citations: ["Taylor, Black & Caley 2001"] };

const META = {
  ruleId: "expand_segment",
  phase: "structural",
  tag: "structural",
  reason: "expand_segment matched",
  citations: ["Klatt 1976"],
};

const INJECTED = "E_TEST_INJECTED_COMMIT_FAILURE";

/**
 * A provenance collector that, once armed, fails the next decision recorded
 * for a subject. `provenance.add` is the deepest primitive every stamped write
 * shares, so failing there lands mid-commit after earlier operations have
 * already been applied.
 */
function faultyProvenance(): ProvenanceCollector & {
  failOn(subject: string, afterAdd?: boolean): void;
} {
  const inner = createProvenanceCollector();
  let armed: string | null = null;
  let failAfterAdd = false;
  return {
    get size(): number {
      return inner.size;
    },
    add(input: AddDecisionInput): DecisionRecord {
      if (input.subject === armed && !failAfterAdd) throw new Error(`${INJECTED}: ${armed}`);
      const decision = inner.add(input);
      if (input.subject === armed) throw new Error(`${INJECTED}: ${armed}`);
      return decision;
    },
    getDecisions: () => inner.getDecisions(),
    truncate: (length: number) => inner.truncate(length),
    failOn: (subject: string, afterAdd = false) => {
      armed = subject;
      failAfterAdd = afterAdd;
    },
  };
}

function snapshot(utterance: Utterance) {
  return {
    digest: utterance.graphDigest(),
    decisions: utterance.provenance.getDecisions(),
    journal: utterance.journal(),
    markCount: utterance.axis.marks.size,
    segmentIds: utterance.segments.listItems().map((item) => item.id),
    segmentWrites: utterance.segments.writes().length,
    treeWrites: utterance.sylStructure.writes().length,
  };
}

describe("HRG transaction commit rollback", () => {
  it("undoes applied writes when a later commit callback throws", () => {
    const diagnostics = createDiagnostics();
    const utterance = new Utterance(SCHEMA, undefined, diagnostics);
    const segment = utterance.createItem("segment", "s1");
    segment.set("phoneme", "AA", INPUT);
    utterance.segments.append(segment, INPUT);

    const transaction = utterance.beginTransaction(META);
    transaction.set(segment, "dur_ms", 120);
    const staged = transaction.createItem("segment", "s2");
    transaction.set(staged, "phoneme", "B");
    transaction.append("Segment", staged);
    // The staged id is taken before the transaction commits: prepare still
    // passes (the item is staged) but the create_item callback throws after
    // the dur_ms write has already been applied.
    utterance.createItem("segment", "s2");
    const before = snapshot(utterance);

    expect(() => transaction.commit()).toThrowError(/E_HRG_DUPLICATE_ITEM/);

    expect(utterance.graphDigest()).toBe(before.digest);
    expect(segment.has("dur_ms")).toBe(false);
    expect(segment.writes("dur_ms")).toEqual([]);
    expect(utterance.provenance.getDecisions()).toEqual(before.decisions);
    expect(utterance.journal()).toEqual(before.journal);
    expect(utterance.segments.listItems().map((item) => item.id)).toEqual(before.segmentIds);
    expect(utterance.rejections()).toEqual([
      expect.objectContaining({
        stage: "commit",
        metadata: expect.objectContaining({ ruleId: META.ruleId, phase: META.phase }),
        message: expect.stringContaining("E_HRG_DUPLICATE_ITEM"),
        journalLength: 0,
      }),
    ]);
    expect(utterance.rejections()[0]?.undoneMutations).toBeGreaterThan(0);
    expect(Object.isFrozen(utterance.rejections())).toBe(true);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({
        level: "error",
        code: "HRG_TRANSACTION_ROLLED_BACK",
        data: expect.objectContaining({ ruleId: META.ruleId, phase: META.phase }),
      }),
    );
    expect(() => transaction.commit()).toThrowError(/E_HRG_TRANSACTION_CLOSED/);
  });

  it("records prepare rejections alongside commit rollbacks", () => {
    const utterance = new Utterance(SCHEMA);
    const segment = utterance.createItem("segment", "s1");
    const transaction = utterance.beginTransaction(META);
    transaction.set(segment, "dur_ms", "invalid");

    expect(() => transaction.commit()).toThrowError(/E_HRG_FEATURE_VALUE/);
    expect(utterance.rejections()).toEqual([
      expect.objectContaining({
        stage: "prepare",
        message: expect.stringContaining("E_HRG_FEATURE_VALUE"),
        journalLength: 0,
        undoneMutations: 0,
      }),
    ]);
  });

  it.each([false, true])(
    "restores composite writes when provenance fails (after add: %s)",
    (afterAdd) => {
      const provenance = faultyProvenance();
      const utterance = new Utterance(SCHEMA, provenance);
      const s1 = utterance.createItem("segment", "s1");
      const s2 = utterance.createItem("segment", "s2");
      const syllable = utterance.createItem("syllable", "syl1");
      s1.set("phoneme", "AA", INPUT);
      s2.set("phoneme", "B", INPUT);
      utterance.segments.append(s1, INPUT);
      utterance.syllables.append(syllable, INPUT);
      const root = utterance.sylStructure.addRoot(syllable, INPUT);
      utterance.sylStructure.addDaughter(root, s1, INPUT);
      utterance.resolveMarkTime(utterance.axis.start.id, 0, INPUT);
      const before = snapshot(utterance);
      const startTimeWrites = utterance.provenance
        .getDecisions()
        .filter((decision) => decision.subject === "axis:START.time_ms").length;
      provenance.failOn("item:s2.temporal_anchor", afterAdd);

      const transaction = utterance.beginTransaction(META);
      transaction.append("Segment", s2);
      transaction.addDaughter("SylStructure", syllable, s2);
      transaction.associate("link", s1, s2);
      transaction.resolveMarkTime(utterance.axis.start.id, 5);
      // Partitioning creates a new mark and anchors s1 before the s2 anchor
      // decision fails, so the rollback must also undo a partially applied
      // composite operation.
      transaction.partitionAnchors([s1, s2], utterance.axis.start.id, utterance.axis.end.id);

      expect(() => transaction.commit()).toThrowError(new RegExp(INJECTED));

      expect(utterance.graphDigest()).toBe(before.digest);
      expect(utterance.provenance.getDecisions()).toEqual(before.decisions);
      expect(utterance.journal()).toEqual(before.journal);
      expect(utterance.segments.listItems().map((item) => item.id)).toEqual(before.segmentIds);
      expect(utterance.segments.tail?.item).toBe(s1);
      expect(utterance.segments.node(s2)).toBeUndefined();
      expect(utterance.segments.writes()).toHaveLength(before.segmentWrites);
      expect(utterance.segments.latestWrite(s2)).toBeUndefined();
      expect(s2.nodes.size).toBe(0);
      expect(root.daughters.map((node) => node.item.id)).toEqual(["s1"]);
      expect(root.daughters[0]?.next).toBeNull();
      expect(utterance.sylStructure.writes()).toHaveLength(before.treeWrites);
      expect(utterance.associatedItems(s1, "link")).toEqual([]);
      expect(utterance.associationWrites(s1, "link", s2)).toEqual([]);
      expect(utterance.axis.getMarkTime(utterance.axis.start.id)).toBe(0);
      expect(utterance.axis.marks.size).toBe(before.markCount);
      expect(utterance.temporalAnchor(s1)).toBeUndefined();
      expect(utterance.temporalAnchor(s2)).toBeUndefined();
      expect(
        utterance.provenance
          .getDecisions()
          .filter((decision) => decision.subject === "axis:START.time_ms"),
      ).toHaveLength(startTimeWrites);
      expect(utterance.rejections()).toEqual([
        expect.objectContaining({ stage: "commit", message: expect.stringContaining(INJECTED) }),
      ]);
    },
  );

  it("restores existing versions and detaches created items before a subsequent successful commit", () => {
    const provenance = faultyProvenance();
    const utterance = new Utterance(SCHEMA, provenance);
    const setup = utterance.beginTransaction(META);
    const left = setup.createItem("segment", "left");
    const right = setup.createItem("segment", "right");
    const root = setup.createItem("syllable", "root");
    setup.append("Segment", left).append("Segment", right);
    setup.addRoot("SylStructure", root);
    setup.set(left, "energy", 1).associate("link", left, right);
    setup.anchorPoint(left, utterance.axis.start.id, utterance.axis.end.id, 0.25);
    setup.commit();
    const leftNode = utterance.segments.node(left);
    const rightNode = utterance.segments.node(right);
    const rootNode = utterance.sylStructure.node(root);
    const before = snapshot(utterance);
    provenance.failOn("item:right.energy");

    const transaction = utterance.beginTransaction(META);
    const middle = transaction.createItem("segment", "middle");
    const newRoot = transaction.createItem("syllable", "new-root");
    transaction.set(middle, "phoneme", "B");
    transaction.insertAfter("Segment", left, middle);
    transaction.addRoot("SylStructure", newRoot);
    transaction.addDaughter("SylStructure", newRoot, middle);
    transaction.set(left, "energy", 2).set(left, "energy", 3);
    transaction.disassociate("link", left, right);
    transaction.anchorPoint(left, utterance.axis.start.id, utterance.axis.end.id, 0.75);
    transaction.resolveMarkTime(utterance.axis.end.id, 100);
    transaction.set(right, "energy", 5);

    expect(() => transaction.commit()).toThrowError(new RegExp(INJECTED));
    expect(snapshot(utterance)).toEqual(before);
    expect(utterance.getItem("middle")).toBeUndefined();
    expect(utterance.getItem("new-root")).toBeUndefined();
    expect(middle.creationDecisionId()).toBeNull();
    expect(middle.featureKeys()).toEqual([]);
    expect(middle.nodes.size).toBe(0);
    expect(newRoot.nodes.size).toBe(0);
    expect(leftNode?.next).toBe(rightNode);
    expect(rightNode?.prev).toBe(leftNode);
    expect(utterance.sylStructure.head).toBe(rootNode);
    expect(utterance.sylStructure.tail).toBe(rootNode);
    expect(rootNode?.next).toBeNull();
    expect(left.get("energy")).toBe(1);
    expect(utterance.associatedItems(left, "link")).toEqual([right]);
    expect(utterance.rejections()[0]?.journalLength).toBe(1);

    const next = utterance.beginTransaction(META);
    const replacement = next.createItem("segment", "middle");
    next.insertAfter("Segment", left, replacement);
    expect(next.commit().id).toBe("tx_000001");
    expect(utterance.segments.listItems()).toEqual([left, replacement, right]);
  });

  it.each(["insert_after", "add_daughter"] as const)(
    "rolls back the late %s self-reference check",
    (kind) => {
      const utterance = new Utterance(SCHEMA);
      const before = snapshot(utterance);
      const transaction = utterance.beginTransaction(META);
      const item = transaction.createItem("segment", "self");
      transaction.set(item, "energy", 1);
      if (kind === "insert_after") transaction.insertAfter("Segment", item, item);
      else transaction.addDaughter("SylStructure", item, item);
      expect(() => transaction.commit()).toThrowError(/E_HRG_(PREVIOUS|PARENT)_RELATION/);
      expect(snapshot(utterance)).toEqual(before);
      expect(utterance.rejections()[0]?.stage).toBe("commit");
    },
  );

  it("rewinds decision ids so later writes continue the pre-commit sequence", () => {
    const provenance = faultyProvenance();
    const utterance = new Utterance(SCHEMA, provenance);
    const s1 = utterance.createItem("segment", "s1");
    const s2 = utterance.createItem("segment", "s2");
    s1.set("phoneme", "AA", INPUT);
    const lastDecision = utterance.provenance.getDecisions().at(-1);
    if (!lastDecision) throw new Error("missing fixture decision");
    provenance.failOn("item:s1.dur_ms");

    const transaction = utterance.beginTransaction(META);
    transaction.set(s2, "phoneme", "B");
    transaction.set(s1, "dur_ms", 120);
    expect(() => transaction.commit()).toThrowError(new RegExp(INJECTED));

    const next = s2.set("phoneme", "C", INPUT);
    expect(next.decisionId).toBe(`d${String(lastDecision.seq + 1).padStart(6, "0")}`);
    expect(next.version).toBe(0);
  });

  it("leaves the rule engine at the pre-transaction digest when a commit callback throws", () => {
    const provenance = faultyProvenance();
    const diagnostics = createDiagnostics();
    const utterance = new Utterance(SCHEMA, provenance, diagnostics);
    const vowel = utterance.createItem("segment", "vowel");
    vowel.set("phoneme", "AA", INPUT);
    vowel.set("dur_ms", 100, INPUT);
    vowel.set("energy", 1, INPUT);
    utterance.segments.append(vowel, INPUT);
    const before = snapshot(utterance);
    provenance.failOn("item:vowel.dur_ms");
    const spec = compileRuleEngineSpec({
      relations: {
        Segment: {
          type: "base",
          features: { phoneme: ["AA", "B"] },
          scalars: { dur_ms: {}, energy: {} },
        },
      },
      rules: {
        lengthen: {
          kind: "scalar",
          select: { relation: "Segment", where: "current.phoneme == 'AA'" },
          apply: [
            { field: "energy", op: "set", value: "2", tag: "duration" },
            { field: "dur_ms", op: "mul", value: "1.5", tag: "duration" },
          ],
          citations: ["Klatt 1976"],
        },
      },
      phases: [{ name: "duration", rules: ["lengthen"] }],
    });

    expect(() => runGraphRuleEngine(utterance, spec)).toThrowError(new RegExp(INJECTED));

    expect(utterance.graphDigest()).toBe(before.digest);
    expect(vowel.get("energy")).toBe(1);
    expect(vowel.get("dur_ms")).toBe(100);
    expect(utterance.provenance.getDecisions()).toEqual(before.decisions);
    expect(utterance.journal()).toEqual([]);
    expect(utterance.ruleAttempts()).toContainEqual(
      expect.objectContaining({
        status: "transaction_rejected",
        rule: "lengthen",
        message: expect.stringContaining(INJECTED),
      }),
    );
    expect(utterance.rejections()).toEqual([
      expect.objectContaining({
        stage: "commit",
        metadata: expect.objectContaining({ ruleId: "lengthen" }),
      }),
    ]);
    expect(diagnostics.getEntries()).toContainEqual(
      expect.objectContaining({ code: "HRG_TRANSACTION_ROLLED_BACK" }),
    );
  });
});

describe("UndoLog", () => {
  it("runs recorded inverses in reverse order and ignores records outside capture", () => {
    const log = new UndoLog();
    const order: string[] = [];
    log.record(() => order.push("ignored"));
    log.begin();
    log.record(() => order.push("first"));
    log.record(() => order.push("second"));
    expect(() => log.begin()).toThrowError(/E_HRG_UNDO_NESTED/);
    expect(log.rollback()).toBe(2);
    expect(order).toEqual(["second", "first"]);
    expect(log.capturing).toBe(false);

    log.begin();
    log.record(() => order.push("kept"));
    expect(log.end()).toBe(1);
    expect(order).toEqual(["second", "first"]);
  });
});

describe("TemporalAxis undo", () => {
  function orders(axis: TemporalAxis): Array<[string, string]> {
    return [...axis.marks.values()].map((mark) => [mark.id, JSON.stringify(mark.order)]);
  }

  it("restores mark ranks after a rank-space rebalance is rolled back", () => {
    const undo = new UndoLog();
    const axis = new TemporalAxis(undo);
    const first = axis.createBetween(axis.start.id, axis.end.id, null);
    const firstOrder = JSON.stringify(first.order);
    const before = orders(axis);

    undo.begin();
    let right = first.id;
    let rebalanced = false;
    // Bisecting toward START exhausts the base-36 rank space and forces a rebalance.
    for (let index = 0; index < 80 && !rebalanced; index += 1) {
      right = axis.createBetween(axis.start.id, right, null).id;
      rebalanced = JSON.stringify(axis.get(first.id)?.order) !== firstOrder;
    }
    expect(rebalanced).toBe(true);
    expect(undo.rollback()).toBeGreaterThan(0);

    expect(orders(axis)).toEqual(before);
    expect(axis.marks.size).toBe(3);
    expect(axis.compare(axis.start.id, first.id)).toBeLessThan(0);
    expect(axis.createBetween(axis.start.id, first.id, null).id).not.toBe(first.id);
  });
});
