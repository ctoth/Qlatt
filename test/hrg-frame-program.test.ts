/**
 * Rules of kind `frame` (src/declarative-frontend/hrg/frame-program.ts): the
 * machine, its load-time validation, its run inside the rule engine and what
 * lowering makes of the result. The programs here are a tank that fills and
 * drains; nothing in them belongs to any synthesizer.
 */

import { describe, expect, it } from "vitest";
import type { HrgSchema, LowerOptions } from "../src/declarative-frontend/hrg";
import { lowerToFrames, replayJournal, Utterance } from "../src/declarative-frontend/hrg";
import {
  FRAME_VALUES_SCHEMA,
  type FrameRule,
  frameValueFeatures,
  runFrameProgram,
} from "../src/declarative-frontend/hrg/frame-program";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import { parseDslSpec } from "../src/declarative-frontend/parser";
import { compileRuleEngineSpec } from "../src/declarative-frontend/rule-pack";
import { validateDslSpec } from "../src/declarative-frontend/validation";

const CITATION = "fixture: frame program test";

function rule(name: string, fields: Partial<FrameRule>): FrameRule {
  return { name, unit: null, when: null, set: [], citations: [CITATION], ...fields };
}

describe("frame program machine", () => {
  it("runs the rules in order every frame and keeps registers across units", () => {
    const results = runFrameProgram({
      registers: { level: 0, target: 0, full: false },
      outputs: { LEVEL: "r.level", TARGET: "r.target" },
      edgeFeatures: { open: false },
      params: { policy: { step: 4 } },
      units: [
        { features: { open: true }, frames: 3 },
        { features: { open: false }, frames: 4 },
      ],
      rules: [
        rule("target_when_open", {
          unit: "u.open",
          when: "f.index == 0",
          set: [{ register: "target", value: "params.policy.step * 4", tag: "t" }],
        }),
        rule("target_when_shut", {
          unit: "!u.open",
          when: "f.index == 0",
          set: [{ register: "target", value: "0", tag: "t" }],
        }),
        // A quarter of the remaining distance, rounded toward minus infinity.
        rule("approach", {
          set: [
            { register: "level", value: "r.level + floor((r.target - r.level) / 4)", tag: "t" },
          ],
        }),
        rule("mark_full", {
          when: "!r.full && r.level >= 9",
          set: [{ register: "full", value: "true", tag: "t" }],
        }),
      ],
    });

    expect(results.map((result) => result.columns.TARGET)).toEqual([
      [16, 16, 16],
      [0, 0, 0, 0],
    ]);
    // 0 -> 4 -> 7 -> 9, then toward 0: 9 + floor(-9/4) = 6, 4, 3, 2.
    expect(results.map((result) => result.columns.LEVEL)).toEqual([
      [4, 7, 9],
      [6, 4, 3, 2],
    ]);
    expect(results[0]?.fired).toEqual([
      { rule: "target_when_open", first: 0, last: 0, count: 1 },
      { rule: "approach", first: 0, last: 2, count: 3 },
      { rule: "mark_full", first: 2, last: 2, count: 1 },
    ]);
    expect(results[1]?.fired).toEqual([
      { rule: "target_when_shut", first: 0, last: 0, count: 1 },
      { rule: "approach", first: 0, last: 3, count: 4 },
    ]);
  });

  it("gives every counter and the neighbouring units' features", () => {
    const results = runFrameProgram({
      registers: { seen: 0 },
      outputs: {
        INDEX: "f.index",
        COUNT: "f.count",
        UNIT: "f.unit",
        UNITS: "f.units",
        FRAME: "f.frame",
        FRAMES: "f.frames",
        PREV: "f.prev_count",
        NEXT: "f.next_count",
        PREV_SIZE: "p.size",
        NEXT_SIZE: "n.size",
      },
      edgeFeatures: { size: -1 },
      params: {},
      units: [
        { features: { size: 10 }, frames: 2 },
        { features: { size: 20 }, frames: 1 },
      ],
      rules: [],
    });
    expect(results[0]?.columns).toEqual({
      INDEX: [0, 1],
      COUNT: [2, 2],
      UNIT: [0, 0],
      UNITS: [2, 2],
      FRAME: [0, 1],
      FRAMES: [3, 3],
      PREV: [0, 0],
      NEXT: [1, 1],
      PREV_SIZE: [-1, -1],
      NEXT_SIZE: [20, 20],
    });
    expect(results[1]?.columns).toMatchObject({
      INDEX: [0],
      UNIT: [1],
      FRAME: [2],
      PREV: [2],
      NEXT: [0],
      PREV_SIZE: [10],
      NEXT_SIZE: [-1],
    });
  });

  it("groups units and knows a group's totals before its first frame", () => {
    const results = runFrameProgram({
      registers: { seen: 0 },
      outputs: {
        G_FRAME: "g.frame",
        G_FRAMES: "g.frames",
        G_UNIT: "g.unit",
        G_UNITS: "g.units",
        LOUD: "g.loud_frames",
        LEFT: "g.loud_frames - r.seen",
      },
      edgeFeatures: { first: false, loud: false },
      params: {},
      group: { start: "u.first", totals: { loud_frames: "u.loud ? f.count : 0" } },
      units: [
        { features: { first: true, loud: true }, frames: 2 },
        { features: { first: false, loud: false }, frames: 1 },
        { features: { first: true, loud: true }, frames: 1 },
        { features: { first: false, loud: true }, frames: 2 },
      ],
      rules: [
        rule("reset", {
          when: "g.frame == 0",
          set: [{ register: "seen", value: "0", tag: "t" }],
        }),
        rule("count", {
          unit: "u.loud && g.loud_frames > 2",
          set: [{ register: "seen", value: "r.seen + 1", tag: "t" }],
        }),
      ],
    });
    const column = (name: string) => results.flatMap((result) => result.columns[name]);
    expect(column("G_FRAME")).toEqual([0, 1, 2, 0, 1, 2]);
    expect(column("G_FRAMES")).toEqual([3, 3, 3, 3, 3, 3]);
    expect(column("G_UNIT")).toEqual([0, 0, 1, 0, 1, 1]);
    expect(column("G_UNITS")).toEqual([2, 2, 2, 2, 2, 2]);
    expect(column("LOUD")).toEqual([2, 2, 2, 3, 3, 3]);
    // Only the second group has more than two loud frames to count down.
    expect(column("LEFT")).toEqual([2, 2, 2, 2, 1, 0]);
  });

  it("has max, min, abs and pow beside the context-free functions", () => {
    const results = runFrameProgram({
      registers: { level: -7, shift: 2 },
      outputs: {
        MAX: "max([r.level, 0])",
        MIN: "min(r.level, 3)",
        ABS: "abs(r.level)",
        // An arithmetic shift right: floor, not truncation.
        SHIFT: "floor(r.level / pow(2, r.shift))",
      },
      edgeFeatures: {},
      params: {},
      units: [{ features: {}, frames: 1 }],
      rules: [],
    });
    expect(results[0]?.columns).toEqual({ MAX: [0], MIN: [-7], ABS: [7], SHIFT: [-2] });
  });

  it("rejects a value of the wrong type and a condition that is not true or false", () => {
    const base = {
      registers: { level: 0 },
      outputs: { LEVEL: "r.level" },
      edgeFeatures: {},
      params: {},
      units: [{ features: {}, frames: 1 }],
    };
    expect(() =>
      runFrameProgram({
        ...base,
        rules: [rule("bad", { set: [{ register: "level", value: "true", tag: "t" }] })],
      }),
    ).toThrow(/E_FRAME_REGISTER_TYPE.*rule 'bad' register 'level'/);
    expect(() =>
      runFrameProgram({
        ...base,
        rules: [
          rule("bad", { when: "r.level", set: [{ register: "level", value: "1", tag: "t" }] }),
        ],
      }),
    ).toThrow(/E_FRAME_CONDITION.*rule 'bad' when/);
  });
});

