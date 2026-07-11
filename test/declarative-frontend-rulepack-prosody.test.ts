import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";
import { endOrder, finiteOrder, startOrder } from "./utils/order-marks";

/**
 * Tests for the prosody rule phase (ToBI intonation model).
 *
 * These tests exercise the YAML prosody rules by passing constructed token
 * sequences directly to runDeclarativeFrontend. Tokens are annotated with
 * the properties that annotateProsody() would set (isAccented, accentType,
 * accentIndexInPhrase, boundaryTone, breakIndex, etc.).
 *
 * Citations:
 * - Pierrehumbert 1980 (downstep formula, boundary tones)
 * - Ladd 2008 (pitch range model, final lowering)
 * - O'Shaughnessy 1976 (microprosodic perturbation)
 */

/** Default pitch range parameters matching the default bundled frontend */
const TOBI_PARAMS = {
  policy: {
    f0: {
      base_hz: 110,
      range_hz: 80,
      h_star_height: 0.85,
      l_star_height: 0.15,
      downstep_k: 0.6,
      downstep_floor_fraction: 0.25,
      boundary_l_pct_fraction: 0.0,
      boundary_h_pct_fraction: 0.8,
      final_lowering_factor: 0.85,
      voiceless_onset_raise: 1.2,
      voiced_onset_lower: 0.95,
      continuation_rise_hz: 8,
      continuation_minor_rise_hz: 5,
    },
  },
};

