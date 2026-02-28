import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";

describe("DAC-weighted F2 coarticulation", () => {
  // Helper to make a vowel token
  function vowel(
    phoneme: string,
    f2: number,
    extra: Record<string, unknown> = {}
  ) {
    return {
      phoneme,
      type: "vowel",
      stress: 1,
      params: { F1: 500, F2: f2, AV: 63 },
      duration: 150,
      inherentDuration: 150,
      ...extra,
    };
  }

  // Helper to make a consonant token with explicit dac
  function consonant(
    phoneme: string,
    type: string,
    dac: number,
    f2: number,
    extra: Record<string, unknown> = {}
  ) {
    return {
      phoneme,
      type,
      dac,
      params: { F2: f2 },
      duration: 80,
      inherentDuration: 80,
      ...extra,
    };
  }

  it("DAC=1 consonant F2 shifts toward flanking vowels (strong coarticulation)", () => {
    // /M/ (nasal, bilabial, DAC=1) flanked by IY (F2=2020) and AA (F2=1220)
    const sequence = [
      vowel("IY", 2020, { front: true, hi: true }),
      consonant("M", "nasal", 1, 1100, { bilabial: true, voiced: true }),
      vowel("AA", 1220, { low: true }),
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const m = out.find((t: Record<string, unknown>) => t.phoneme === "M");
    expect(m).toBeTruthy();

    // bilabial_f2_locus sets M F2 to 1200 (default, AA is low, not front/hi or back)
    // flanking_avg_f2 = (2020 + 1220) / 2 = 1620
    // DAC=1: resistance = 1/3 = 0.333, weight = 0.3 * (1 - 0.333) = 0.2
    // new F2 = 1200 + (1620 - 1200) * 0.2 = 1200 + 84 = 1284
    expect(m!.params.F2).toBeGreaterThan(1200);
    expect(m!.params.F2).toBeLessThan(1620);
    // More precisely, ~1284
    expect(m!.params.F2).toBeCloseTo(1284, -1);
  });

  it("DAC=3 consonant F2 is unchanged by flanking vowels (full resistance)", () => {
    // Use a stop_closure with DAC=3, flanked by vowels with very different F2
    // K_CL has special locus rules, so let's use a generic stop_closure with explicit dac=3
    // But K_CL has velar locus rules that override F2 -- we need a consonant type that
    // the vcv rule matches but has no locus rule. Use a liquid with dac=3 for testing.
    const sequence = [
      vowel("IY", 2020, { front: true, hi: true }),
      {
        phoneme: "TEST_C",
        type: "liquid",
        dac: 3,
        params: { F2: 1400 },
        duration: 80,
        inherentDuration: 80,
      },
      vowel("AA", 1220, { low: true }),
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const c = out.find(
      (t: Record<string, unknown>) => t.phoneme === "TEST_C"
    );
    expect(c).toBeTruthy();

    // DAC=3: resistance = 3/3 = 1.0, weight = 0.3 * (1 - 1.0) = 0.0
    // F2 should remain at 1400 (no coarticulation)
    // But dark_l_allophony only fires for phoneme == 'L', and r_f3_lowering for 'R',
    // so TEST_C doesn't match any locus rule -- its F2 stays at 1400 before vcv runs.
    // With weight=0, vcv produces: 1400 + (flanking_avg - 1400) * 0 = 1400
    expect(c!.params.F2).toBe(1400);
  });

  it("DAC=1 shifts F2 more than DAC=3 in identical vowel context", () => {
    const leftVowel = vowel("IY", 2020, { front: true, hi: true });
    const rightVowel = vowel("AA", 1220, { low: true });

    // DAC=1 consonant
    const seqDac1 = [
      { ...leftVowel },
      {
        phoneme: "TEST_D1",
        type: "liquid",
        dac: 1,
        params: { F2: 1400 },
        duration: 80,
        inherentDuration: 80,
      },
      { ...rightVowel },
    ];

    // DAC=3 consonant
    const seqDac3 = [
      { ...leftVowel },
      {
        phoneme: "TEST_D3",
        type: "liquid",
        dac: 3,
        params: { F2: 1400 },
        duration: 80,
        inherentDuration: 80,
      },
      { ...rightVowel },
    ];

    const outDac1 = runDeclarativeFrontend(seqDac1, { phases: ["duration"] });
    const outDac3 = runDeclarativeFrontend(seqDac3, { phases: ["duration"] });

    const c1 = outDac1.find(
      (t: Record<string, unknown>) => t.phoneme === "TEST_D1"
    );
    const c3 = outDac3.find(
      (t: Record<string, unknown>) => t.phoneme === "TEST_D3"
    );
    expect(c1).toBeTruthy();
    expect(c3).toBeTruthy();

    // flanking_avg = (2020 + 1220) / 2 = 1620
    // DAC=1: weight = 0.3 * (1 - 1/3) = 0.2, shift = (1620-1400)*0.2 = 44
    // DAC=3: weight = 0.3 * (1 - 1) = 0.0, shift = 0
    const shift1 = Math.abs(c1!.params.F2 - 1400);
    const shift3 = Math.abs(c3!.params.F2 - 1400);

    expect(shift1).toBeGreaterThan(shift3);
    // DAC=1 should have measurable shift, DAC=3 should have zero
    expect(shift1).toBeGreaterThan(0);
    expect(shift3).toBe(0);
  });

  it("DAC=2 consonant shows intermediate coarticulation", () => {
    const sequence = [
      vowel("IY", 2020, { front: true, hi: true }),
      {
        phoneme: "TEST_D2",
        type: "liquid",
        dac: 2,
        params: { F2: 1400 },
        duration: 80,
        inherentDuration: 80,
      },
      vowel("AA", 1220, { low: true }),
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const c = out.find(
      (t: Record<string, unknown>) => t.phoneme === "TEST_D2"
    );
    expect(c).toBeTruthy();

    // DAC=2: resistance = 2/3 = 0.667, weight = 0.3 * (1 - 0.667) = 0.1
    // shift = (1620 - 1400) * 0.1 = 22
    // F2 = 1400 + 22 = 1422
    expect(c!.params.F2).toBeGreaterThan(1400);
    expect(c!.params.F2).toBeLessThan(1500);
    expect(c!.params.F2).toBeCloseTo(1422, -1);
  });

  it("missing dac defaults to 1 (maximum coarticulation)", () => {
    // Consonant without dac property -- should behave like DAC=1
    const seqNoDac = [
      vowel("IY", 2020, { front: true, hi: true }),
      {
        phoneme: "TEST_ND",
        type: "liquid",
        params: { F2: 1400 },
        duration: 80,
        inherentDuration: 80,
      },
      vowel("AA", 1220, { low: true }),
    ];

    const seqDac1 = [
      vowel("IY", 2020, { front: true, hi: true }),
      {
        phoneme: "TEST_D1",
        type: "liquid",
        dac: 1,
        params: { F2: 1400 },
        duration: 80,
        inherentDuration: 80,
      },
      vowel("AA", 1220, { low: true }),
    ];

    const outNoDac = runDeclarativeFrontend(seqNoDac, {
      phases: ["duration"],
    });
    const outDac1 = runDeclarativeFrontend(seqDac1, { phases: ["duration"] });

    const cNoDac = outNoDac.find(
      (t: Record<string, unknown>) => t.phoneme === "TEST_ND"
    );
    const cDac1 = outDac1.find(
      (t: Record<string, unknown>) => t.phoneme === "TEST_D1"
    );
    expect(cNoDac).toBeTruthy();
    expect(cDac1).toBeTruthy();

    // Both should have the same F2 (both effective DAC=1)
    expect(cNoDac!.params.F2).toBe(cDac1!.params.F2);
  });
});