const TANK_SPEC = {
  parameters: {
    policy: {
      tank: {
        frame_ms: { value: 5, citations: [CITATION] },
        fill: { value: 8, citations: [CITATION] },
      },
    },
  },
  tags: { tank: "level of the fixture tank" },
  relations: {
    Segment: {
      type: "base",
      scalars: { duration: {} },
      features: { active: [true, false], valve: ["open", "shut", "pipe"], tank_frames: [] },
    },
  },
  frame_programs: {
    tank: {
      relation: "Segment",
      unit: "current.valve != 'pipe'",
      frame_ms: "params.policy.tank.frame_ms",
      lead_in_frames: "2",
      features: {
        open: { value: "current.valve == 'open'", edge: false },
      },
      registers: { level: 0, target: 0 },
      outputs: { LEVEL: "r.level", INDEX: "f.index" },
      write: "tank_frames",
      tag: "tank",
      citations: [CITATION],
    },
  },
  rules: {
    tank_target_open: {
      kind: "frame",
      program: "tank",
      unit: "u.open",
      when: "f.index == 0",
      set: [{ register: "target", value: "params.policy.tank.fill", tag: "tank" }],
      citations: ["fixture: valve open"],
    },
    tank_target_shut: {
      kind: "frame",
      program: "tank",
      unit: "!u.open",
      when: "f.index == 0",
      set: [{ register: "target", value: 0, tag: "tank" }],
      citations: ["fixture: valve shut"],
    },
    tank_approach: {
      kind: "frame",
      program: "tank",
      set: [{ register: "level", value: "r.level + floor((r.target - r.level) / 2)", tag: "tank" }],
      citations: ["fixture: approach"],
    },
  },
  phases: [
    { name: "tank", rules: ["tank_target_open", "tank_target_shut", "tank_approach"] },
    { name: "finalize", after: ["tank"], rules: [], compute_times: true },
  ],
};

