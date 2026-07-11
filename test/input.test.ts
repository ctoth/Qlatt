import { describe, expect, it } from "vitest";

import {
  AFFECT_PRESETS,
  compileAffect,
  neutralAffect,
  resolveAffectPreset,
  isClinicalSexRequired,
} from "../src/input/affect";
import {
  NEUTRAL_DIMENSIONS,
  NEUTRAL_VQ,
  parseDirectionTrack,
  serializeDirectionTrack,
} from "../src/input/direction-track";
import type { DirectionTrack, DirectionInput } from "../src/input/direction-track";
import {
  parseDirectionInput,
  tokenizeScore,
  resolveAnchor,
  effectiveSpanFieldAt,
  spansAt,
} from "../src/input/parse";
import { parseInline } from "../src/input/inline";

describe("input contract — Direction Track schema", () => {
  it("round-trips a fully-populated Direction Track through JSON", () => {
    const track: DirectionTrack = {
      version: "1",
      global: {
        voice: { name: "narrator", sex: "male", baseF0Hz: 110 },
        affect: { preset: "tender", degree: 0.6 },
      },
      spans: [
        {
          id: "s1",
          anchor: { unit: "word", start: 2, end: 3 },
          precedence: 1,
          emphasis: { level: "strong" },
        },
        {
          id: "s2",
          anchor: { unit: "phrase", start: 0 },
          break: { strength: 3, timeMs: 250 },
          pitch: { semitones: -2, rangeScale: 0.8 },
          rate: 1.2,
          affect: { preset: "angry", degree: 0.4 },
          voiceQuality: { rdDelta: -0.3 },
          gesture: { name: "sigh", degree: 0.5 },
        },
      ],
    };

    const restored = parseDirectionTrack(JSON.parse(serializeDirectionTrack(track)));
    expect(restored).toEqual(track);
  });

  it("rejects a malformed Direction Track (bad version)", () => {
    expect(() => parseDirectionTrack({ version: "9" })).toThrow(/version/);
    expect(() => parseDirectionTrack({ version: "1", spans: "nope" })).toThrow(/spans/);
  });
});

describe("input contract — neutral base case", () => {
  it("neutralAffect() is the identity dimensional + VQ vector", () => {
    const n = neutralAffect();
    expect(n.dimensions).toEqual(NEUTRAL_DIMENSIONS);
    expect(n.vq).toEqual(NEUTRAL_VQ);
  });

  it("an empty Direction Track lowers to zero directions (pure plain-text (c) case)", () => {
    const input: DirectionInput = {
      score: { text: "hello there world" },
      directionTrack: { version: "1" },
    };
    const result = parseDirectionInput(input);
    expect(result.directions).toHaveLength(0);
    expect(result.decisions).toHaveLength(0);
    expect(result.score.tokens).toEqual(["hello", "there", "world"]);
  });

  it("degree 0 of any preset collapses to the neutral vector", () => {
    const zero = compileAffect("angry", 0);
    expect(zero.dimensions).toEqual(NEUTRAL_DIMENSIONS);
    expect(zero.vq).toEqual(NEUTRAL_VQ);
  });
});

describe("input contract — affect compiler (cited presets)", () => {
  it("compiles 'angry' to the cited V/A/D + Rd/F0 deltas (Rutledge/France/Murray)", () => {
    const c = compileAffect("angry", 1);
    // Dimensional: negative valence, high arousal, dominant (doc 03 §1a).
    expect(c.dimensions.valence).toBeLessThan(0);
    expect(c.dimensions.arousal).toBeGreaterThan(0.5);
    expect(c.dimensions.dominance).toBeGreaterThan(0);
    // VQ deltas ported verbatim from §2.4: pressed voice, raised F0.
    expect(c.vq.rdDelta).toBe(-0.5);
    expect(c.vq.f0Scale).toBe(1.3);
    expect(c.vq.intensityBoost).toBe(6);
    expect(c.citations).toContain("Rutledge_1995");
    expect(c.citations).toContain("France_2000");
    expect(c.label).toBe("angry");
  });

  it("compiles 'tender' to a positive-valence breathy substrate (doc 03 §6 composite)", () => {
    const c = compileAffect("tender", 1);
    expect(c.dimensions.valence).toBeGreaterThan(0);
    expect(c.dimensions.arousal).toBeLessThan(0); // low-arousal intimate
    expect(c.vq.rdDelta).toBeGreaterThan(0); // breathy (Gobl)
    expect(c.vq.f0VarianceScale).toBeLessThan(1); // non-fluctuating (Murray affection)
    expect(c.citations).toContain("Gobl_2003");
  });

  it("scales linearly with degree (the continuous styledegree knob)", () => {
    const half = compileAffect("angry", 0.5);
    const full = compileAffect("angry", 1);
    // additive field rdDelta: half is half of full
    expect(half.vq.rdDelta).toBeCloseTo(full.vq.rdDelta / 2, 6);
    // multiplicative field f0Scale: interpolated from 1
    expect(half.vq.f0Scale).toBeCloseTo(1 + (full.vq.f0Scale - 1) / 2, 6);
    // dimensions scale linearly
    expect(half.dimensions.arousal).toBeCloseTo(full.dimensions.arousal / 2, 6);
  });

  it("every preset in the library carries at least one citation", () => {
    for (const [name, preset] of AFFECT_PRESETS) {
      expect(preset.citations.length, `preset '${name}' must be cited`).toBeGreaterThan(0);
    }
  });

  it("covers all five preset groups (emotion, epistemic, pragmatic, speech_act, clinical)", () => {
    const groups = new Set([...AFFECT_PRESETS.values()].map((p) => p.group));
    expect(groups).toEqual(
      new Set(["emotion", "epistemic", "pragmatic", "speech_act", "clinical"]),
    );
  });
});

