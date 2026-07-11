import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lowerToFrames, Utterance } from "../src/declarative-frontend/hrg";
import type { FeatureSchema, HrgSchema, Item, LowerOptions } from "../src/declarative-frontend/hrg";
import { loadInventorySpecFromPath } from "../src/declarative-frontend/inventory";
import { loadBundledRulepackSpec } from "../src/declarative-frontend/rule-pack";
import { isPlainObject } from "../src/yaml-loader";

const META = {
  ruleId: "fixture",
  phase: "prosody",
  tag: "intonation",
  reason: "captured layered-intonation fixture",
  citations: ["Klatt 1982"],
};

type BaselineCommand = {
  durationFrames?: number;
  id: string;
  layer: string;
  profilePoints?: number[];
  tag?: string;
  timeMs: number;
  value: number;
};

type BaselineSegment = {
  duration: number;
  id: string;
  params: Record<string, number>;
  phoneme: string;
  type: string;
};

type ProductionFrame = {
  f0: number;
  phoneme?: string;
  time: number;
};

function latestFeature(item: Readonly<Record<string, unknown>>, key: string): unknown {
  if (!isPlainObject(item.features)) throw new Error("baseline Item features missing");
  const history = item.features[key];
  if (!Array.isArray(history) || history.length === 0) throw new Error(`baseline ${key} missing`);
  const write = history[history.length - 1];
  if (!isPlainObject(write)) throw new Error(`baseline ${key} history invalid`);
  return write.value;
}

function schemaFor(columns: readonly string[]): HrgSchema {
  const segmentFeatures: Record<string, FeatureSchema> = {
    active: { kind: "boolean" },
    duration: { kind: "number" },
    phoneme: { kind: "string" },
    type: { kind: "string" },
  };
  for (const column of columns) segmentFeatures[column] = { kind: "number" };
  const commandFeatures = {
    duration_frames: { kind: "number" },
    layer: { kind: "string" },
    profile_points: { kind: "array", items: { kind: "number" } },
    tag: { kind: "string" },
    value: { kind: "number" },
  } as const;
  return {
    itemTypes: {
      phraseCommand: { features: commandFeatures },
      segment: { features: segmentFeatures },
      tilt: { features: commandFeatures },
    },
    relations: {
      PhraseCommand: { kind: "list", itemTypes: ["phraseCommand"] },
      Segment: { kind: "list", itemTypes: ["segment"] },
      Tilt: { kind: "list", itemTypes: ["tilt"] },
    },
  };
}