function codes(spec: unknown): string[] {
  return validateDslSpec(parseDslSpec(spec) as Record<string, unknown>).map(
    (diagnostic) => `${diagnostic.code} ${diagnostic.path}`,
  );
}

function withRule(name: string, changes: Record<string, unknown>): unknown {
  return {
    ...TANK_SPEC,
    rules: {
      ...TANK_SPEC.rules,
      [name]: { ...TANK_SPEC.rules[name as keyof typeof TANK_SPEC.rules], ...changes },
    },
  };
}

function withProgram(changes: Record<string, unknown>): unknown {
  return {
    ...TANK_SPEC,
    frame_programs: { tank: { ...TANK_SPEC.frame_programs.tank, ...changes } },
  };
}

describe("frame program validation", () => {
  it("accepts the fixture", () => {
    expect(codes(TANK_SPEC)).toEqual([]);
  });

  it("requires citations on rule and program, and a declared tag on every assignment", () => {
    expect(codes(withRule("tank_approach", { citations: [] }))).toContain(
      "E_RULE_CITATIONS_REQUIRED rules.tank_approach.citations",
    );
    expect(codes(withProgram({ citations: [] }))).toContain(
      "E_RULE_CITATIONS_REQUIRED frame_programs.tank.citations",
    );
    expect(
      codes(withRule("tank_approach", { set: [{ register: "level", value: "r.level" }] })),
    ).toContain("E_RULE_TAG_REQUIRED rules.tank_approach.set[0].tag");
    expect(
      codes(
        withRule("tank_approach", { set: [{ register: "level", value: "r.level", tag: "nope" }] }),
      ),
    ).toContain("E_RULE_TAG_UNKNOWN rules.tank_approach.set[0].tag");
    expect(codes(withProgram({ tag: "nope" }))).toContain(
      "E_RULE_TAG_UNKNOWN frame_programs.tank.tag",
    );
  });

  it("rejects undeclared registers, features, counters, parameters and variables", () => {
    expect(
      codes(withRule("tank_approach", { set: [{ register: "depth", value: "1", tag: "tank" }] })),
    ).toContain("E_FRAME_NAME_UNKNOWN rules.tank_approach.set[0].register");
    expect(codes(withRule("tank_approach", { when: "r.depth > 0" }))).toContain(
      "E_FRAME_NAME_UNKNOWN rules.tank_approach.when",
    );
    expect(codes(withRule("tank_approach", { when: "u.shut" }))).toContain(
      "E_FRAME_NAME_UNKNOWN rules.tank_approach.when",
    );
    expect(codes(withRule("tank_approach", { when: "n.shut" }))).toContain(
      "E_FRAME_NAME_UNKNOWN rules.tank_approach.when",
    );
    expect(codes(withRule("tank_approach", { when: "f.tick == 0" }))).toContain(
      "E_FRAME_NAME_UNKNOWN rules.tank_approach.when",
    );
    expect(codes(withRule("tank_approach", { when: "params.policy.tank.drain > 0" }))).toContain(
      "E_PARAM_UNKNOWN rules.tank_approach.when",
    );
    expect(codes(withRule("tank_approach", { when: "current.valve == 'open'" }))).toContain(
      "E_CEL_INVALID rules.tank_approach.when",
    );
    expect(codes(withProgram({ outputs: { LEVEL: "r.depth" } }))).toContain(
      "E_FRAME_NAME_UNKNOWN frame_programs.tank.outputs.LEVEL",
    );
  });

  it("rejects a function that reads Items in a frame expression", () => {
    expect(codes(withRule("tank_approach", { when: "word_count() > 2" }))).toContain(
      "E_FRAME_FUNCTION rules.tank_approach.when",
    );
    expect(
      codes(withProgram({ outputs: { LEVEL: "max([r.level, 0])", INDEX: "f.index" } })),
    ).toEqual([]);
  });

  it("keeps registers and counters out of the once-per-unit condition", () => {
    expect(codes(withRule("tank_approach", { unit: "r.level > 0" }))).toContain(
      "E_CEL_INVALID rules.tank_approach.unit",
    );
    expect(codes(withRule("tank_approach", { unit: "f.index == 0" }))).toContain(
      "E_CEL_INVALID rules.tank_approach.unit",
    );
  });

  it("checks the program's own fields", () => {
    expect(codes(withProgram({ relation: "Tank" }))).toContain(
      "E_RULE_RELATION_UNKNOWN frame_programs.tank.relation",
    );
    expect(codes(withProgram({ write: "elsewhere" }))).toContain(
      "E_RULE_FEATURE_UNKNOWN frame_programs.tank.write",
    );
    expect(codes(withProgram({ registers: { level: "low" } }))).toContain(
      "E_FRAME_PROGRAM_SCHEMA frame_programs.tank.registers.level",
    );
    expect(codes(withProgram({ features: { open: "current.valve == 'open'" } }))).toContain(
      "E_FRAME_PROGRAM_SCHEMA frame_programs.tank.features.open",
    );
    expect(
      codes(withProgram({ features: { open: { value: "current.nozzle == 1", edge: false } } })),
    ).toContain("E_RULE_FEATURE_UNKNOWN frame_programs.tank.features.open.value");
    expect(codes(withProgram({ speed: 3 }))).toContain(
      "E_FRAME_PROGRAM_SCHEMA frame_programs.tank.speed",
    );
    expect(
      codes({
        ...TANK_SPEC,
        output: { lowering: { columns: ["INDEX"] } },
      }),
    ).toContain("E_FRAME_OUTPUT_COLUMN frame_programs.tank.outputs.LEVEL");
  });

  it("rejects a frame rule with a select, an unknown program, or frame fields on another kind", () => {
    expect(
      codes(withRule("tank_approach", { select: { relation: "Segment", where: "true" } })),
    ).toContain("E_RULE_FIELD_UNKNOWN rules.tank_approach.select");
    expect(codes(withRule("tank_approach", { program: "sink" }))).toContain(
      "E_FRAME_PROGRAM_UNKNOWN rules.tank_approach.program",
    );
    expect(
      codes({
        ...TANK_SPEC,
        rules: {
          ...TANK_SPEC.rules,
          plain: {
            select: { relation: "Segment", where: "true" },
            when: "true",
            citations: [CITATION],
          },
        },
      }),
    ).toContain("E_RULE_FIELD_UNKNOWN rules.plain.when");
  });

  it("checks a group's expressions and every read of its totals", () => {
    const grouped = {
      group: { start: "u.open", totals: { open_frames: "u.open ? f.count : 0" } },
      outputs: { LEVEL: "r.level", INDEX: "g.open_frames - g.frame" },
    };
    expect(codes(withProgram(grouped))).toEqual([]);
    expect(codes(withProgram({ ...grouped, outputs: { LEVEL: "g.shut_frames" } }))).toContain(
      "E_FRAME_NAME_UNKNOWN frame_programs.tank.outputs.LEVEL",
    );
    expect(
      codes(withProgram({ ...grouped, group: { start: "r.level > 0", totals: {} } })),
    ).toContain("E_CEL_INVALID frame_programs.tank.group.start");
    expect(
      codes(withProgram({ ...grouped, group: { start: "u.open", totals: { frames: "1" } } })),
    ).toContain("E_FRAME_PROGRAM_SCHEMA frame_programs.tank.group.totals.frames");
    expect(codes(withProgram({ ...grouped, group: { begin: "u.open" } }))).toContain(
      "E_FRAME_PROGRAM_SCHEMA frame_programs.tank.group",
    );
  });

  it("requires the rules of a program to sit in one phase", () => {
    expect(
      codes({
        ...TANK_SPEC,
        phases: [
          { name: "tank", rules: ["tank_target_open", "tank_target_shut"] },
          { name: "later", after: ["tank"], rules: ["tank_approach"] },
        ],
      }),
    ).toContain("E_FRAME_PROGRAM_PHASES frame_programs.tank");
  });
});

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        type: { kind: "string" },
        duration: { kind: "number" },
        active: { kind: "boolean" },
        valve: { kind: "string" },
        LEVEL: { kind: "number" },
        tank_frames: FRAME_VALUES_SCHEMA,
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