describe("input contract — clinical sex-inversion (Kaczmarek-Majer 2024)", () => {
  it("manic_male and manic_female are acoustically INVERTED", () => {
    const male = compileAffect("manic", 1, { sex: "male" });
    const female = compileAffect("manic", 1, { sex: "female" });

    // Loudness inverts: male louder (+), female quieter (-).
    expect(male.vq.intensityBoost).toBeGreaterThan(0);
    expect(female.vq.intensityBoost).toBeLessThan(0);
    expect(Math.sign(male.vq.intensityBoost)).not.toBe(Math.sign(female.vq.intensityBoost));

    // F1 inverts: male higher, female lower.
    expect(male.vq.f1Delta).toBeGreaterThan(0);
    expect(female.vq.f1Delta).toBeLessThan(0);

    // Jitter (roughness) inverts: male rougher (>1), female smoother (<1).
    expect(male.vq.jitterScale).toBeGreaterThan(1);
    expect(female.vq.jitterScale).toBeLessThan(1);
    expect("shimmerScale" in male.vq).toBe(false);
    expect("shimmerScale" in female.vq).toBe(false);

    // Arousal dimension inverts too.
    expect(male.dimensions.arousal).toBeGreaterThan(0);
    expect(female.dimensions.arousal).toBeLessThan(0);

    expect(male.citations).toContain("Kaczmarek-Majer_2024");
  });

  it("a clinical preset REQUIRES a sex parameter (throws without one)", () => {
    expect(isClinicalSexRequired("manic")).toBe(true);
    expect(() => compileAffect("manic", 1)).toThrow(/sex/i);
    expect(() => resolveAffectPreset("depressive")).toThrow(/sex/i);
  });
});

describe("input contract — anchor resolution + span precedence", () => {
  const score = "Please be very careful out there now";
  //              0      1  2    3       4   5     6

  it("resolves a word-range anchor to the right inclusive token range", () => {
    const resolved = tokenizeScore(score);
    const range = resolveAnchor({ unit: "word", start: 2, end: 3 }, resolved);
    expect(range).toEqual({ startToken: 2, endToken: 3 });
    expect(resolved.tokens.slice(range.startToken, range.endToken + 1)).toEqual(["very", "careful"]);
  });

  it("resolves a phrase anchor to the phrase's token span", () => {
    const resolved = tokenizeScore("hello there, friend");
    // phrase 0 = tokens 0..1 ("hello there,"), phrase 1 = token 2 ("friend")
    expect(resolveAnchor({ unit: "phrase", start: 0 }, resolved)).toEqual({ startToken: 0, endToken: 1 });
    expect(resolveAnchor({ unit: "phrase", start: 1 }, resolved)).toEqual({ startToken: 2, endToken: 2 });
  });

  it("resolves overlapping spans by precedence (higher wins; ties → later-declared)", () => {
    const input: DirectionInput = {
      score: { text: score },
      directionTrack: {
        version: "1",
        spans: [
          { id: "low", anchor: { unit: "word", start: 0, end: 6 }, precedence: 0, rate: 1.0 },
          { id: "high", anchor: { unit: "word", start: 2, end: 4 }, precedence: 5, rate: 2.0 },
        ],
      },
    };

    // token 3 ("careful") is covered by both spans; precedence 5 wins.
    const winner = effectiveSpanFieldAt(input, 3, "rate");
    expect(winner).toBeDefined();
    expect(winner?.spanId).toBe("high");
    expect(winner?.value).toBe(2.0);

    // token 0 is covered only by the low-precedence span.
    expect(effectiveSpanFieldAt(input, 0, "rate")?.spanId).toBe("low");

    // ordering of spansAt at token 3 is highest precedence first
    expect(spansAt(input, 3).map((s) => s.id)).toEqual(["high", "low"]);
  });
});

