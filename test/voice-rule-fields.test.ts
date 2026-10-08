/**
 * Voice rule fields: the fields of a voice file a frontend declares under
 * `speakers.rule_fields`, which rules read as `params.policy.voice.<field>`
 * (src/dectalk-voice.ts, rule-pack.ts, tts-frontend.ts). The frontend here is
 * a tank whose fill level comes from the voice; nothing in it belongs to any
 * synthesizer.
 */

import { describe, expect, it, vi } from "vitest";
import type { HrgSchema } from "../src/declarative-frontend/hrg";
import { Utterance } from "../src/declarative-frontend/hrg";
import { FRAME_VALUES_SCHEMA } from "../src/declarative-frontend/hrg/frame-program";
import { runGraphRuleEngine } from "../src/declarative-frontend/hrg/rule-engine";
import * as rulepack from "../src/declarative-frontend/rule-pack";
import { getVoiceRegistry, resolveVoice, withVoiceRulePolicy } from "../src/dectalk-voice";
import { createProvenanceCollector } from "../src/provenance";
import { textToKlattTrackDetailed } from "../src/tts-frontend";

const CITATION = "fixture: voice rule fields test";
const SPEAKERS = {
  dir: "test/fixtures/voice-rule-fields",
  default: "low",
  voices: ["low", "high"],
  rule_fields: {
    register: { values: ["chest", "head"], citations: [CITATION] },
    lift: { kind: "number", citations: [CITATION] },
  },
};

/** A tank that fills to the voice's `lift`, twice that for a head voice. */
const TANK_SPEC = {
  speakers: SPEAKERS,
  parameters: { policy: { tank: { frame_ms: { value: 5, citations: [CITATION] } } } },
  tags: { tank: "level of the fixture tank" },
  relations: {
    Segment: {
      type: "base",
      scalars: { duration: {} },
      features: { active: [true, false], tank_frames: [] },
    },
  },
  frame_programs: {
    tank: {
      relation: "Segment",
      frame_ms: "params.policy.tank.frame_ms",
      registers: { level: 0 },
      outputs: { LEVEL: "r.level" },
      write: "tank_frames",
      tag: "tank",
      citations: [CITATION],
    },
  },
  rules: {
    tank_fill: {
      kind: "frame",
      program: "tank",
      set: [
        {
          register: "level",
          value:
            "params.policy.voice.register == 'head' ? params.policy.voice.lift * 2 : params.policy.voice.lift",
          tag: "tank",
        },
      ],
      citations: [CITATION],
    },
  },
  phases: [
    { name: "tank", rules: ["tank_fill"] },
    { name: "finalize", after: ["tank"], rules: [], compute_times: true },
  ],
};

const SCHEMA = {
  itemTypes: {
    segment: {
      features: {
        phoneme: { kind: "string" },
        type: { kind: "string" },
        duration: { kind: "number" },
        active: { kind: "boolean" },
        tank_frames: FRAME_VALUES_SCHEMA,
      },
    },
  },
  relations: { Segment: { kind: "list", itemTypes: ["segment"] } },
} as const satisfies HrgSchema;

function oneSegment(): Utterance {
  const utterance = new Utterance(SCHEMA);
  const transaction = utterance.beginTransaction({
    ruleId: "fixture",
    phase: "input",
    tag: "fixture",
    reason: "fixture",
    citations: [CITATION],
  });
  const item = transaction.createItem("segment", "a");
  transaction.set(item, "phoneme", "a");
  transaction.set(item, "type", "vowel");
  transaction.set(item, "duration", 10);
  transaction.set(item, "active", true);
  transaction.append("Segment", item);
  transaction.partitionAnchors([item], utterance.axis.start.id, utterance.axis.end.id);
  transaction.commit();
  return utterance;
}

function levels(voice: string | null): unknown {
  const spec = rulepack.compileRuleEngineSpec(TANK_SPEC);
  const registry = getVoiceRegistry(spec);
  if (!registry) throw new Error("fixture registry missing");
  const utterance = oneSegment();
  runGraphRuleEngine(
    utterance,
    spec,
    voice === null
      ? {}
      : { parameters: { policy: { voice: resolveVoice(registry, voice).ruleFields } } },
  );
  const frames = utterance.getItem("a")?.get("tank_frames") as
    | { columns: { LEVEL: number[] } }
    | undefined;
  return frames?.columns.LEVEL;
}