const META = {
  ruleId: "fixture",
  phase: "input",
  tag: "fixture",
  reason: "fixture",
  citations: [CITATION],
};

/** open (15 ms), a pipe that extends it (10 ms), shut (10 ms): 5 ms frames. */
function tankUtterance(): Utterance {
  const utterance = new Utterance(SCHEMA);
  const transaction = utterance.beginTransaction(META);
  const items = (
    [
      ["a", "open", 15],
      ["b", "pipe", 10],
      ["c", "shut", 10],
    ] as const
  ).map(([id, valve, duration]) => {
    const item = transaction.createItem("segment", id);
    transaction.set(item, "phoneme", id);
    transaction.set(item, "type", "vowel");
    transaction.set(item, "duration", duration);
    transaction.set(item, "active", true);
    transaction.set(item, "valve", valve);
    transaction.set(item, "LEVEL", -1);
    transaction.append("Segment", item);
    return item;
  });
  transaction.partitionAnchors(items, utterance.axis.start.id, utterance.axis.end.id);
  transaction.commit();
  return utterance;
}

describe("frame rules in the rule engine", () => {
  it("writes each Item its frames, through one cited transaction a unit", () => {
    const utterance = tankUtterance();
    const spec = compileRuleEngineSpec(TANK_SPEC);
    const before = utterance.journal().length;
    runGraphRuleEngine(utterance, spec);

    const frames = (id: string) => utterance.getItem(id)?.get("tank_frames");
    // Lead-in of 2 frames (shut: level stays 0), then unit a+b of 5 frames
    // toward 8 (4, 6, 7, 7, 7: floor of half the distance), then unit c of 2
    // frames toward 0 (7 + floor(-7/2) = 3, 3 + floor(-3/2) = 1).
    expect(frames("a")).toEqual({
      period_ms: 5,
      origin_ms: -10,
      columns: { LEVEL: [0, 0, 4, 6, 7], INDEX: [0, 1, 0, 1, 2] },
      fired: [
        { rule: "tank_target_shut", first: 0, last: 0, count: 1, lead_in: true },
        { rule: "tank_approach", first: 0, last: 1, count: 2, lead_in: true },
        { rule: "tank_target_open", first: 0, last: 0, count: 1, lead_in: false },
        { rule: "tank_approach", first: 0, last: 4, count: 5, lead_in: false },
      ],
    });
    expect(frames("b")).toEqual({
      period_ms: 5,
      origin_ms: 0,
      columns: { LEVEL: [7, 7], INDEX: [3, 4] },
      fired: [],
    });
    expect(frames("c")).toEqual({
      period_ms: 5,
      origin_ms: 0,
      columns: { LEVEL: [3, 1], INDEX: [0, 1] },
      fired: [
        { rule: "tank_target_shut", first: 0, last: 0, count: 1, lead_in: false },
        { rule: "tank_approach", first: 0, last: 1, count: 2, lead_in: false },
      ],
    });

    // Two units, two transactions (the third entry resolves times).
    const journal = utterance.journal().slice(before);
    const frameEntries = journal.filter((entry) => entry.metadata.ruleId === "tank:tank");
    expect(frameEntries).toHaveLength(2);
    expect(frameEntries[0]?.metadata).toMatchObject({
      phase: "tank",
      tag: "tank",
      citations: [CITATION, "fixture: valve shut", "fixture: approach", "fixture: valve open"],
    });
    expect(frameEntries[1]?.metadata.citations).toEqual([
      CITATION,
      "fixture: valve shut",
      "fixture: approach",
    ]);
    // One write an Item: the unit's transaction wrote both of its Items, and
    // each write carries the citations of the rules that assigned in the unit.
    expect(
      frameEntries[0]?.operations.map((operation) =>
        operation.kind === "set_feature" ? `${operation.itemId}.${operation.key}` : operation.kind,
      ),
    ).toEqual(["a.tank_frames", "b.tank_frames"]);
    expect(utterance.getItem("b")?.latestWrite("tank_frames")?.citations).toEqual(
      frameEntries[0]?.metadata.citations,
    );
    expect(
      utterance
        .ruleAttempts()
        .filter((attempt) => attempt.status === "fired")
        .map((attempt) => `${attempt.rule} ${attempt.itemIds.join("+")}`),
    ).toEqual([
      "tank_target_shut a+b",
      "tank_approach a+b",
      "tank_target_open a+b",
      "tank_target_shut c",
      "tank_approach c",
    ]);
    expect(replayJournal(SCHEMA, utterance.journal()).graphDigest()).toBe(utterance.graphDigest());
  });

  it("gives an Item that starts inside a frame the frames it overlaps", () => {
    // a 13 ms + b 12 ms: the unit is still 5 frames, and the boundary between
    // its Items falls inside frame 2 (10-15 ms), which both overlap.
    const utterance = tankUtterance();
    const transaction = utterance.beginTransaction(META);
    for (const [id, duration] of [
      ["a", 13],
      ["b", 12],
    ] as const) {
      const item = utterance.getItem(id);
      if (!item) throw new Error("fixture Item missing");
      transaction.set(item, "duration", duration);
    }
    transaction.commit();
    const spec = compileRuleEngineSpec(TANK_SPEC);
    runGraphRuleEngine(utterance, spec);

    expect(utterance.getItem("a")?.get("tank_frames")).toMatchObject({
      origin_ms: -10,
      columns: { LEVEL: [0, 0, 4, 6, 7] },
    });
    expect(utterance.getItem("b")?.get("tank_frames")).toMatchObject({
      origin_ms: -3,
      columns: { LEVEL: [7, 7, 7], INDEX: [2, 3, 4] },
    });
    expect(utterance.getItem("c")?.get("tank_frames")).toMatchObject({
      origin_ms: 0,
      columns: { LEVEL: [3, 1] },
    });
    expect(utterance.diagnostics.getEntries()).toEqual([]);

    // Events stay on the frame clock: b's first frame starts 2 ms into it.
    const lowered = lowerToFrames(utterance, POLICY, {
      frameValueFeatures: frameValueFeatures(spec.frame_programs),
    });
    expect(
      lowered.frames.map((frame) => [
        Math.round(frame.time * 1000),
        frame.params.LEVEL,
        frame.segmentId ?? null,
      ]),
    ).toEqual([
      [0, 0, null],
      [5, 0, null],
      [10, 4, "a"],
      [15, 6, "a"],
      [20, 7, "a"],
      [23, 7, "b"],
      [25, 7, "b"],
      [30, 7, "b"],
      [35, 3, "c"],
      [40, 1, "c"],
      [45, undefined, null],
    ]);
  });

  it("warns when a unit does not end on a frame", () => {
    const utterance = tankUtterance();
    const item = utterance.getItem("c");
    if (!item) throw new Error("fixture Item missing");
    const transaction = utterance.beginTransaction(META);
    transaction.set(item, "duration", 12);
    transaction.commit();
    runGraphRuleEngine(utterance, compileRuleEngineSpec(TANK_SPEC));
    expect(
      utterance.diagnostics
        .getEntries()
        .filter((entry) => entry.code === "HRG_FRAME_DURATION_ROUNDED")
        .map((entry) => entry.data),
    ).toEqual([{ itemId: "c", program: "tank", endMs: 37, framePeriodMs: 5, endFrame: 7 }]);
  });
});

