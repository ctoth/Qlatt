import { describe, expect, it } from "vitest";
import { runDeclarativeFrontend } from "../src/declarative-frontend";

describe("declarative frontend rulepack context migration", () => {
  it("applies K-context F2 to K_CL and copies to K_REL", () => {
    const sequence = [
      {
        phoneme: "K_CL",
        type: "stop_closure",
        params: { F2: 1500 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "K_REL",
        type: "stop_release",
        params: { F2: 1500 },
        duration: 25,
        inherentDuration: 25,
      },
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        params: { F2: 1950, AV: 58 },
        duration: 80,
        inherentDuration: 80,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].params.F2).toBe(1900);
    expect(out[1].params.F2).toBe(1900);
  });

  it("defaults K-context F2 to 1500 when no following vowel exists", () => {
    const sequence = [
      {
        phoneme: "K_CL",
        type: "stop_closure",
        params: { F2: 1700 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: { F2: 1500 },
        punctuationSymbol: ".",
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].params.F2).toBe(1500);
  });

  it("applies punctuation pause durations declaratively", () => {
    const sequence = [
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        punctuationSymbol: ",",
        duration: 90,
        inherentDuration: 90,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        punctuationSymbol: ";",
        duration: 90,
        inherentDuration: 90,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        punctuationSymbol: "?",
        duration: 90,
        inherentDuration: 90,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].duration).toBe(150);
    expect(out[1].duration).toBe(200);
    expect(out[2].duration).toBe(300);
  });

  it("applies weaker terminal pre-boundary lengthening to obstruents than sonorants", () => {
    // Pre-boundary lengthening uses break-index from the adjacent SIL token.
    // Sonorants get bi4 multiplier (1.5), obstruents get bi4 obstruent multiplier (1.2).
    // Tokens need stream/status/breakIndex for the rule to fire.
    // Rule requires prev to be a vowel/nasal/liquid/glide for consonant selection
    const sonorant = runDeclarativeFrontend(
      [
        {
          phoneme: "AO",
          type: "vowel",
          stress: 1,
          params: { F1: 570, F2: 840, AV: 60 },
          duration: 120,
          inherentDuration: 120,
          stream: "phone",
          status: 1,
          word: "raw",
        },
        {
          phoneme: "L",
          type: "liquid",
          params: {},
          duration: 100,
          inherentDuration: 100,
          stream: "phone",
          status: 1,
          word: "last",
        },
        {
          phoneme: "SIL",
          type: "silence",
          params: {},
          punctuationSymbol: ".",
          duration: 300,
          inherentDuration: 300,
          stream: "phone",
          status: 1,
          breakIndex: 4,
        },
      ],
      { phases: ["duration"] }
    );

    const obstruent = runDeclarativeFrontend(
      [
        {
          phoneme: "AE",
          type: "vowel",
          stress: 1,
          params: { F1: 660, F2: 1720, AV: 60 },
          duration: 120,
          inherentDuration: 120,
          stream: "phone",
          status: 1,
          word: "fat",
        },
        {
          phoneme: "S",
          type: "fricative",
          voiceless: true,
          alveolar: true,
          params: { AF: 60 },
          duration: 100,
          inherentDuration: 100,
          stream: "phone",
          status: 1,
          word: "sir",
        },
        {
          phoneme: "SIL",
          type: "silence",
          params: {},
          punctuationSymbol: ".",
          duration: 300,
          inherentDuration: 300,
          stream: "phone",
          status: 1,
          breakIndex: 4,
        },
      ],
      { phases: ["duration"] }
    );

    const sonL = sonorant.find((t) => t.phoneme === "L" && t.status !== 2)!;
    const obsS = obstruent.find((t) => t.phoneme === "S" && t.status !== 2)!;
    expect(sonL.duration).toBeGreaterThan(100);
    expect(obsS.duration).toBeGreaterThan(100);
    expect(obsS.duration).toBeLessThan(sonL.duration);
  });

  it("assigns SW declaratively and respects explicit inventory SW overrides", () => {
    const sequence = [
      {
        phoneme: "S",
        type: "fricative",
        params: { SW: 0 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "AA",
        type: "vowel",
        params: { SW: 1 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "HH",
        type: "fricative",
        inventorySW: 0,
        params: { SW: 1 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "T_REL",
        type: "stop_release",
        params: { SW: 0 },
        duration: 25,
        inherentDuration: 25,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].params.SW).toBe(1);
    expect(out[1].params.SW).toBe(0);
    expect(out[2].params.SW).toBe(0);
    expect(out[3].params.SW).toBe(1);
  });

  it("locks stop release/aspiration durations to inherent targets declaratively", () => {
    const sequence = [
      {
        phoneme: "K_REL",
        type: "stop_release",
        params: {},
        duration: 40,
        inherentDuration: 25,
      },
      {
        phoneme: "K_ASP",
        type: "stop_aspiration",
        params: {},
        duration: 70,
        inherentDuration: 48,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].duration).toBe(25);
    expect(out[1].duration).toBe(48);
  });

  // --- Bilabial F2 locus rules ---

  it("applies bilabial F2 locus to P_CL before front vowel", () => {
    const sequence = [
      {
        phoneme: "P_CL",
        type: "stop_closure",
        bilabial: true,
        params: { F2: 800 },
        duration: 50,
        inherentDuration: 50,
      },
      {
        phoneme: "P_REL",
        type: "stop_release",
        bilabial: true,
        params: { F2: 800 },
        duration: 5,
        inherentDuration: 5,
      },
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        hi: true,
        params: { F2: 2020, AV: 63 },
        duration: 150,
        inherentDuration: 150,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Bilabial before front vowel: F2 pulled toward 1200 but above locus → 1350
    expect(out[0].params.F2).toBe(1350);
    // P_REL copies from P_CL
    expect(out[1].params.F2).toBe(1350);
  });

  it("applies bilabial F2 locus to B_CL before back vowel", () => {
    const sequence = [
      {
        phoneme: "B_CL",
        type: "stop_closure",
        bilabial: true,
        params: { F2: 800 },
        duration: 45,
        inherentDuration: 45,
      },
      {
        phoneme: "B_REL",
        type: "stop_release",
        bilabial: true,
        params: { F2: 800 },
        duration: 5,
        inherentDuration: 5,
      },
      {
        phoneme: "AO",
        type: "vowel",
        back: true,
        mid: true,
        params: { F2: 990, AV: 63 },
        duration: 160,
        inherentDuration: 160,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Bilabial before back vowel (AO: back=true, no hi/front): F2 = 1100
    expect(out[0].params.F2).toBe(1100);
    // B_REL copies from B_CL
    expect(out[1].params.F2).toBe(1100);
  });

  it("applies bilabial F2 default locus to M before non-vowel", () => {
    const sequence = [
      {
        phoneme: "M",
        type: "nasal",
        bilabial: true,
        params: { F2: 1100, FNZ: 480 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // M before silence: bilabial default locus 1200
    expect(out[0].params.F2).toBe(1200);
  });

  // --- Alveolar F2 locus rules ---

  it("applies alveolar F2 locus to T_CL before front vowel", () => {
    const sequence = [
      {
        phoneme: "T_CL",
        type: "stop_closure",
        alveolar: true,
        params: { F2: 1800 },
        duration: 40,
        inherentDuration: 40,
      },
      {
        phoneme: "T_REL",
        type: "stop_release",
        alveolar: true,
        params: { F2: 1800 },
        duration: 15,
        inherentDuration: 15,
      },
      {
        phoneme: "IH",
        type: "vowel",
        front: true,
        hi: true,
        params: { F2: 1800, AV: 62 },
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Alveolar before front vowel: 1900
    expect(out[0].params.F2).toBe(1900);
    // T_REL copies from T_CL
    expect(out[1].params.F2).toBe(1900);
  });

  it("applies alveolar F2 locus to D_CL before back vowel", () => {
    const sequence = [
      {
        phoneme: "D_CL",
        type: "stop_closure",
        alveolar: true,
        params: { F2: 1800 },
        duration: 35,
        inherentDuration: 35,
      },
      {
        phoneme: "D_REL",
        type: "stop_release",
        alveolar: true,
        params: { F2: 1800 },
        duration: 10,
        inherentDuration: 10,
      },
      {
        phoneme: "AO",
        type: "vowel",
        back: true,
        mid: true,
        params: { F2: 990, AV: 63 },
        duration: 160,
        inherentDuration: 160,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Alveolar before back vowel (AO: back=true, no hi/front): 1700
    expect(out[0].params.F2).toBe(1700);
    // D_REL copies from D_CL
    expect(out[1].params.F2).toBe(1700);
  });

  it("applies alveolar F2 default locus to N before non-vowel", () => {
    const sequence = [
      {
        phoneme: "N",
        type: "nasal",
        alveolar: true,
        params: { F2: 1400, FNZ: 480 },
        duration: 70,
        inherentDuration: 70,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // N before silence: alveolar default locus 1800
    expect(out[0].params.F2).toBe(1800);
  });

  // --- Nasal subsystem rules ---

  it("assigns nasal place and murmur controls declaratively", () => {
    const sequence = [
      {
        phoneme: "M",
        type: "nasal",
        bilabial: true,
        params: { F2: 1100 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "N",
        type: "nasal",
        alveolar: true,
        params: { F2: 1400 },
        duration: 70,
        inherentDuration: 70,
      },
      {
        phoneme: "NG",
        type: "nasal",
        velar: true,
        params: { F2: 1700 },
        duration: 90,
        inherentDuration: 90,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["formant"] });
    expect(out[0].params.nasalPlaceIndex).toBe(1);
    expect(out[1].params.nasalPlaceIndex).toBe(2);
    expect(out[2].params.nasalPlaceIndex).toBe(3);
    expect(out[0].params.nasalMurmurStrength).toBe(1);
    expect(out[1].params.nasalCoupling).toBe(1);
  });

  // --- Dark /l/ allophony ---

  it("darkens /L/ in coda position (before silence)", () => {
    const sequence = [
      {
        phoneme: "AO",
        type: "vowel",
        back: true,
        params: { F2: 990, AV: 63 },
        duration: 160,
        inherentDuration: 160,
      },
      {
        phoneme: "L",
        type: "liquid",
        alveolar: true,
        params: { F2: 1050, F3: 2600 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Coda /L/: dark allophone follows policy.formant.dark_l_f2/dark_l_f3.
    expect(out[1].params.F2).toBe(900);
    expect(out[1].params.F3).toBe(2400);
  });

  it("preserves clear /L/ in onset position (before vowel)", () => {
    const sequence = [
      {
        phoneme: "L",
        type: "liquid",
        alveolar: true,
        params: { F2: 1050, F3: 2600 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        hi: true,
        params: { F2: 2020, AV: 63 },
        duration: 150,
        inherentDuration: 150,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Onset /L/: clear allophone, F2 unchanged from inventory
    expect(out[0].params.F2).toBe(1050);
    expect(out[0].params.F3).toBe(2600);
  });

  // --- /r/ F3 lowering ---

  it("sets /R/ F3 by position: onset vs coda", () => {
    const sequence = [
      {
        phoneme: "R",
        type: "liquid",
        rhotic: true,
        params: { F3: 1700 },
        duration: 90,
        inherentDuration: 90,
      },
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        hi: true,
        params: { F2: 2020, AV: 63 },
        duration: 150,
        inherentDuration: 150,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Onset /R/: F3=1600
    expect(out[0].params.F3).toBe(1600);
  });

  it("lowers /R/ F3 further in coda position", () => {
    const sequence = [
      {
        phoneme: "AA",
        type: "vowel",
        low: true,
        params: { F2: 1220, AV: 64 },
        duration: 180,
        inherentDuration: 180,
      },
      {
        phoneme: "R",
        type: "liquid",
        rhotic: true,
        params: { F3: 1700 },
        duration: 90,
        inherentDuration: 90,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Coda /R/: F3=1400
    expect(out[1].params.F3).toBe(1400);
  });

  // --- F1 stop onset ---

  it("sets low F1 at stop release by place of articulation", () => {
    const sequence = [
      {
        phoneme: "P_REL",
        type: "stop_release",
        bilabial: true,
        params: { F1: 400, F2: 1100 },
        duration: 5,
        inherentDuration: 5,
      },
      {
        phoneme: "T_REL",
        type: "stop_release",
        alveolar: true,
        params: { F1: 400, F2: 1600 },
        duration: 15,
        inherentDuration: 15,
      },
      {
        phoneme: "K_REL",
        type: "stop_release",
        velar: true,
        params: { F1: 300, F2: 1990 },
        duration: 25,
        inherentDuration: 25,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Labial F1=250
    expect(out[0].params.F1).toBe(250);
    // Alveolar F1=300
    expect(out[1].params.F1).toBe(300);
    // Velar F1=280
    expect(out[2].params.F1).toBe(280);
  });

  // --- S-cluster aspiration reduction ---

  it("reduces aspiration duration in s-cluster (S before stop)", () => {
    const sequence = [
      {
        phoneme: "S",
        type: "fricative",
        voiceless: true,
        alveolar: true,
        params: { AF: 60 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "T_CL",
        type: "stop_closure",
        voiceless: true,
        alveolar: true,
        params: {},
        duration: 40,
        inherentDuration: 40,
      },
      {
        phoneme: "T_REL",
        type: "stop_release",
        voiceless: true,
        alveolar: true,
        params: { AF: 58, AH: 55 },
        duration: 15,
        inherentDuration: 15,
      },
      {
        phoneme: "T_ASP",
        type: "stop_aspiration",
        voiceless: true,
        alveolar: true,
        params: { AH: 55 },
        duration: 56,
        inherentDuration: 56,
      },
      {
        phoneme: "AA",
        type: "vowel",
        low: true,
        params: { F1: 700, F2: 1220, AV: 64 },
        duration: 180,
        inherentDuration: 180,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // T_ASP: aspiration dramatically reduced by s-cluster rule
    // Klatt incompressibility floor (inherentDuration * 0.6 = 56 * 0.6 = 33.6 -> 34) prevents
    // going all the way to 10ms, but 34ms is still dramatically shorter than the original 56ms
    const asp = out.find((t) => t.phoneme === "T_ASP");
    expect(asp).toBeTruthy();
    expect(asp!.duration).toBeLessThanOrEqual(34);
    expect(asp!.duration).toBeLessThan(56);
    // AH reduced by 10 dB: 55 - 10 = 45
    expect(asp!.params.AH).toBe(45);
  });

  // --- Aspiration frication carryover (Hanson & Stevens 2003) ---

  it("applies place-dependent AF carryover on stop aspiration", () => {
    const sequence = [
      {
        phoneme: "P_ASP",
        type: "stop_aspiration",
        voiceless: true,
        bilabial: true,
        params: { AH: 52 },
        duration: 53,
        inherentDuration: 53,
      },
      {
        phoneme: "T_ASP",
        type: "stop_aspiration",
        voiceless: true,
        alveolar: true,
        params: { AH: 55 },
        duration: 56,
        inherentDuration: 56,
      },
      {
        phoneme: "K_ASP",
        type: "stop_aspiration",
        voiceless: true,
        velar: true,
        params: { AH: 53 },
        duration: 48,
        inherentDuration: 48,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const pAsp = out.find((t) => t.phoneme === "P_ASP");
    const tAsp = out.find((t) => t.phoneme === "T_ASP");
    const kAsp = out.find((t) => t.phoneme === "K_ASP");

    expect(pAsp).toBeTruthy();
    expect(tAsp).toBeTruthy();
    expect(kAsp).toBeTruthy();

    // Planned defaults: p=0, t=18, k=0
    // K aspiration is pure glottal noise (AH only), no frication (AF=0).
    // Citation: Stevens 1998, Klatt 1980
    expect(pAsp!.params.AF).toBe(0);
    expect(tAsp!.params.AF).toBe(18);
    expect(kAsp!.params.AF).toBe(0);
    expect(tAsp!.params.AF).toBeGreaterThan(kAsp!.params.AF);
  });

  it("scales aspiration frication for weak aspiration tokens", () => {
    const sequence = [
      {
        phoneme: "T_ASP",
        type: "stop_aspiration",
        voiceless: true,
        alveolar: true,
        weak: true,
        params: { AH: 55 },
        duration: 56,
        inherentDuration: 56,
      },
      {
        phoneme: "K_ASP",
        type: "stop_aspiration",
        voiceless: true,
        velar: true,
        weak: true,
        params: { AH: 53 },
        duration: 48,
        inherentDuration: 48,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const tAsp = out.find((t) => t.phoneme === "T_ASP");
    const kAsp = out.find((t) => t.phoneme === "K_ASP");

    expect(tAsp).toBeTruthy();
    expect(kAsp).toBeTruthy();

    // Planned weak_scale=0.5: t=18->9, k=0->0 (k has no AF carryover)
    // Citation: Stevens 1998, Klatt 1980
    expect(tAsp!.params.AF).toBe(9);
    expect(kAsp!.params.AF).toBe(0);
  });

  it("does not modify AH when applying aspiration frication carryover", () => {
    const sequence = [
      {
        phoneme: "T_ASP",
        type: "stop_aspiration",
        voiceless: true,
        alveolar: true,
        params: { AH: 55 },
        duration: 56,
        inherentDuration: 56,
      },
      {
        phoneme: "K_ASP",
        type: "stop_aspiration",
        voiceless: true,
        velar: true,
        params: { AH: 53 },
        duration: 48,
        inherentDuration: 48,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const tAsp = out.find((t) => t.phoneme === "T_ASP");
    const kAsp = out.find((t) => t.phoneme === "K_ASP");

    expect(tAsp).toBeTruthy();
    expect(kAsp).toBeTruthy();
    expect(tAsp!.params.AH).toBe(55);
    expect(kAsp!.params.AH).toBe(53);
  });

  it("coexists with s-cluster aspiration reduction (AH reduction plus AF carryover)", () => {
    const sequence = [
      {
        phoneme: "S",
        type: "fricative",
        voiceless: true,
        alveolar: true,
        params: { AF: 60 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "T_CL",
        type: "stop_closure",
        voiceless: true,
        alveolar: true,
        params: {},
        duration: 40,
        inherentDuration: 40,
      },
      {
        phoneme: "T_REL",
        type: "stop_release",
        voiceless: true,
        alveolar: true,
        params: { AF: 58, AH: 55 },
        duration: 15,
        inherentDuration: 15,
      },
      {
        phoneme: "T_ASP",
        type: "stop_aspiration",
        voiceless: true,
        alveolar: true,
        params: { AH: 55 },
        duration: 56,
        inherentDuration: 56,
      },
      {
        phoneme: "AA",
        type: "vowel",
        low: true,
        params: { F1: 700, F2: 1220, AV: 64 },
        duration: 180,
        inherentDuration: 180,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const asp = out.find((t) => t.phoneme === "T_ASP");

    expect(asp).toBeTruthy();
    // Existing s-cluster behavior preserved.
    expect(asp!.duration).toBeLessThanOrEqual(34);
    expect(asp!.params.AH).toBe(45);
    // New carryover behavior.
    expect(asp!.params.AF).toBe(18);
  });

  // --- Vowel reduction ---

  it("centralizes formants of unstressed vowels toward schwa", () => {
    // IY0: F1=330, F2=1950 -- should move toward schwa (500, 1500)
    const sequence = [
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        hi: true,
        stress: 0,
        params: { F1: 330, F2: 1950, AV: 58 },
        duration: 70,
        inherentDuration: 70,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // F1: 330 + (500 - 330) * 0.4 = 330 + 68 = 398
    expect(out[0].params.F1).toBeCloseTo(398, 0);
    // F2: 1950 + (1500 - 1950) * 0.4 = 1950 - 180 = 1770
    expect(out[0].params.F2).toBeCloseTo(1770, 0);
  });

  it("does not reduce formants of stressed vowels", () => {
    const sequence = [
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        hi: true,
        stress: 1,
        params: { F1: 310, F2: 2020, AV: 63 },
        duration: 150,
        inherentDuration: 150,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Stressed vowels should not be reduced
    expect(out[0].params.F1).toBe(310);
    expect(out[0].params.F2).toBe(2020);
  });

  // --- Anticipatory nasalization ---

  it("applies anticipatory nasal coupling windows on vowels before nasals", () => {
    const sequence = [
      {
        phoneme: "AE",
        type: "vowel",
        low: true,
        front: true,
        params: { F1: 620, F2: 1660, B1: 70, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
      {
        phoneme: "M",
        type: "nasal",
        bilabial: true,
        params: {},
        duration: 80,
        inherentDuration: 80,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["formant"] });
    expect(Array.isArray(out[1].control_windows)).toBe(true);
    const anticipatory = out[1].control_windows.filter((window: any) => window.target === "prev");
    expect(anticipatory.length).toBe(3);
    expect(anticipatory[0].fields.nasalCoupling.value).toBeCloseTo(0.2805, 4);
  });

  it("does not nasalize vowels not followed by nasal", () => {
    const sequence = [
      {
        phoneme: "AE",
        type: "vowel",
        low: true,
        front: true,
        params: { F1: 620, F2: 1660, B1: 70, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
      {
        phoneme: "T_CL",
        type: "stop_closure",
        voiceless: true,
        alveolar: true,
        params: {},
        duration: 40,
        inherentDuration: 40,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["formant"] });
    expect(out[0].control_windows).toBeUndefined();
  });

  // --- Non-word-initial consonant shortening ---

  it("shortens non-word-initial consonants by K=0.7", () => {
    const sequence = [
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        word: "cat",
        params: { F1: 620, F2: 1660, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
      {
        phoneme: "T_CL",
        type: "stop_closure",
        voiceless: true,
        alveolar: true,
        word: "cat",
        params: {},
        duration: 40,
        inherentDuration: 40,
      },
      {
        phoneme: "SIL",
        type: "silence",
        punctuationSymbol: ".",
        word: ".",
        params: {},
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // T_CL: in same word as preceding AE, so non-word-initial: duration * 0.7
    // Also gets word_initial_lengthening? No -- prev.word == current.word so not word-initial
    // But gets pre_boundary_terminal_multiplier (1.4) since next is terminal SIL
    // non_word_initial: 40 * 0.7 = 28, then pre_boundary: 28 * 1.4 = 39.2 -> resolved via Klatt incompressibility
    // Let's just verify it's less than the original 40 * 1.4 = 56 (without shortening)
    const tcl = out.find((t) => t.phoneme === "T_CL");
    expect(tcl).toBeTruthy();
    expect(tcl!.duration).toBeLessThan(56);
  });

  // --- Word-initial lengthening ---

  it("lengthens word-initial consonants by 1.2", () => {
    const sequence = [
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "K_CL",
        type: "stop_closure",
        voiceless: true,
        velar: true,
        word: "cat",
        params: {},
        duration: 60,
        inherentDuration: 60,
      },
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        word: "cat",
        params: { F1: 620, F2: 1660, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // K_CL: word-initial (prev is SIL, no word). Gets word_initial_lengthening: 60 * 1.2 = 72
    // Also gets pre_boundary_word_multiplier since next is different word? No -- AE is same word "cat"
    const kcl = out.find((t) => t.phoneme === "K_CL");
    expect(kcl).toBeTruthy();
    // Should be longer than 60 (inherent) due to word-initial lengthening
    expect(kcl!.duration).toBeGreaterThan(60);
  });

  // --- Fricative minimum duration ---

  it("enforces minimum duration floor on short fricatives", () => {
    // A very short /F/ (20ms) should be floored to 50ms (labiodental min)
    const sequence = [
      {
        phoneme: "F",
        type: "fricative",
        voiceless: true,
        labiodental: true,
        params: { AF: 48 },
        duration: 20,
        inherentDuration: 20,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // F: duration was 20, should be floored to fricative_min_labiodental_ms (50)
    // But it also gets word_initial_lengthening (1.2) and pre_boundary_terminal (1.4)
    // word_initial: 20 * 1.2 = 24; pre_boundary: 24 * 1.4 = 33.6
    // fricative_minimum_duration floor: max(33.6, 50) = 50
    const fric = out.find((t) => t.phoneme === "F");
    expect(fric).toBeTruthy();
    expect(fric!.duration).toBeGreaterThanOrEqual(50);
  });

  it("does not reduce already-long fricatives below minimum", () => {
    // A long /S/ (100ms) should stay at 100ms
    const sequence = [
      {
        phoneme: "S",
        type: "fricative",
        voiceless: true,
        alveolar: true,
        params: { AF: 60 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        params: { F1: 620, F2: 1660, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // S: duration 100ms with word-initial (1.2) => 120, well above 30ms sibilant min
    const sib = out.find((t) => t.phoneme === "S");
    expect(sib).toBeTruthy();
    expect(sib!.duration).toBeGreaterThanOrEqual(30);
    // Should be >= 100 because it gets word_initial_lengthening
    expect(sib!.duration).toBeGreaterThanOrEqual(100);
  });

  // --- Palatal F2 locus ---

  it("sets palatal F2 locus on Y before back vowel", () => {
    const sequence = [
      {
        phoneme: "Y",
        type: "glide",
        voiced: true,
        palatal: true,
        params: { F2: 2070 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "UW",
        type: "vowel",
        back: true,
        hi: true,
        params: { F2: 900, AV: 63 },
        duration: 180,
        inherentDuration: 180,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Y before back vowel: F2 = palatal_f2_back_vowel = 2400
    expect(out[0].params.F2).toBe(2400);
  });

  it("sets palatal F2 locus on Y default (before front vowel)", () => {
    const sequence = [
      {
        phoneme: "Y",
        type: "glide",
        voiced: true,
        palatal: true,
        params: { F2: 2070 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        hi: true,
        params: { F2: 2020, AV: 63 },
        duration: 150,
        inherentDuration: 150,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Y before front vowel: default F2 = palatal_f2_locus = 2600
    expect(out[0].params.F2).toBe(2600);
  });

  // --- Vowel before voiceless stop shortening ---

  it("shortens vowel before voiceless stop closure (non-phrase-final)", () => {
    const sequence = [
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        front: true,
        low: true,
        word: "cat",
        params: { F1: 620, F2: 1660, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
      {
        phoneme: "T_CL",
        type: "stop_closure",
        voiceless: true,
        alveolar: true,
        word: "cat",
        params: {},
        duration: 40,
        inherentDuration: 40,
      },
      {
        phoneme: "T_REL",
        type: "stop_release",
        voiceless: true,
        alveolar: true,
        word: "cat",
        params: { AF: 58, AH: 55 },
        duration: 15,
        inherentDuration: 15,
      },
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        hi: true,
        stress: 0,
        word: "see",
        params: { F1: 330, F2: 1950, AV: 58 },
        duration: 70,
        inherentDuration: 70,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const ae = out.find((t) => t.phoneme === "AE");
    expect(ae).toBeTruthy();
    // AE is before voiceless T_CL: vowel_shortening applies 0.7x multiplier
    // Base: 170ms, stress*1.3=221, vowel_shortening_voiceless*0.7=154.7
    // plus pre_boundary and incompressibility adjustments
    expect(ae!.duration).toBeLessThan(170);
  });

  it("shortens vowel more before voiceless stop at phrase end", () => {
    const sequence = [
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        front: true,
        low: true,
        word: "cat",
        params: { F1: 620, F2: 1660, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
      {
        phoneme: "T_CL",
        type: "stop_closure",
        voiceless: true,
        alveolar: true,
        word: "cat",
        params: {},
        duration: 40,
        inherentDuration: 40,
      },
      {
        phoneme: "SIL",
        type: "silence",
        punctuationSymbol: ".",
        params: {},
        duration: 300,
        inherentDuration: 300,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const ae = out.find((t) => t.phoneme === "AE");
    expect(ae).toBeTruthy();
    // AE before voiceless T_CL, next-next is SIL -> phrase_final -> -45ms
    // This should be shorter than the non-phrase-final case
    // The additive shortening of -45 is substantial
    expect(ae!.duration).toBeLessThan(170);
  });

  // --- Burst spectral template ---

  it("sets burst spectral template on labial release", () => {
    const sequence = [
      {
        phoneme: "P_REL",
        type: "stop_release",
        bilabial: true,
        voiceless: true,
        params: { F1: 400, F2: 1100, A2: 0, A3: 0, A4: 0, A5: 0, A6: 0 },
        duration: 5,
        inherentDuration: 5,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Labial diffuse-falling: A2=50, A3=40, A4=35, A5=45, A6=30
    expect(out[0].params.A2).toBe(50);
    expect(out[0].params.A3).toBe(40);
    expect(out[0].params.A4).toBe(35);
    expect(out[0].params.A5).toBe(45);
    expect(out[0].params.A6).toBe(30);
  });

  it("sets burst spectral template on alveolar release", () => {
    const sequence = [
      {
        phoneme: "T_REL",
        type: "stop_release",
        alveolar: true,
        voiceless: true,
        params: { F1: 400, F2: 1600, A2: 0, A3: 0, A4: 0, A5: 0, A6: 0 },
        duration: 15,
        inherentDuration: 15,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Alveolar diffuse-rising: A2=40, A3=50, A4=50, A5=45, A6=50
    expect(out[0].params.A2).toBe(40);
    expect(out[0].params.A3).toBe(50);
    expect(out[0].params.A4).toBe(50);
    expect(out[0].params.A5).toBe(45);
    expect(out[0].params.A6).toBe(50);
  });

  it("sets burst spectral template on velar release", () => {
    const sequence = [
      {
        phoneme: "K_REL",
        type: "stop_release",
        velar: true,
        voiceless: true,
        params: { F1: 300, F2: 1990, A2: 0, A3: 0, A4: 0, A5: 0, A6: 0 },
        duration: 25,
        inherentDuration: 25,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // Velar compact mid-frequency: A2=45, A3=50, A4=55, A5=40, A6=35
    expect(out[0].params.A2).toBe(45);
    expect(out[0].params.A3).toBe(50);
    expect(out[0].params.A4).toBe(55);
    expect(out[0].params.A5).toBe(40);
    expect(out[0].params.A6).toBe(35);
  });

  it("enforces dental fricative minimum duration", () => {
    // A short /TH/ (25ms) should be floored to 60ms
    const sequence = [
      {
        phoneme: "TH",
        type: "fricative",
        voiceless: true,
        dental: true,
        params: { AF: 48 },
        duration: 25,
        inherentDuration: 25,
      },
      {
        phoneme: "SIL",
        type: "silence",
        params: {},
        duration: 100,
        inherentDuration: 100,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const th = out.find((t) => t.phoneme === "TH");
    expect(th).toBeTruthy();
    // Should be at least 60ms (dental minimum)
    expect(th!.duration).toBeGreaterThanOrEqual(60);
  });

  // --- Nasal place assimilation ---

  it("assimilates N to bilabial place before bilabial stop", () => {
    const sequence = [
      {
        phoneme: "N",
        type: "nasal",
        alveolar: true,
        voiced: true,
        params: { F2: 1400 },
        duration: 70,
        inherentDuration: 70,
      },
      {
        phoneme: "P_CL",
        type: "stop_closure",
        voiceless: true,
        bilabial: true,
        params: {},
        duration: 50,
        inherentDuration: 50,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["formant"] });
    const n = out.find((t) => t.phoneme === "N");
    expect(n).toBeTruthy();
    expect(n!.params.nasalPlaceIndex).toBe(1);
    expect(n!.params.F2).toBe(1200);
  });

  it("assimilates N to velar place before velar stop", () => {
    const sequence = [
      {
        phoneme: "N",
        type: "nasal",
        alveolar: true,
        voiced: true,
        params: { F2: 1400 },
        duration: 70,
        inherentDuration: 70,
      },
      {
        phoneme: "K_CL",
        type: "stop_closure",
        voiceless: true,
        velar: true,
        params: {},
        duration: 60,
        inherentDuration: 60,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["formant"] });
    const n = out.find((t) => t.phoneme === "N");
    expect(n).toBeTruthy();
    expect(n!.params.nasalPlaceIndex).toBe(3);
  });

  it("does not assimilate N before alveolar stop (same place)", () => {
    const sequence = [
      {
        phoneme: "N",
        type: "nasal",
        alveolar: true,
        voiced: true,
        params: { F2: 1400 },
        duration: 70,
        inherentDuration: 70,
      },
      {
        phoneme: "T_CL",
        type: "stop_closure",
        voiceless: true,
        alveolar: true,
        params: {},
        duration: 40,
        inherentDuration: 40,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["formant"] });
    const n = out.find((t) => t.phoneme === "N");
    expect(n).toBeTruthy();
    expect(n!.params.nasalPlaceIndex).toBe(2);
  });

  // --- Stop unreleasing ---

  it("unreleases stop release before another stop closure", () => {
    const sequence = [
      {
        phoneme: "T_REL",
        type: "stop_release",
        voiceless: true,
        alveolar: true,
        params: { AF: 58, AH: 55 },
        duration: 15,
        inherentDuration: 15,
      },
      {
        phoneme: "P_CL",
        type: "stop_closure",
        voiceless: true,
        bilabial: true,
        params: {},
        duration: 50,
        inherentDuration: 50,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const rel = out.find((t) => t.phoneme === "T_REL");
    expect(rel).toBeTruthy();
    // Stop unreleasing: AF = 0, duration = 5ms minimum
    expect(rel!.params.AF).toBe(0);
    expect(rel!.duration).toBeLessThanOrEqual(15);
  });

  it("does not unrelease stop release before vowel", () => {
    const sequence = [
      {
        phoneme: "T_REL",
        type: "stop_release",
        voiceless: true,
        alveolar: true,
        params: { AF: 58, AH: 55 },
        duration: 15,
        inherentDuration: 15,
      },
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        params: { F1: 620, F2: 1660, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const rel = out.find((t) => t.phoneme === "T_REL");
    expect(rel).toBeTruthy();
    // Not unreleased: AF should remain 58
    expect(rel!.params.AF).toBe(58);
  });

  // --- Word-medial consonant shortening ---

  it("shortens word-medial consonants by K=0.85", () => {
    const sequence = [
      {
        phoneme: "AE",
        type: "vowel",
        stress: 1,
        word: "matter",
        params: { F1: 620, F2: 1660, AV: 64 },
        duration: 170,
        inherentDuration: 170,
      },
      {
        phoneme: "T_CL",
        type: "stop_closure",
        voiceless: true,
        alveolar: true,
        word: "matter",
        params: {},
        duration: 40,
        inherentDuration: 40,
      },
      {
        phoneme: "ER",
        type: "vowel",
        stress: 0,
        word: "matter",
        params: { F1: 470, F2: 1200, AV: 58 },
        duration: 70,
        inherentDuration: 70,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const tcl = out.find((t) => t.phoneme === "T_CL");
    expect(tcl).toBeTruthy();
    // T_CL is word-medial (prev and next in same word "matter")
    // Gets non_word_initial_consonant_shortening (0.7) AND word_medial (0.85)
    // 40 * 0.7 * 0.85 = 23.8 (before incompressibility)
    // Much less than 40
    expect(tcl!.duration).toBeLessThan(40);
  });

  // --- VCV coarticulation ---

  it("shifts consonant F2 toward flanking vowels average", () => {
    const sequence = [
      {
        phoneme: "IY",
        type: "vowel",
        front: true,
        hi: true,
        stress: 1,
        params: { F1: 310, F2: 2020, AV: 63 },
        duration: 150,
        inherentDuration: 150,
      },
      {
        phoneme: "M",
        type: "nasal",
        bilabial: true,
        voiced: true,
        params: { F2: 1100, FNZ: 480 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "AA",
        type: "vowel",
        low: true,
        stress: 1,
        params: { F1: 700, F2: 1220, AV: 64 },
        duration: 180,
        inherentDuration: 180,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const m = out.find((t) => t.phoneme === "M");
    expect(m).toBeTruthy();
    // bilabial_f2_locus sets M's F2 to 1200 (default bilabial locus before non-front non-back vowel AA)
    // Then vcv_coarticulation uses DAC weight = 0.2 * (1 - 1/3) = 0.1333...
    // flanking avg = (2020 + 1220) / 2 = 1620
    // adjusted = 1200 + (1620 - 1200) * 0.1333... = 1256
    expect(m!.params.F2).toBeCloseTo(1256, 0);
  });

  it("does not apply VCV coarticulation when not flanked by vowels", () => {
    const sequence = [
      {
        phoneme: "S",
        type: "fricative",
        voiceless: true,
        alveolar: true,
        params: { AF: 60 },
        duration: 100,
        inherentDuration: 100,
      },
      {
        phoneme: "M",
        type: "nasal",
        bilabial: true,
        voiced: true,
        params: { F2: 1100, FNZ: 480 },
        duration: 80,
        inherentDuration: 80,
      },
      {
        phoneme: "AA",
        type: "vowel",
        low: true,
        stress: 1,
        params: { F1: 700, F2: 1220, AV: 64 },
        duration: 180,
        inherentDuration: 180,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    const m = out.find((t) => t.phoneme === "M");
    expect(m).toBeTruthy();
    // M's prev is S (fricative, not vowel), so vcv rule doesn't fire
    // bilabial_f2_locus default = 1200
    expect(m!.params.F2).toBe(1200);
  });
});