function readFixture(): {
  commands: BaselineCommand[];
  f0Model: Readonly<Record<string, unknown>>;
  policy: LowerOptions;
  productionFrames: ProductionFrame[];
  segments: BaselineSegment[];
  speakerParams: Readonly<Record<string, unknown>>;
} {
  const parsed: unknown = JSON.parse(readFileSync(
    new URL("./fixtures/hrg-convergence-baseline/dectalk-english-stops.json", import.meta.url),
    "utf8",
  ));
  const spec = loadBundledRulepackSpec("dectalk-english");
  if (
    !isPlainObject(parsed)
    || !isPlainObject(parsed.reconstructedGraph)
    || !Array.isArray(parsed.reconstructedGraph.items)
    || !isPlainObject(parsed.oldProduction)
    || !isPlainObject(parsed.oldProduction.controlScore)
    || !Array.isArray(parsed.oldProduction.controlScore.f0_layer_commands)
    || !Array.isArray(parsed.oldProduction.sourceFrames)
    || !isPlainObject(parsed.oldProduction.speakerParams)
    || typeof spec.inventory_path !== "string"
    || !isPlainObject(spec.f0_model)
  ) {
    throw new Error("layered-intonation fixture/spec invalid");
  }
  const policy: LowerOptions = spec.output.lowering;
  const inventory = loadInventorySpecFromPath(spec.inventory_path).phoneme_targets;
  const segments = parsed.reconstructedGraph.items.flatMap((item): BaselineSegment[] => {
    if (!isPlainObject(item) || item.type !== "segment" || typeof item.id !== "string") return [];
    const phoneme = latestFeature(item, "phoneme");
    const duration = latestFeature(item, "dur_ms");
    if (typeof phoneme !== "string" || typeof duration !== "number") throw new Error("baseline Segment invalid");
    const target = inventory[phoneme] ?? inventory[`${phoneme}0`] ?? inventory[`${phoneme}1`];
    if (!target || typeof target.type !== "string") throw new Error(`inventory type missing for ${phoneme}`);
    const params: Record<string, number> = {};
    for (const column of policy.columns) {
      const value = latestFeature(item, column);
      if (typeof value !== "number") throw new Error(`baseline '${column}' invalid`);
      params[column] = value;
    }
    return [{ duration, id: item.id, params, phoneme, type: target.type }];
  });
  const commands = parsed.oldProduction.controlScore.f0_layer_commands.map((command): BaselineCommand => {
    if (
      !isPlainObject(command)
      || typeof command.id !== "string"
      || !isPlainObject(command.timing)
      || command.timing.kind !== "absolute"
      || typeof command.timing.time_ms !== "number"
      || typeof command.layer !== "string"
      || typeof command.value !== "number"
    ) {
      throw new Error("baseline layered command invalid");
    }
    const profilePoints = Array.isArray(command.profile_points)
      ? command.profile_points.filter((value): value is number => typeof value === "number")
      : undefined;
    return {
      id: command.id,
      layer: command.layer,
      timeMs: command.timing.time_ms,
      value: command.value,
      ...(typeof command.duration_frames === "number" ? { durationFrames: command.duration_frames } : {}),
      ...(profilePoints ? { profilePoints } : {}),
      ...(typeof command.tag === "string" ? { tag: command.tag } : {}),
    };
  });
  const productionFrames = parsed.oldProduction.sourceFrames.map((frame): ProductionFrame => {
    if (!isPlainObject(frame) || typeof frame.time !== "number" || !isPlainObject(frame.params) || typeof frame.params.F0 !== "number") {
      throw new Error("production F0 frame invalid");
    }
    return typeof frame.phoneme === "string"
      ? { f0: frame.params.F0, phoneme: frame.phoneme, time: frame.time }
      : { f0: frame.params.F0, time: frame.time };
  });
  return {
    commands,
    f0Model: spec.f0_model,
    policy,
    productionFrames,
    segments,
    speakerParams: parsed.oldProduction.speakerParams,
  };
}

function effectiveDuration(segment: BaselineSegment, policy: LowerOptions): number {
  const release = segment.type === "stop_release" || segment.type === "stop_aspiration";
  const floor = release
    ? policy.timeline.duration_floors.stop_release_ms.value
    : policy.timeline.duration_floors.default_ms.value;
  return Math.max(segment.duration, floor);
}