const POLICY = {
  columns: ["LEVEL"],
  transitions: {
    min_transition_edge_ms: { value: 20, citations: [CITATION] },
    default_transition_ms: { value: 0 },
    blend: { factor: { value: 0 }, keys: [], smooth_types: [] },
  },
  timeline: {
    initial_silence_ms: { value: 10 },
    final_silence_ms: { value: 0 },
    duration_floors: { stop_release_ms: { value: 0 }, default_ms: { value: 0 } },
    event_points: {
      include_segment_start: true,
      include_control_boundaries: false,
      include_f0_anchors: false,
      include_transition_steady_time: false,
    },
  },
} as const satisfies LowerOptions;

describe("frame values in lowering", () => {
  it("emits one event a frame, lead-in included, with the unit's decision as provenance", () => {
    const utterance = tankUtterance();
    const spec = compileRuleEngineSpec(TANK_SPEC);
    runGraphRuleEngine(utterance, spec);
    const lowered = lowerToFrames(utterance, POLICY, {
      frameValueFeatures: frameValueFeatures(spec.frame_programs),
    });

    const rows = lowered.frames.map((frame) => [
      Math.round(frame.time * 1000),
      frame.params.LEVEL,
      frame.segmentId ?? null,
    ]);
    expect(rows).toEqual([
      [0, 0, null],
      [5, 0, null],
      [10, 4, "a"],
      [15, 6, "a"],
      [20, 7, "a"],
      [25, 7, "b"],
      [30, 7, "b"],
      [35, 3, "c"],
      [40, 1, "c"],
      [45, undefined, null],
    ]);
    const decision = (id: string) => utterance.getItem(id)?.latestWrite("tank_frames")?.decisionId;
    expect(lowered.frames[0]?.provenance?.LEVEL).toBe(decision("a"));
    expect(lowered.frames[3]?.provenance?.LEVEL).toBe(decision("a"));
    expect(lowered.frames[7]?.provenance?.LEVEL).toBe(decision("c"));
  });

  it("leaves the Segment's own value alone without the feature", () => {
    const utterance = tankUtterance();
    runGraphRuleEngine(
      utterance,
      compileRuleEngineSpec({
        ...TANK_SPEC,
        phases: [{ name: "finalize", rules: [], compute_times: true }],
        rules: {},
      }),
    );
    const lowered = lowerToFrames(utterance, POLICY, { frameValueFeatures: ["tank_frames"] });
    expect(
      lowered.frames.filter((frame) => frame.segmentId).map((frame) => frame.params.LEVEL),
    ).toEqual([-1, -1, -1]);
  });

  it("shows each frame delay_frames later, across Items, holding the first", () => {
    const delayed = {
      ...TANK_SPEC,
      frame_programs: {
        tank: {
          ...TANK_SPEC.frame_programs.tank,
          delay_frames: 1,
          outputs: { LEVEL: "r.level", FRAME: "f.frame" },
        },
      },
    };
    expect(codes(delayed)).toEqual([]);
    expect(
      codes({
        ...delayed,
        frame_programs: { tank: { ...delayed.frame_programs.tank, delay_frames: 0.5 } },
      }),
    ).toContain("E_FRAME_PROGRAM_SCHEMA frame_programs.tank.delay_frames");

    const utterance = tankUtterance();
    const spec = compileRuleEngineSpec(delayed);
    runGraphRuleEngine(utterance, spec);
    const lowered = lowerToFrames(
      utterance,
      { ...POLICY, columns: ["LEVEL", "FRAME"] },
      { frameValueFeatures: frameValueFeatures(spec.frame_programs) },
    );
    // Run frames 0-1 are the lead-in, 2-6 unit a+b, 7-8 unit c. Undelayed,
    // frame k starts at 5k ms; here it starts at 5(k + 1) ms and the first
    // instant holds frame 0. c's first frame (LEVEL 3) is shown inside b.
    expect(
      lowered.frames
        .filter((frame) => frame.params.FRAME !== undefined)
        .map((frame) => [Math.round(frame.time * 1000), frame.params.FRAME, frame.params.LEVEL]),
    ).toEqual([
      [0, 0, 0],
      [5, 0, 0],
      [10, 1, 0],
      [15, 2, 4],
      [20, 3, 6],
      [25, 4, 7],
      [30, 5, 7],
      [35, 6, 7],
      [40, 7, 3],
    ]);
  });
});
