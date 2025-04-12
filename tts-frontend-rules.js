export const BASE_PARAMS = {
  F1: 500,
  F2: 1500,
  F3: 2500,
  F4: 3300,
  B4: 250,
  F5: 3750,
  B5: 200,
  F6: 4900,
  B6: 1000,
  B1: 100,
  B2: 100,
  B3: 100, // Generic vowel BW defaults
  AV: 0,
  AF: 0,
  AH: 0,
  AVS: 0,
  F0: 0,
  FNZ: 250,
  FNP: 250,
  BNP: 100,
  BNZ: 100,
  AN: 0,
  A1: 0,
  A2: 0,
  A3: 0,
  A4: 0,
  A5: 0,
  A6: 0,
  AB: 0,
  SW: 0,
  FGP: 0,
  BGP: 100,
  FGZ: 1500,
  BGZ: 6000,
  BGS: 200,
  NFC: 5,
  GO: 47,
  // SR should not be here, it's a synth property
};

export const PHONEME_TARGETS = {
  // --- Vowels (Stressed '1') ---
  IY1: {
    F1: 310,
    F2: 2020,
    F3: 2960,
    B1: 45,
    B2: 200,
    B3: 400,
    AV: 63,
    dur: 150,
    type: "vowel",
    hi: true,
    front: true,
  },
  IH1: {
    F1: 400,
    F2: 1800,
    F3: 2570,
    B1: 50,
    B2: 100,
    B3: 140,
    AV: 62,
    dur: 100,
    type: "vowel",
    hi: true,
    front: true,
  },
  EY1: {
    F1: 480,
    F2: 1720,
    F3: 2520,
    B1: 70,
    B2: 100,
    B3: 200,
    AV: 63,
    dur: 160,
    type: "vowel",
    mid: true,
    front: true,
    diph: ["EH1", "IH1"],
  },
  EH1: {
    F1: 530,
    F2: 1680,
    F3: 2500,
    B1: 60,
    B2: 90,
    B3: 200,
    AV: 62,
    dur: 120,
    type: "vowel",
    mid: true,
    front: true,
  },
  AE1: {
    F1: 620,
    F2: 1660,
    F3: 2430,
    B1: 70,
    B2: 150,
    B3: 320,
    AV: 64,
    dur: 170,
    type: "vowel",
    low: true,
    front: true,
  },
  AA1: {
    F1: 700,
    F2: 1220,
    F3: 2600,
    B1: 130,
    B2: 70,
    B3: 160,
    AV: 64,
    dur: 180,
    type: "vowel",
    low: true,
    back: false,
  },
  AO1: {
    F1: 600,
    F2: 990,
    F3: 2570,
    B1: 90,
    B2: 100,
    B3: 80,
    AV: 63,
    dur: 160,
    type: "vowel",
    mid: true,
    back: true,
  },
  OW1: {
    F1: 540,
    F2: 1100,
    F3: 2300,
    B1: 80,
    B2: 70,
    B3: 70,
    AV: 63,
    dur: 170,
    type: "vowel",
    mid: true,
    back: true,
    diph: ["AO1", "UH1"],
  },
  UH1: {
    F1: 350,
    F2: 1250,
    F3: 2200,
    B1: 65,
    B2: 110,
    B3: 140,
    AV: 62,
    dur: 110,
    type: "vowel",
    hi: true,
    back: true,
  },
  UW1: {
    F1: 320,
    F2: 900,
    F3: 2200,
    B1: 65,
    B2: 110,
    B3: 140,
    AV: 63,
    dur: 180,
    type: "vowel",
    hi: true,
    back: true,
  },
  AH1: {
    F1: 620,
    F2: 1220,
    F3: 2550,
    B1: 80,
    B2: 50,
    B3: 140,
    AV: 62,
    dur: 100,
    type: "vowel",
    mid: true,
    central: true,
  },
  ER1: {
    F1: 470,
    F2: 1270,
    F3: 1540,
    B1: 100,
    B2: 60,
    B3: 110,
    AV: 63,
    dur: 160,
    type: "vowel",
    mid: true,
    central: true,
    rhotic: true,
  },
  AY1: {
    F1: 660,
    F2: 1200,
    F3: 2550,
    B1: 100,
    B2: 70,
    B3: 200,
    AV: 64,
    dur: 180,
    type: "vowel",
    low: true,
    diph: ["AA1", "IH1"],
  },
  AW1: {
    F1: 640,
    F2: 1230,
    F3: 2550,
    B1: 80,
    B2: 70,
    B3: 140,
    AV: 64,
    dur: 190,
    type: "vowel",
    low: true,
    diph: ["AE1", "UH1"],
  },
  OY1: {
    F1: 550,
    F2: 960,
    F3: 2400,
    B1: 80,
    B2: 50,
    B3: 130,
    AV: 63,
    dur: 170,
    type: "vowel",
    mid: true,
    back: true,
    diph: ["AO1", "IH1"],
  },
  // --- Vowels (Unstressed '0') ---
  IY0: {
    F1: 330,
    F2: 1950,
    F3: 2900,
    B1: 50,
    B2: 220,
    B3: 450,
    AV: 58,
    dur: 70,
    type: "vowel",
    hi: true,
    front: true,
  },
  IH0: {
    F1: 420,
    F2: 1750,
    F3: 2600,
    B1: 55,
    B2: 120,
    B3: 160,
    AV: 57,
    dur: 60,
    type: "vowel",
    hi: true,
    front: true,
  },
  EY0: {
    F1: 500,
    F2: 1700,
    F3: 2550,
    B1: 75,
    B2: 110,
    B3: 220,
    AV: 58,
    dur: 70,
    type: "vowel",
    mid: true,
    front: true,
    diph: ["EH0", "IH0"],
  },
  EH0: {
    F1: 550,
    F2: 1650,
    F3: 2520,
    B1: 65,
    B2: 100,
    B3: 220,
    AV: 57,
    dur: 65,
    type: "vowel",
    mid: true,
    front: true,
  },
  AE0: {
    F1: 640,
    F2: 1600,
    F3: 2450,
    B1: 75,
    B2: 160,
    B3: 350,
    AV: 59,
    dur: 75,
    type: "vowel",
    low: true,
    front: true,
  },
  AA0: {
    F1: 680,
    F2: 1250,
    F3: 2600,
    B1: 140,
    B2: 80,
    B3: 180,
    AV: 59,
    dur: 80,
    type: "vowel",
    low: true,
    back: false,
  },
  AO0: {
    F1: 620,
    F2: 1020,
    F3: 2580,
    B1: 95,
    B2: 110,
    B3: 100,
    AV: 58,
    dur: 70,
    type: "vowel",
    mid: true,
    back: true,
  },
  OW0: {
    F1: 560,
    F2: 1120,
    F3: 2320,
    B1: 85,
    B2: 80,
    B3: 90,
    AV: 58,
    dur: 80,
    type: "vowel",
    mid: true,
    back: true,
    diph: ["AO0", "UH0"],
  },
  UH0: {
    F1: 370,
    F2: 1280,
    F3: 2250,
    B1: 70,
    B2: 120,
    B3: 160,
    AV: 57,
    dur: 60,
    type: "vowel",
    hi: true,
    back: true,
  },
  UW0: {
    F1: 340,
    F2: 950,
    F3: 2250,
    B1: 70,
    B2: 120,
    B3: 160,
    AV: 58,
    dur: 80,
    type: "vowel",
    hi: true,
    back: true,
  },
  AH0: {
    F1: 640,
    F2: 1240,
    F3: 2580,
    B1: 85,
    B2: 60,
    B3: 160,
    AV: 57,
    dur: 50,
    type: "vowel",
    mid: true,
    central: true,
  },
  ER0: {
    F1: 490,
    F2: 1300,
    F3: 1600,
    B1: 110,
    B2: 70,
    B3: 130,
    AV: 58,
    dur: 70,
    type: "vowel",
    mid: true,
    central: true,
    rhotic: true,
  },
  // --- Fricatives ---
  S: {
    F1: 320,
    F2: 1390,
    F3: 2530,
    B1: 200,
    B2: 80,
    B3: 200,
    AV: 0,
    AF: 65,
    AH: 0,
    AVS: 0,
    A5: 52,
    A6: 55,
    dur: 100,
    type: "fricative",
    voiceless: true,
    alveolar: true,
  },
  Z: {
    F1: 240,
    F2: 1390,
    F3: 2530,
    B1: 70,
    B2: 60,
    B3: 180,
    AV: 47,
    AF: 55,
    AH: 0,
    AVS: 47,
    A5: 52,
    A6: 52,
    dur: 90,
    type: "fricative",
    voiced: true,
    alveolar: true,
  },
  SH: {
    F1: 300,
    F2: 1840,
    F3: 2750,
    B1: 200,
    B2: 100,
    B3: 300,
    AV: 0,
    AF: 63,
    AH: 0,
    AVS: 0,
    A3: 57,
    A4: 48,
    A5: 48,
    A6: 46,
    dur: 100,
    type: "fricative",
    voiceless: true,
    postalveolar: true,
  },
  ZH: {
    F1: 260,
    F2: 1800,
    F3: 2820,
    B1: 60,
    B2: 80,
    B3: 270,
    AV: 47,
    AF: 53,
    AH: 0,
    AVS: 47,
    A3: 44,
    A4: 60,
    A5: 53,
    A6: 53,
    dur: 90,
    type: "fricative",
    voiced: true,
    postalveolar: true,
  },
  F: {
    F1: 340,
    F2: 1100,
    F3: 2080,
    B1: 200,
    B2: 120,
    B3: 150,
    AV: 0,
    AF: 58,
    AH: 0,
    AVS: 0,
    AB: 57,
    dur: 90,
    type: "fricative",
    voiceless: true,
    labiodental: true,
  },
  V: {
    F1: 220,
    F2: 1100,
    F3: 2080,
    B1: 60,
    B2: 90,
    B3: 120,
    AV: 47,
    AF: 48,
    AH: 0,
    AVS: 47,
    AB: 57,
    dur: 80,
    type: "fricative",
    voiced: true,
    labiodental: true,
  },
  TH: {
    F1: 320,
    F2: 1290,
    F3: 2540,
    B1: 200,
    B2: 90,
    B3: 200,
    AV: 0,
    AF: 52,
    AH: 0,
    AVS: 0,
    A5: 28,
    A6: 48,
    dur: 80,
    type: "fricative",
    voiceless: true,
    dental: true,
  },
  DH: {
    F1: 270,
    F2: 1290,
    F3: 2540,
    B1: 60,
    B2: 80,
    B3: 170,
    AV: 47,
    AF: 42,
    AH: 0,
    AVS: 47,
    A5: 28,
    A6: 48,
    dur: 70,
    type: "fricative",
    voiced: true,
    dental: true,
  },
  HH: {
    F1: 600,
    F2: 1400,
    F3: 2500,
    B1: 300,
    B2: 300,
    B3: 300,
    AV: 0,
    AF: 0,
    AH: 55,
    AVS: 0,
    dur: 80,
    type: "fricative",
    voiceless: true,
    glottal: true,
  },
  // --- Nasals ---
  M: {
    F1: 250,
    F2: 1100,
    F3: 2500,
    B1: 300,
    B2: 100,
    B3: 150,
    AV: 58,
    FNP: 270,
    FNZ: 480,
    AN: 60,
    dur: 80,
    type: "nasal",
    voiced: true,
    bilabial: true,
  },
  N: {
    F1: 250,
    F2: 1400,
    F3: 2600,
    B1: 300,
    B2: 100,
    B3: 150,
    AV: 58,
    FNP: 270,
    FNZ: 480,
    AN: 60,
    dur: 70,
    type: "nasal",
    voiced: true,
    alveolar: true,
  },
  NG: {
    F1: 250,
    F2: 1700,
    F3: 2800,
    B1: 300,
    B2: 100,
    B3: 150,
    AV: 58,
    FNP: 270,
    FNZ: 480,
    AN: 60,
    dur: 90,
    type: "nasal",
    voiced: true,
    velar: true,
  },
  // --- Liquids & Glides ---
  L: {
    F1: 310,
    F2: 1050,
    F3: 2880,
    B1: 50,
    B2: 100,
    B3: 280,
    AV: 59,
    dur: 80,
    type: "liquid",
    voiced: true,
    alveolar: true,
  },
  R: {
    F1: 310,
    F2: 1060,
    F3: 1380,
    B1: 70,
    B2: 100,
    B3: 120,
    AV: 59,
    dur: 90,
    type: "liquid",
    voiced: true,
    rhotic: true,
  },
  W: {
    F1: 290,
    F2: 610,
    F3: 2150,
    B1: 50,
    B2: 80,
    B3: 60,
    AV: 59,
    dur: 80,
    type: "glide",
    voiced: true,
    labiovelar: true,
  },
  Y: {
    F1: 260,
    F2: 2070,
    F3: 3020,
    B1: 40,
    B2: 250,
    B3: 500,
    AV: 59,
    dur: 80,
    type: "glide",
    voiced: true,
    palatal: true,
  },
  // --- Stops Closures ---
  P_CL: {
    F1: 200,
    F2: 800,
    F3: 2400,
    B1: 80,
    B2: 100,
    B3: 150,
    AV: 0,
    dur: 50,
    type: "stop_closure",
    voiceless: true,
    bilabial: true,
  },
  T_CL: {
    F1: 200,
    F2: 1800,
    F3: 2700,
    B1: 80,
    B2: 100,
    B3: 150,
    AV: 0,
    dur: 40,
    type: "stop_closure",
    voiceless: true,
    alveolar: true,
  },
  K_CL: {
    F1: 200,
    F2: 1500,
    F3: 2800,
    B1: 80,
    B2: 100,
    B3: 150,
    AV: 0,
    dur: 60,
    type: "stop_closure",
    voiceless: true,
    velar: true,
  },
  B_CL: {
    F1: 200,
    F2: 800,
    F3: 2400,
    B1: 60,
    B2: 110,
    B3: 130,
    AV: 20,
    AVS: 20,
    dur: 45,
    type: "stop_closure",
    voiced: true,
    bilabial: true,
  },
  D_CL: {
    F1: 200,
    F2: 1800,
    F3: 2700,
    B1: 60,
    B2: 100,
    B3: 170,
    AV: 20,
    AVS: 20,
    dur: 35,
    type: "stop_closure",
    voiced: true,
    alveolar: true,
  },
  G_CL: {
    F1: 200,
    F2: 1500,
    F3: 2800,
    B1: 60,
    B2: 150,
    B3: 280,
    AV: 20,
    AVS: 20,
    dur: 55,
    type: "stop_closure",
    voiced: true,
    velar: true,
  },
  // --- Stop Releases ---
  P_REL: {
    F1: 400,
    F2: 1100,
    F3: 2150,
    B1: 300,
    B2: 150,
    B3: 220,
    AF: 65,
    AH: 45,
    AB: 63,
    dur: 50,
    type: "stop_release",
    voiceless: true,
  },
  T_REL: {
    F1: 400,
    F2: 1600,
    F3: 2600,
    B1: 300,
    B2: 120,
    B3: 250,
    AF: 70, // Frication burst
    AH: 50, // Aspiration
    A3: 30, // Higher formants active
    A4: 45,
    A5: 57,
    A6: 63,
    dur: 50,
    type: "stop_release",
    voiceless: true,
  },
  K_REL: {
    F1: 300,
    F2: 1990,
    F3: 2850,
    B1: 250,
    B2: 160,
    B3: 330,
    AF: 68,
    AH: 48,
    A3: 53,
    A4: 43,
    A5: 45,
    A6: 45,
    dur: 60,
    type: "stop_release",
    voiceless: true,
  },
  B_REL: {
    F1: 200,
    F2: 1100,
    F3: 2150,
    B1: 60,
    B2: 110,
    B3: 130,
    AV: 40,
    AF: 30,
    AVS: 40,
    AB: 63,
    dur: 20,
    type: "stop_release",
    voiced: true,
  },
  D_REL: {
    F1: 200,
    F2: 1600,
    F3: 2600,
    B1: 60,
    B2: 100,
    B3: 170,
    AV: 40,
    AF: 35,
    AVS: 40,
    A3: 47,
    A4: 60,
    A5: 62,
    A6: 60,
    dur: 20,
    type: "stop_release",
    voiced: true,
  },
  G_REL: {
    F1: 200,
    F2: 1990,
    F3: 2850,
    B1: 60,
    B2: 150,
    B3: 280,
    AV: 40,
    AF: 33,
    AVS: 40,
    A3: 53,
    A4: 43,
    A5: 45,
    A6: 45,
    dur: 25,
    type: "stop_release",
    voiced: true,
  },
  // --- Affricates ---
  CH: {
    F1: 300,
    F2: 1840,
    F3: 2750,
    B1: 200,
    B2: 100,
    B3: 300,
    AV: 0,
    AF: 68,
    AH: 0,
    AVS: 0,
    A3: 57,
    A4: 48,
    A5: 48,
    A6: 46,
    dur: 70,
    type: "affricate",
    voiceless: true,
    postalveolar: true,
  },
  JH: {
    F1: 260,
    F2: 1800,
    F3: 2820,
    B1: 60,
    B2: 80,
    B3: 270,
    AV: 47,
    AF: 58,
    AH: 0,
    AVS: 47,
    A3: 44,
    A4: 60,
    A5: 53,
    A6: 53,
    dur: 65,
    type: "affricate",
    voiced: true,
    postalveolar: true,
  },
  // *** ADD AFFRICATE CH *** (Model as stop release + fricative-like spectrum)
  'CH': { F1: 300, F2: 1840, F3: 2750, B1: 200, B2: 100, B3: 300, B4: 300, B5: 250, B6: 1000, AV: 0, AF: 68, AH: 0, AVS: 0, FNP:0, FNZ:0, A2: 0, A3: 57, A4: 48, A5: 48, A6: 46, AB: 0, dur: 70, type: 'affricate', voiceless: true, postalveolar: true },
  // Need voiced affricate 'JH' (as in 'judge') too? Often T+ZH or D+ZH.
  // Add basic JH based on ZH
  'JH': { F1: 260, F2: 1800, F3: 2820, B1: 60, B2: 80, B3: 270, B4: 300, B5: 250, B6: 1000, AV: 47, AF: 58, AH: 0, AVS: 47, FNP:0, FNZ:0, A2: 0, A3: 44, A4: 60, A5: 53, A6: 53, AB: 0, dur: 65, type: 'affricate', voiced: true, postalveolar: true },
  // --- Silence ---
  SIL: {
    F1: 500,
    F2: 1500,
    F3: 2500,
    B1: 100,
    B2: 100,
    B3: 100,
    AV: 0,
    AF: 0,
    AH: 0,
    AVS: 0,
    F0: 0,
    dur: 100,
    type: "silence",
  },
};