describe("input contract — directions emit cited DecisionRecords (HRG-compatible)", () => {
  it("a global affect lowers to a DecisionRecord with citations + the Affect relation", () => {
    const input: DirectionInput = {
      score: { text: "I am fine" },
      directionTrack: {
        version: "1",
        global: { affect: { preset: "sad", degree: 0.8 } },
      },
    };
    const result = parseDirectionInput(input);

    const affectDir = result.directions.find((d) => d.kind === "global_affect");
    expect(affectDir).toBeDefined();
    expect(affectDir?.tag).toBe("affect");
    expect(affectDir?.hrgRelation).toBe("Affect");
    expect(affectDir?.scope).toBe("utterance");

    const decision = affectDir!.decision;
    expect(decision.stage).toBe("frontend");
    expect(decision.subject).toBe("utterance");
    expect(decision.citations.length).toBeGreaterThan(0);
    expect(decision.citations).toContain("France_2000");
    expect(decision.id).toBe(affectDir!.id);

    // the compiled substrate is carried on the record's direction
    expect(affectDir?.affect?.dimensions.valence).toBeLessThan(0);
    expect(affectDir?.affect?.degree).toBe(0.8);
  });

  it("a local affect span chains its decision to the global affect (parents[])", () => {
    const input: DirectionInput = {
      score: { text: "no not ever" },
      directionTrack: {
        version: "1",
        global: { affect: { preset: "sad" } },
        spans: [
          { id: "shout", anchor: { unit: "word", start: 1 }, affect: { preset: "angry", degree: 0.7 } },
        ],
      },
    };
    const result = parseDirectionInput(input);
    const globalDir = result.directions.find((d) => d.kind === "global_affect")!;
    const localDir = result.directions.find((d) => d.kind === "local_affect")!;

    expect(localDir.decision.parents).toBeDefined();
    expect(localDir.decision.parents).toContain(globalDir.decision.id);
    expect(localDir.scope).toEqual({ startToken: 1, endToken: 1 });
    expect(localDir.decision.subject).toBe("token:1");
  });

  it("a clinical global affect requires voice.sex and resolves sex-specifically", () => {
    const base: DirectionInput = {
      score: { text: "everything is wonderful" },
      directionTrack: {
        version: "1",
        global: { voice: { sex: "female" }, affect: { preset: "manic" } },
      },
    };
    const result = parseDirectionInput(base);
    const dir = result.directions.find((d) => d.kind === "global_affect")!;
    expect(dir.affect?.resolvedSex).toBe("female");
    expect(dir.affect?.vq.intensityBoost).toBeLessThan(0); // female mania = quieter

    // without a sex, the clinical preset throws during lowering
    const noSex: DirectionInput = {
      score: { text: "x" },
      directionTrack: { version: "1", global: { affect: { preset: "manic" } } },
    };
    expect(() => parseDirectionInput(noSex)).toThrow(/sex/i);
  });

  it("a gesture span lowers to a cited gesture direction with a scaled delta", () => {
    const input: DirectionInput = {
      score: { text: "well okay then" },
      directionTrack: {
        version: "1",
        spans: [{ id: "g", anchor: { unit: "word", start: 0 }, gesture: { name: "sigh", degree: 0.5 } }],
      },
    };
    const result = parseDirectionInput(input);
    const g = result.directions.find((d) => d.kind === "gesture")!;
    expect(g.tag).toBe("gesture");
    expect(g.citations).toContain("Gobl_2003");
    // sigh full rdDelta is +1.0; at degree 0.5 it is +0.5
    expect(g.delta?.rdDelta).toBeCloseTo(0.5, 6);
  });
});

describe("input contract — inline shorthand is demoted to a lifter", () => {
  it("lifts ((preset@degree)) + *emphasis* into a Direction Track, not the source of truth", () => {
    const input = parseInline("((angry@0.7)) I said *no* to you");
    expect(input.score.text).toBe("I said no to you");
    expect(input.directionTrack.global?.affect).toEqual({ preset: "angry", degree: 0.7 });

    const spans = input.directionTrack.spans ?? [];
    expect(spans).toHaveLength(1);
    expect(spans[0].emphasis?.level).toBe("strong");
    // "no" is word index 2 in "I said no to you"
    expect(spans[0].anchor.start).toBe(2);

    // and the lifted track parses + lowers end to end
    const result = parseDirectionInput(input);
    expect(result.directions.some((d) => d.kind === "global_affect")).toBe(true);
    expect(result.directions.some((d) => d.kind === "emphasis")).toBe(true);
  });
});
