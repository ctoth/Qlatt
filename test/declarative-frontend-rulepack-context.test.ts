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
        punctuationSymbol: "?",
        duration: 90,
        inherentDuration: 90,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    expect(out[0].duration).toBe(150);
    expect(out[1].duration).toBe(300);
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

  // --- Nasal antiformant rules ---

  it("sets nasal antiformant FNZ by place of articulation", () => {
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
        phoneme: "N",
        type: "nasal",
        alveolar: true,
        params: { F2: 1400, FNZ: 480 },
        duration: 70,
        inherentDuration: 70,
      },
      {
        phoneme: "NG",
        type: "nasal",
        velar: true,
        params: { F2: 1700, FNZ: 480 },
        duration: 90,
        inherentDuration: 90,
      },
    ];

    const out = runDeclarativeFrontend(sequence, { phases: ["duration"] });
    // /m/: FNZ = 900 (Hawkins & Stevens 1985)
    expect(out[0].params.FNZ).toBe(900);
    // /n/: FNZ = 1700
    expect(out[1].params.FNZ).toBe(1700);
    // /ng/: FNZ = 2800
    expect(out[2].params.FNZ).toBe(2800);
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
    // Coda /L/: dark allophone F2=750, F3=2400
    expect(out[1].params.F2).toBe(750);
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
});