describe("declarative frontend rulepack prosody phase", () => {
  // --- ToBI baseline initialization ---

  it("inserts baseline F0 at utterance start", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const baseline = points.find((p) => p.tag === "f0_baseline");
    expect(baseline).toBeTruthy();
    expect(baseline!.value).toBe(110);
  });

  // --- H* accent target with downstep ---

  it("inserts H* accent target at first accent (index 0)", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const hStar = points.find((p) => p.tag === "f0_h_star");
    expect(hStar).toBeTruthy();
    // Nuclear H* peak is no longer directly final-lowered; lowering is carried by
    // the trailing phrase accent / boundary movement instead of suppressing the peak itself.
    expect(hStar!.value).toBeCloseTo(178, 0);
  });

  // --- Downstep sequence ---

  it("keeps nuclear H* from being downstepped below the prenuclear peak", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: false,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 1,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p3",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const hStars = out
      .filter((t) => t.relation === "f0" && t.tag === "f0_h_star")
      .sort((a, b) => Number(a.time) - Number(b.time));

    expect(hStars.length).toBe(2);
    // First H*: 110 + 80 * 0.85 = 178 (prenuclear, no final lowering)
    expect(hStars[0].value).toBeCloseTo(178, 0);
    // Nuclear H* is exempt from direct downstep/final-lowering at the peak itself.
    expect(hStars[1].value).toBeCloseTo(178, 0);
    expect(Number(hStars[1].value)).toBeGreaterThanOrEqual(Number(hStars[0].value));
  });

  // --- L* accent target ---

  it("inserts L* accent target for question nuclear accent", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "IY",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "L*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: "?",
        params: { AV: 0, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "H%",
        phraseAccent: "H-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const lStar = points.find((p) => p.tag === "f0_l_star");
    expect(lStar).toBeTruthy();
    // L*: 110 + 80 * 0.15 = 122
    expect(lStar!.value).toBeCloseTo(122, 0);
  });

  // --- Boundary tones ---

  it("inserts L% boundary tone at declarative boundary", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const boundary = points.find((p) => p.tag === "f0_boundary_low");
    expect(boundary).toBeTruthy();
    // L%: 110 + 80 * 0.0 = 110
    expect(boundary!.value).toBe(110);
  });

  it("inserts H% boundary tone at question boundary", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "IY",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "L*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: "?",
        params: { AV: 0, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "H%",
        phraseAccent: "H-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const boundary = points.find((p) => p.tag === "f0_boundary_rise");
    expect(boundary).toBeTruthy();
    // H%: max(high_floor=174, prev_f0 + 0.2*(ceiling - prev_f0))
    // upstep path wins when prev_f0 is high enough (Pierrehumbert 1980 Rule 9)
    expect(boundary!.value).toBeCloseTo(177.2, 0);
  });

  // --- Register reset ---

  it("resets F0 at IP boundary (breakIndex >= 4)", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = finiteOrder(3);
    const s4 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
      {
        id: "p3",
        relation: "phone",
        phoneme: "IY",
        type: "vowel",
        stress: 1,
        duration: 100,
        params: { AV: 60, AVS: 0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p4",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s3,
        sync_right: s4,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const reset = points.find((p) => p.tag === "f0_register_reset");
    expect(reset).toBeTruthy();
    expect(reset!.value).toBe(110);
  });

  // --- Microprosodic perturbation (kept rules) ---

  it("raises F0 at vowel onset after voiceless stop release", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "T_REL",
        type: "stop_release",
        voiceless: true,
        alveolar: true,
        duration: 15,
        params: { AF: 58, AH: 55 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 0,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 170,
        params: { AV: 64, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p3",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const onset = points.find((p) => p.tag === "f0_onset_perturbation");
    expect(onset).toBeTruthy();
    // prev F0 = baseline 110, perturbation = 110 * 1.2 = 132
    expect(onset!.value).toBeCloseTo(132, 0);
  });

  it("lowers F0 at vowel onset after voiced stop", () => {
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "B_REL",
        type: "stop_release",
        voiced: true,
        bilabial: true,
        duration: 5,
        params: { AV: 47, AF: 52, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 0,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 170,
        params: { AV: 64, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p3",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const onset = points.find((p) => p.tag === "f0_onset_perturbation");
    expect(onset).toBeTruthy();
    // prev F0 = baseline 110, perturbation = 110 * 0.95 = 104.5
    expect(onset!.value).toBeCloseTo(104.5, 0);
  });

  // --- Continuation rise ---

  it("inserts continuation rise at comma boundary when boundaryTone is null", () => {
    // When the ToBI system has NOT set a boundary tone (boundaryTone=null),
    // f0_continuation_rise should still fire on comma SIL tokens.
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = finiteOrder(3);
    const s4 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 170,
        params: { AV: 64, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 150,
        punctuationSymbol: ",",
        params: { AV: 0, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 3,
      },
      {
        id: "p3",
        relation: "phone",
        phoneme: "IY",
        type: "vowel",
        stress: 0,
        duration: 100,
        params: { AV: 58, AVS: 0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p4",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s3,
        sync_right: s4,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    const continuation = points.find((p) => p.tag === "f0_continuation");
    expect(continuation).toBeTruthy();
    // The rise should be ~8 Hz above the previous F0 point
    expect(continuation!.value).toBeGreaterThan(110);
  });

  it("does NOT insert continuation rise when boundaryTone is already set (H%)", () => {
    // When the ToBI system has already set boundaryTone='H%' on a comma SIL,
    // f0_continuation_rise should NOT fire — tobi_boundary_rise handles it.
    const s0 = startOrder();
    const s1 = finiteOrder(1);
    const s2 = finiteOrder(2);
    const s3 = endOrder();

    const sequence = [
      {
        id: "p1",
        relation: "phone",
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        duration: 170,
        params: { AV: 64, AVS: 0 },
        sync_left: s0,
        sync_right: s1,
        status: 1,
        isAccented: true,
        isNuclearAccent: true,
        accentType: "H*",
        accentIndexInPhrase: 0,
        boundaryTone: null,
        phraseAccent: null,
        breakIndex: 1,
      },
      {
        id: "p2",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 150,
        punctuationSymbol: ",",
        params: { AV: 0, AVS: 0 },
        sync_left: s1,
        sync_right: s2,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "H%",
        phraseAccent: "L-",
        breakIndex: 3,
      },
      {
        id: "p3",
        relation: "phone",
        phoneme: "SIL",
        type: "silence",
        duration: 300,
        punctuationSymbol: ".",
        params: { AV: 0, AVS: 0 },
        sync_left: s2,
        sync_right: s3,
        status: 1,
        isAccented: false,
        isNuclearAccent: false,
        accentType: null,
        accentIndexInPhrase: -1,
        boundaryTone: "L%",
        phraseAccent: "L-",
        breakIndex: 4,
      },
    ];

    const out = runDeclarativeFrontend(sequence, {
      phases: ["prosody", "finalize"],
      parameters: TOBI_PARAMS,
    });

    const points = out.filter((t) => t.relation === "f0");
    // tobi_boundary_rise should fire (boundaryTone == 'H%')
    const boundaryRise = points.find((p) => p.tag === "f0_boundary_rise");
    expect(boundaryRise).toBeTruthy();
    // f0_continuation_rise should NOT fire (guarded by boundaryTone != null)
    const continuation = points.find((p) => p.tag === "f0_continuation");
    expect(continuation).toBeFalsy();
  });
});
