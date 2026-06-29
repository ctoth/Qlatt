import { describe, expect, it } from "vitest";

import { compileAffect, neutralAffect } from "../src/input/affect";
import { applyAffectToTrack, isNeutralDelta } from "../src/input/apply-affect";
import type { KlattFrame } from "../src/tts-frontend-types";

/**
 * A small synthetic two-vowel track that carries the parameters the affect
 * transform touches (F0, F1-F3, B1-B3, Rd/RdPhraseOffset, TL, AH, GO). The
 * numbers mirror a real qlatt-beauty voiced frame.
 */
function sampleTrack(): KlattFrame[] {
  const params = (): Record<string, number> => ({
    F0: 150,
    F1: 700,
    F2: 1200,
    F3: 2600,
    B1: 130,
    B2: 110,
    B3: 190,
    AV: 60,
    AH: 35,
    GO: 47,
    TL: 10,
    Rd: 0.7,
    RdPhraseOffset: 0,
  });
  return [
    { time: 0.1, phoneme: "AH", word: "a", params: params() },
    { time: 0.4, phoneme: "IY", word: "a", params: params() },
    { time: 0.7, phoneme: "SIL", word: "a", params: { ...params(), AV: 0, F0: 150 } },
  ];
}

function f0Mean(track: KlattFrame[]): number {
  const vals = track.map((f) => f.params.F0).filter((v) => v > 0);
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

describe("applyAffectToTrack", () => {
  it("neutral affect leaves the track numerically unchanged (the (c) base case)", () => {
    const track = sampleTrack();
    const neutral = neutralAffect();
    expect(isNeutralDelta(neutral.vq)).toBe(true);

    const { track: out } = applyAffectToTrack(track, neutral);
    expect(out).toEqual(track);
    // A fresh object, not the same reference (no mutation of the input).
    expect(out).not.toBe(track);
    expect(out[0]).not.toBe(track[0]);
  });

  it("does not mutate the input track", () => {
    const track = sampleTrack();
    const before = JSON.parse(JSON.stringify(track));
    applyAffectToTrack(track, compileAffect("angry", 1));
    expect(track).toEqual(before);
  });

  it("tender: breathier (raises Rd channel), slower, quieter", () => {
    const track = sampleTrack();
    const tender = compileAffect("tender", 1);
    // Sanity on the compiled vector itself.
    expect(tender.vq.rdDelta).toBeGreaterThan(0); // +1.0 breathy
    expect(tender.vq.durationScale).toBeGreaterThan(1); // 1.1 slower
    expect(tender.vq.intensityBoost).toBeLessThan(0); // -4 quieter
    expect(tender.vq.ahBoost).toBeGreaterThan(0); // +6 aspiration

    const { track: out } = applyAffectToTrack(track, tender);
    const v = out[0].params;
    const base = track[0].params;
    // Rd channel rose by exactly rdDelta (effective Rd within [0.3,2.7]).
    expect(v.RdPhraseOffset).toBeCloseTo(base.RdPhraseOffset + tender.vq.rdDelta, 6);
    // Aspiration and tilt rose; gain dropped.
    expect(v.AH).toBeCloseTo(base.AH + tender.vq.ahBoost, 6);
    expect(v.TL).toBeCloseTo(base.TL + tender.vq.spectralTiltBoost, 6);
    expect(v.GO).toBeCloseTo(base.GO + tender.vq.intensityBoost, 6);
    expect(v.GO).toBeLessThan(base.GO);
    // Timeline dilated (slower) — last event later than neutral.
    expect(out[out.length - 1].time).toBeGreaterThan(track[track.length - 1].time);
    expect(out[0].time).toBeCloseTo(track[0].time * tender.vq.durationScale, 6);
  });

  it("angry: pressed (lowers Rd channel), faster, louder, higher F0", () => {
    const track = sampleTrack();
    const angry = compileAffect("angry", 1);
    expect(angry.vq.rdDelta).toBeLessThan(0); // -0.5 pressed
    expect(angry.vq.durationScale).toBeLessThan(1); // 0.85 faster
    expect(angry.vq.intensityBoost).toBeGreaterThan(0); // +6 louder
    expect(angry.vq.f0Scale).toBeGreaterThan(1); // 1.3 higher

    const { track: out } = applyAffectToTrack(track, angry);
    const v = out[0].params;
    const base = track[0].params;
    // Pressed: Rd channel dropped. Base Rd 0.7 + rdDelta -0.5 = 0.2 which clamps
    // up to the 0.3 effective-Rd floor, so the offset is 0.3 - 0.7 = -0.4.
    expect(v.RdPhraseOffset).toBeLessThan(base.RdPhraseOffset);
    const effectiveRd = base.Rd + v.RdPhraseOffset;
    expect(effectiveRd).toBeCloseTo(0.3, 6);
    // Louder, higher F0.
    expect(v.GO).toBeCloseTo(base.GO + angry.vq.intensityBoost, 6);
    expect(f0Mean(out)).toBeCloseTo(f0Mean(track) * angry.vq.f0Scale, 4);
    expect(f0Mean(out)).toBeGreaterThan(f0Mean(track));
    // Faster — timeline compressed.
    expect(out[out.length - 1].time).toBeLessThan(track[track.length - 1].time);
  });

  it("tender is breathier than angry on the Rd channel (opposite directions)", () => {
    const track = sampleTrack();
    const tender = applyAffectToTrack(track, compileAffect("tender", 1)).track;
    const angry = applyAffectToTrack(track, compileAffect("angry", 1)).track;
    expect(tender[0].params.RdPhraseOffset).toBeGreaterThan(angry[0].params.RdPhraseOffset);
  });

  it("formants and bandwidths move by the compiled deltas (sad raises F1/F3, widens B1)", () => {
    const track = sampleTrack();
    const sad = compileAffect("sad", 1);
    const { track: out } = applyAffectToTrack(track, sad);
    const v = out[0].params;
    const base = track[0].params;
    expect(v.F1).toBeCloseTo(base.F1 + sad.vq.f1Delta, 6);
    expect(v.F3).toBeCloseTo(base.F3 + sad.vq.f3Delta, 6);
    expect(v.B1).toBeCloseTo(base.B1 * sad.vq.fbw1Scale, 6);
    // sad slows the track.
    expect(out[out.length - 1].time).toBeGreaterThan(track[track.length - 1].time);
  });

  it("clamps effective Rd into [0.3, 2.7] for an extreme breathy push", () => {
    const track = sampleTrack();
    // soft has rdDelta +1.2; with Rd base 0.7 effective would be 1.9 (in range).
    // Force the clamp by stacking an existing positive offset.
    track[0].params.RdPhraseOffset = 1.5; // Rd=0.7 -> already 2.2 before delta
    const soft = compileAffect("soft", 1); // +1.2 -> 3.4 desired, clamps to 2.7
    const { track: out } = applyAffectToTrack(track, soft);
    const effective = track[0].params.Rd + out[0].params.RdPhraseOffset;
    expect(effective).toBeLessThanOrEqual(2.7 + 1e-9);
    expect(effective).toBeCloseTo(2.7, 6);
  });

  it("degree 0 is the identity for any preset", () => {
    const track = sampleTrack();
    const { track: out } = applyAffectToTrack(track, compileAffect("angry", 0));
    expect(out).toEqual(track);
  });

  it("accepts a bare VoiceQualityDelta and folds in the affect record citations", () => {
    const track = sampleTrack();
    const angry = compileAffect("angry", 1);
    const fromVector = applyAffectToTrack(track, angry.vq);
    const fromRecord = applyAffectToTrack(track, angry);
    expect(fromVector.track).toEqual(fromRecord.track);
    // The compiled record carries its own citations; the bare vector does not.
    expect(fromRecord.citations).toEqual(expect.arrayContaining(angry.citations));
    expect(fromRecord.citations).toContain("Rutledge_1995");
  });
});