function buildUtterance(
  segments: readonly BaselineSegment[],
  commands: readonly BaselineCommand[],
  policy: LowerOptions,
): Utterance {
  const utterance = new Utterance(schemaFor(policy.columns));
  const build = utterance.beginTransaction(META);
  const segmentItems = segments.map((entry) => {
    const item = build.createItem("segment", entry.id);
    build.set(item, "phoneme", entry.phoneme);
    build.set(item, "type", entry.type);
    build.set(item, "duration", entry.duration);
    build.set(item, "active", true);
    for (const column of policy.columns) build.set(item, column, entry.params[column]);
    build.append("Segment", item);
    return item;
  });
  build.partitionAnchors(segmentItems, utterance.axis.start.id, utterance.axis.end.id);
  build.commit();

  const timing = utterance.beginTransaction({ ...META, ruleId: "timing", tag: "timing" });
  const spans: Array<{ endMs: number; item: Item; startMs: number }> = [];
  let cursorMs = 0;
  segmentItems.forEach((item, index) => {
    const anchor = utterance.intervalAnchor(item);
    const segment = segments[index];
    if (!anchor || !segment) throw new Error("fixture timing missing");
    const startMs = cursorMs;
    timing.resolveMarkTime(anchor.leftMarkId, startMs);
    cursorMs += effectiveDuration(segment, policy);
    timing.resolveMarkTime(anchor.rightMarkId, cursorMs);
    spans.push({ endMs: cursorMs, item, startMs });
  });
  timing.commit();

  const prosody = utterance.beginTransaction(META);
  for (const command of commands) {
    const span = spans.find((candidate) => command.timeMs >= candidate.startMs - 1e-6 && command.timeMs <= candidate.endMs + 1e-6);
    if (!span) throw new Error(`command ${command.id} lies outside the temporal axis`);
    const anchor = utterance.intervalAnchor(span.item);
    if (!anchor) throw new Error("fixture command span missing");
    const phraseCommand = command.layer === "baseline";
    const item = prosody.createItem(phraseCommand ? "phraseCommand" : "tilt", command.id);
    prosody.set(item, "layer", command.layer);
    prosody.set(item, "value", command.value);
    if (command.durationFrames != null) prosody.set(item, "duration_frames", command.durationFrames);
    if (command.profilePoints) prosody.set(item, "profile_points", command.profilePoints);
    if (command.tag) prosody.set(item, "tag", command.tag);
    prosody.append(phraseCommand ? "PhraseCommand" : "Tilt", item);
    const ratio = span.endMs === span.startMs ? 0 : (command.timeMs - span.startMs) / (span.endMs - span.startMs);
    prosody.anchorPoint(item, anchor.leftMarkId, anchor.rightMarkId, ratio);
  }
  prosody.commit();
  return utterance;
}

describe("HRG lowering layered intonation", () => {
  it("matches every emitted DECtalk PhraseCommand/Tilt F0 cell against production", () => {
    const baseline = readFixture();
    const utterance = buildUtterance(baseline.segments, baseline.commands, baseline.policy);
    const lowered = lowerToFrames(utterance, baseline.policy, {
      f0Model: baseline.f0Model,
      speakerParams: baseline.speakerParams,
    });
    const segmentFrames = lowered.frames.filter((frame) => frame.segmentId != null);
    const comparable = segmentFrames.flatMap((frame) => {
      const production = baseline.productionFrames.find(
        (candidate) => candidate.phoneme === frame.phoneme && Math.abs(candidate.time - frame.time) <= 1e-9,
      );
      return production ? [{ frame, production }] : [];
    });
    const cadenceFrames = baseline.productionFrames.filter((frame) => (
      frame.f0 > 0 && Math.abs(frame.time / 0.0064 - Math.round(frame.time / 0.0064)) <= 1e-9
    ));

    expect(comparable.length).toBeGreaterThan(250);
    expect(cadenceFrames.length).toBeGreaterThan(190);
    for (const production of cadenceFrames) {
      const frame = segmentFrames.find((candidate) => (
        candidate.phoneme === production.phoneme && Math.abs(candidate.time - production.time) <= 1e-9
      ));
      expect(frame, `missing cadence event ${production.phoneme ?? ""}@${production.time}`).toBeDefined();
      expect(frame?.params.F0).toBeCloseTo(production.f0, 9);
    }
    for (const { frame, production } of comparable) {
      expect(frame.params.F0, `${frame.segmentId}@${frame.time}.F0`).toBeCloseTo(production.f0, 9);
    }
    const knownDecisions = new Set(utterance.provenance.getDecisions().map((decision) => decision.id));
    for (const frame of segmentFrames) {
      for (const key of Object.keys(frame.params)) {
        const decisionId = frame.provenance?.[key];
        expect(decisionId, `${frame.segmentId}@${frame.time}.${key} provenance`).toBeTypeOf("string");
        expect(knownDecisions.has(decisionId ?? ""), `${frame.segmentId}@${frame.time}.${key} decision`).toBe(true);
      }
    }
  });

  it("rejects layered controls when the selected model is absent", () => {
    const baseline = readFixture();
    const utterance = buildUtterance(baseline.segments, baseline.commands, baseline.policy);

    expect(() => lowerToFrames(utterance, baseline.policy)).toThrowError(/E_HRG_LOWER_F0_MODEL/);
  });
});