describe("voice rule fields at load", () => {
  it("puts the default voice's fields at parameters.policy.voice", () => {
    const withPolicy = withVoiceRulePolicy(TANK_SPEC) as typeof TANK_SPEC & {
      parameters: { policy: { voice: unknown } };
    };
    expect(withPolicy.parameters.policy.voice).toEqual({ register: "chest", lift: 3 });
    // The source itself is not changed.
    expect("voice" in TANK_SPEC.parameters.policy).toBe(false);
  });

  it("returns a rulepack without rule fields as it is", () => {
    const { rule_fields: _ruleFields, ...speakers } = SPEAKERS;
    const plain = { ...TANK_SPEC, speakers };
    expect(withVoiceRulePolicy(plain)).toBe(plain);
    const none = { parameters: { policy: { voice: { anything: 1 } } } };
    expect(withVoiceRulePolicy(none)).toBe(none);
  });

  it("accepts a rule that reads a declared field and rejects one that reads another", () => {
    expect(() => rulepack.compileRuleEngineSpec(TANK_SPEC)).not.toThrow();
    const misspelt = {
      ...TANK_SPEC,
      rules: {
        tank_fill: {
          ...TANK_SPEC.rules.tank_fill,
          set: [{ register: "level", value: "params.policy.voice.lifts", tag: "tank" }],
        },
      },
    };
    expect(() => rulepack.compileRuleEngineSpec(misspelt)).toThrow(/params\.policy\.voice\.lifts/);
  });

  it("rejects a registered voice that lacks a field", () => {
    const spec = { ...TANK_SPEC, speakers: { ...SPEAKERS, voices: ["low", "no-lift"] } };
    expect(() => rulepack.compileRuleEngineSpec(spec)).toThrow(
      /E_VOICE_RULE_FIELD: voice file 'test\/fixtures\/voice-rule-fields\/no-lift\.yaml' lacks rule field 'lift'/,
    );
  });

  // DECtalk's voice setup leaves some values unassigned for some voices; such
  // a field is declared optional and the rule supplies its own default.
  it("lets a voice omit a field declared optional, and the rule read it with a default", () => {
    const speakers = {
      ...SPEAKERS,
      voices: ["low", "high", "no-lift"],
      rule_fields: {
        ...SPEAKERS.rule_fields,
        lift: { kind: "number", citations: [CITATION], optional: true },
      },
    };
    const spec = {
      ...TANK_SPEC,
      speakers,
      rules: {
        tank_fill: {
          ...TANK_SPEC.rules.tank_fill,
          set: [{ register: "level", value: "get(params.policy.voice, 'lift', 9)", tag: "tank" }],
        },
      },
    };
    const compiled = rulepack.compileRuleEngineSpec(spec);
    const registry = getVoiceRegistry(compiled);
    if (!registry) throw new Error("fixture registry missing");
    // An explicit null, not a missing key: the default voice's lift (3) is in
    // the rulepack's parameters and would show through a missing key.
    expect(resolveVoice(registry, "no-lift").ruleFields).toEqual({ register: "chest", lift: null });
    expect(resolveVoice(registry, "high").ruleFields).toEqual({ register: "head", lift: 7 });
    const level = (voice: string): unknown => {
      const utterance = oneSegment();
      runGraphRuleEngine(utterance, compiled, {
        parameters: { policy: { voice: resolveVoice(registry, voice).ruleFields } },
      });
      const frames = utterance.getItem("a")?.get("tank_frames") as
        | { columns: { LEVEL: number[] } }
        | undefined;
      return frames?.columns.LEVEL;
    };
    expect(level("high")).toEqual([7, 7]);
    expect(level("low")).toEqual([3, 3]);
    expect(level("no-lift")).toEqual([9, 9]);
    expect(() =>
      withVoiceRulePolicy({
        ...spec,
        speakers: {
          ...speakers,
          rule_fields: { lift: { kind: "number", citations: [CITATION], optional: "yes" } },
        },
      }),
    ).toThrow(/E_VOICE_RULE_FIELDS: speakers\.rule_fields\.lift\.optional must be true or false/);
  });

  it("rejects a field of the wrong kind, a string outside the list or a non-number", () => {
    const spec = { ...TANK_SPEC, speakers: { ...SPEAKERS, voices: ["low", "falsetto"] } };
    expect(() => rulepack.compileRuleEngineSpec(spec)).toThrow(
      /E_VOICE_RULE_FIELD: .*falsetto\.yaml' field 'register' is "whistle", not one of chest, head/,
    );
    const numberOnly = {
      ...spec,
      speakers: { ...spec.speakers, rule_fields: { lift: SPEAKERS.rule_fields.lift } },
    };
    expect(() => rulepack.compileRuleEngineSpec(numberOnly)).toThrow(
      /E_VOICE_RULE_FIELD: .*falsetto\.yaml' field 'lift' is "seven", not a number/,
    );
  });

  it("rejects parameters.policy.voice written in the rulepack", () => {
    const spec = {
      ...TANK_SPEC,
      parameters: { policy: { ...TANK_SPEC.parameters.policy, voice: { lift: 5 } } },
    };
    expect(() => rulepack.compileRuleEngineSpec(spec)).toThrow(/E_VOICE_POLICY_RESERVED/);
  });

  it("requires a citation and a kind on every declared field", () => {
    const declare = (field: unknown) => ({
      ...TANK_SPEC,
      speakers: { ...SPEAKERS, rule_fields: { lift: field } },
    });
    expect(() => withVoiceRulePolicy(declare({ kind: "number" }))).toThrow(
      /E_VOICE_RULE_FIELDS: speakers\.rule_fields\.lift requires citations/,
    );
    expect(() => withVoiceRulePolicy(declare({ kind: "text", citations: [CITATION] }))).toThrow(
      /E_VOICE_RULE_FIELDS: speakers\.rule_fields\.lift must be/,
    );
  });
});