// --- Rule Functions ---
export function fillDefaultParams(target) {
  // Start with the target's parameters, or an empty object if no target
  const filled = target ? { ...target } : {};

  // Fill in any missing parameters from BASE_PARAMS
  for (const key in BASE_PARAMS) {
    if (!filled.hasOwnProperty(key)) { // If the key wasn't in the target
      filled[key] = BASE_PARAMS[key]; // Add the default value
    }
    // Ensure the value is a valid number, otherwise use default (handles potential undefined/null in target)
    else if (typeof filled[key] !== 'number' || !isFinite(filled[key])) {
        console.warn(`[fillDefaultParams] Invalid value '${filled[key]}' for key '${key}' in target. Using default: ${BASE_PARAMS[key]}`);
        filled[key] = BASE_PARAMS[key];
    }
  }

  // Ensure all BASE_PARAMS keys are present (handles cases where target might have extra keys)
  // This loop might be slightly redundant now but ensures completeness.
  for (const key in BASE_PARAMS) {
      if (!filled.hasOwnProperty(key)) {
          filled[key] = BASE_PARAMS[key];
      }
  }


  // If no target was provided initially, ensure it looks like silence
  if (!target) {
    filled.AV = 0;
    filled.AF = 0;
    filled.AH = 0;
    filled.AVS = 0;
    filled.F0 = 0;
  }

  return filled;
}
export function rule_K_Context(phonemeList) {
  /* ... same ... */
  for (let i = 0; i < phonemeList.length; i++) {
    if (!phonemeList[i].params) continue; // Ensure params exist
    if (phonemeList[i].phoneme === "K_CL" && phonemeList[i + 1]?.phoneme) {
      const nextPhKey =
        phonemeList[i + 1].phoneme +
        (phonemeList[i + 1].stress !== null ? phonemeList[i + 1].stress : "0");
      const nextTargets =
        PHONEME_TARGETS[nextPhKey] ||
        PHONEME_TARGETS[phonemeList[i + 1].phoneme + "1"] ||
        PHONEME_TARGETS[phonemeList[i + 1].phoneme + "0"];
      if (nextTargets && nextTargets.type === "vowel") {
        if (nextTargets.front || nextTargets.hi)
          phonemeList[i].params.F2 = 1900;
        else if (nextTargets.back) phonemeList[i].params.F2 = 1200;
        else phonemeList[i].params.F2 = 1500;
      }
    }
    // Add context for K_REL too? If K_REL exists...
    if (
      phonemeList[i].phoneme === "K_REL" &&
      phonemeList[i - 1]?.phoneme === "K_CL"
    ) {
      // Copy the context-adjusted F2 from the preceding K_CL
      phonemeList[i].params.F2 = phonemeList[i - 1].params.F2 || 1500;
    }
  }
  return phonemeList;
}
export function rule_VowelShortening(phonemeList) {
  /* ... same ... */
  const SHORTENING_FACTOR = 0.7;
  const FRIC_SHORTENING = 0.85;
  const PREPAUSAL_LENGTHENING = 1.2;
  for (let i = 0; i < phonemeList.length; i++) {
    const current = phonemeList[i];
    if (!current || current.type !== "vowel") continue;
    const next = phonemeList[i + 1];
    if (next) {
      const nextTargetInfo =
        PHONEME_TARGETS[next.phoneme + "1"] ||
        PHONEME_TARGETS[next.phoneme + "0"] ||
        PHONEME_TARGETS[next.phoneme];
      if (nextTargetInfo) {
        if (nextTargetInfo.type?.includes("stop") && nextTargetInfo.voiceless)
          current.duration = Math.round(current.duration * SHORTENING_FACTOR);
        else if (
          nextTargetInfo.type === "fricative" &&
          nextTargetInfo.voiceless
        )
          current.duration = Math.round(current.duration * FRIC_SHORTENING);
        else if (next.phoneme === "SIL")
          current.duration = Math.round(
            current.duration * PREPAUSAL_LENGTHENING
          );
      }
    } else {
      current.duration = Math.round(current.duration * PREPAUSAL_LENGTHENING);
    }
  }
  return phonemeList;
}
export function rule_StressDuration(phonemeList) {
  /* ... same ... */
  const STRESS_FACTOR = 1.3;
  const UNSTRESSED_FACTOR = 0.8;
  for (let i = 0; i < phonemeList.length; i++) {
    const ph = phonemeList[i];
    if (ph.type === "vowel") {
      if (ph.stress === 1)
        ph.duration = Math.round(ph.duration * STRESS_FACTOR);
      else if (ph.stress === 0)
        ph.duration = Math.round(ph.duration * UNSTRESSED_FACTOR);
    }
    ph.duration = Math.max(20, ph.duration || 20);
  } // Ensure min duration
  return phonemeList;
}
export function rule_GenerateF0Contour(
  phonemeList,
  baseF0 = 110,
  fallRate = 20,
  stressRise = 1.15,
  questionRiseHz = 30
) {
  /* ... same ... */
  const f0Contour = [];
  let currentTime = 0;
  let currentF0 = baseF0;
  const totalDuration =
    phonemeList.reduce((sum, ph) => sum + Math.max(20, ph.duration || 100), 0) /
    1000.0;
  if (totalDuration === 0) return [{ time: 0, f0: 0 }];
  let finalRise = false;
  for (let i = phonemeList.length - 1; i >= 0; i--) {
    if (
      phonemeList[i].phoneme === "SIL" &&
      phonemeList[i].punctuationSymbol === "?"
    ) {
      finalRise = true;
      break;
    }
    if (phonemeList[i].phoneme !== "SIL") break;
  }
  f0Contour.push({ time: 0, f0: baseF0 });
  for (let i = 0; i < phonemeList.length; i++) {
    const ph = phonemeList[i];
    const phDuration = Math.max(20, ph.duration || 100) / 1000.0;
    const endTime = currentTime + phDuration;
    let targetF0 =
      baseF0 * (1.0 - (fallRate / baseF0) * (endTime / totalDuration));
    let peakTime = -1,
      peakF0 = -1;
    if (ph.stress === 1 && ph.type === "vowel") {
      peakTime = currentTime + phDuration * 0.4;
      peakF0 = currentF0 * stressRise;
      f0Contour.push({ time: peakTime, f0: peakF0 });
      targetF0 =
        baseF0 * (1.0 - (fallRate / baseF0) * (endTime / totalDuration));
    }
    const f0Factor = ph.params?.F0_Factor || 1.0;
    targetF0 *= f0Factor;
    if (
      finalRise &&
      (i === phonemeList.length - 1 ||
        (i === phonemeList.length - 2 && phonemeList[i + 1]?.phoneme === "SIL"))
    ) {
      targetF0 =
        (f0Contour[f0Contour.length - 1]?.f0 || baseF0) + questionRiseHz;
    }
    targetF0 = Math.max(targetF0, baseF0 * 0.6);
    const isVoicedTarget = ph.params?.AV > 0 || ph.params?.AVS > 0;
    f0Contour.push({ time: endTime, f0: isVoicedTarget ? targetF0 : 0 });
    currentF0 = isVoicedTarget
      ? targetF0
      : baseF0 * (1.0 - (fallRate / baseF0) * (endTime / totalDuration));
    currentTime = endTime;
  }
  const cleanedContour = [];
  if (f0Contour.length > 0) cleanedContour.push(f0Contour[0]);
  for (let i = 1; i < f0Contour.length; i++) {
    if (f0Contour[i].f0 !== f0Contour[i - 1].f0 || f0Contour[i].f0 !== 0) {
      if (
        !cleanedContour.length ||
        f0Contour[i].time >
          cleanedContour[cleanedContour.length - 1].time + 0.001
      ) {
        cleanedContour.push(f0Contour[i]);
      } else {
        cleanedContour[cleanedContour.length - 1].f0 = f0Contour[i].f0;
      }
    } else if (
      cleanedContour.length > 0 &&
      cleanedContour[cleanedContour.length - 1].f0 !== 0
    ) {
      cleanedContour.push(f0Contour[i]);
    }
  }
  if (cleanedContour.length === 0 && f0Contour.length > 0)
    cleanedContour.push(f0Contour[f0Contour.length - 1]);
  return cleanedContour;
}