describe("voice rule fields in rules", () => {
  it("gives a rule the default voice's fields, and the selected voice's when one is passed", () => {
    expect(levels(null)).toEqual([3, 3]);
    expect(levels("low")).toEqual([3, 3]);
    expect(levels("high")).toEqual([14, 14]);
  });
});

describe("voice rule fields in the frontend", () => {
  const fixtureFrontend = () =>
    vi.spyOn(rulepack, "loadBundledRulepackSpec").mockReturnValue({
      ...rulepack.QLATT_ENGLISH_RULEPACK,
      speakers: SPEAKERS,
    });

  it("records the selected voice's fields with the voice's and the fields' citations", () => {
    const spy = fixtureFrontend();
    try {
      const provenance = createProvenanceCollector();
      textToKlattTrackDetailed("hello", undefined, 30, { provenance, speaker: "high" });
      const decision = provenance
        .getDecisions()
        .find((entry) => entry.type === "voice_parameters_selected");
      expect(decision?.subject).toBe("voice:high");
      expect(decision?.reason).toContain("register=head");
      expect(decision?.reason).toContain("lift=7");
      expect(decision?.citations).toEqual(expect.arrayContaining(["fixture high voice", CITATION]));
      const profile = provenance
        .getDecisions()
        .find((entry) => entry.type === "speaker_profile_selected");
      expect(decision?.parents).toEqual([profile?.id]);
    } finally {
      spy.mockRestore();
    }
  });

  it("refuses a speaker override that names a rule field", () => {
    const spy = fixtureFrontend();
    try {
      expect(() =>
        textToKlattTrackDetailed("hello", undefined, 30, { speaker: { lift: 9 } as never }),
      ).toThrow(/E_VOICE_RULE_FIELD_OVERRIDE: .*lift/);
    } finally {
      spy.mockRestore();
    }
  });

  it("leaves a frontend without rule fields as it was: no voice record, no decision", () => {
    const spec = rulepack.loadBundledRulepackSpec("qlatt-english");
    const policy = (spec.parameters as { policy?: Record<string, unknown> }).policy ?? {};
    expect("voice" in policy).toBe(false);
    const provenance = createProvenanceCollector();
    textToKlattTrackDetailed("hello", undefined, 30, { provenance });
    expect(
      provenance.getDecisions().some((entry) => entry.type === "voice_parameters_selected"),
    ).toBe(false);
  });
});
