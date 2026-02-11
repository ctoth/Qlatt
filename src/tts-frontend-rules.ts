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
  AVS: -70,
  F0: 0,
  lfMode: 1,
  // Klatt 80 defaults: when FNZ=FNP and BNZ=BNP, zero/pole cancel → passthrough
  // Non-nasal sounds need this so cascade signal flows through NZ/NP unchanged
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
  // SR removed - determined by AudioContext
};

export const PHONEME_TARGETS = {
  // --- Vowels (Stressed '1') ---
  // Vowel formant targets based on Peterson & Barney (1952) male speaker averages
  // "Control Methods Used in a Study of the Vowels", JASA 24(2):175-184
  // See also: Hillenbrand et al. (1995) for modern replication
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
    F1: 440,
    F2: 1020,
    F3: 2240,
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
  // F3 for American English /r/: Espy-Wilson et al. (2000)
  // "Acoustic Modeling of American English /r/", JASA 108(1):343-356
  // Measured range: 1300-1950 Hz (male speakers)
  ER1: {
    F1: 470,
    F2: 1200,
    F3: 1800,  // Raised from 1540 - less extreme r-coloring for clarity
    B1: 100,
    B2: 80,
    B3: 150,   // Wider bandwidth for smoother transitions
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
    F2: 1250,
    F3: 1850,  // Raised from 1600 to match ER1 adjustment
    B1: 110,
    B2: 80,
    B3: 150,   // Wider bandwidth for smoother transitions
    AV: 58,
    dur: 70,
    type: "vowel",
    mid: true,
    central: true,
    rhotic: true,
  },
  // --- Fricatives ---
  // Fricative amplitude hierarchy: Jongman et al. (2000) JASA 108(3):1252-1263
  // Normalized amplitude relative to vowel:
  //   Sibilants: /s,z/ = -10 dB, /sh,zh/ = -9 dB
  //   Non-sibilants: /f,v/ = -17 dB, /th,dh/ = -18 dB
  // Sibilants are 10-15 dB louder than non-sibilants
  // Spectral peaks: /f,v/ ~7.7kHz, /th,dh/ ~7.5kHz, /s,z/ ~6.8kHz, /sh,zh/ ~3.8kHz
  //
  // Shadle (1985) MIT PhD Thesis - Three-class fricative model:
  //   Class 1 (sibilants /s,sh/): Obstacle-generated (teeth), highest amplitude
  //   Class 3 (non-sibilants /f,th/): Surface-generated, lowest amplitude
  // /sh/ is loudest fricative (~6 dB above /s/) due to longer front cavity
  //
  // AF values adjusted per research: non-sibilants -12 dB, SH/ZH +6 dB vs S/Z
  S: {
    F1: 320,
    F2: 1390,
    F3: 2530,
    B1: 200,
    B2: 80,
    B3: 200,
    AV: 0,
    AF: 60,
    AH: 0,
    AVS: -70,
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
    AF: 50,
    AH: 0,
    AVS: 47,
    A5: 52,
    A6: 52,
    dur: 90,
    type: "fricative",
    voiced: true,
    alveolar: true,
  },
  // AF per Jongman (2000): sibilants 10-15 dB louder than non-sibilants
  // SH/ZH +6 dB vs S/Z per Shadle (1985)
  SH: {
    F1: 300,
    F2: 1840,
    F3: 2750,
    B1: 200,
    B2: 100,
    B3: 300,
    AV: 0,
    AF: 66,  // +6 dB vs S per Shadle (1985)
    AH: 0,
    AVS: -70,
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
    AF: 56,  // +6 dB vs Z per Shadle (1985)
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
  // Non-sibilants: 12 dB below sibilants per Jongman (2000)
  // Labiodentals /f,v/: spectral peak ~7.7 kHz, high variance (diffuse spectrum)
  // Shadle (1985): Class 3 fricative, "-3 to -6 dB/oct slope", "two broad peaks"
  // A values added per investigation: investigations/f-formants.md
  F: {
    F1: 340,
    F2: 1100,
    F3: 2080,
    B1: 200,
    B2: 120,
    B3: 150,
    AV: 0,
    AF: 48,  // -12 dB vs S per Jongman (2000)
    AH: 0,
    AVS: -70,
    // Parallel formant amplitudes for spectral shaping
    // Shadle (1985): /f/ has "two broad peaks" - needs mid-freq content
    // Jongman (2000): spectral peak ~7.7 kHz, -17 dB normalized amplitude
    // Behrens & Blumstein (1988): spectral shape is primary cue for fricative place
    A3: 40,   // Shadle 1985: mid-freq content for broad peaks
    A4: 45,   // Transition to high frequencies
    A5: 48,   // Jongman 2000: spectral peak ~7.7 kHz for labiodentals
    A6: 55,   // Highest frequency emphasis near peak
    AB: 55,   // Reduced to let formants compete with bypass
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
    AF: 38,  // -12 dB vs Z per Jongman (2000)
    AH: 0,
    AVS: 47,
    // Parallel formant amplitudes for spectral shaping (voiced counterpart of F)
    // Shadle (1985): same spectral shape as F
    // Jongman (2000): spectral peak ~7.7 kHz for labiodentals
    // Behrens & Blumstein (1988): spectral shape is primary cue for fricative place
    A3: 40,   // Same spectral shape as F
    A4: 45,
    A5: 48,
    A6: 55,
    AB: 55,   // Reduced to let formants compete with bypass
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
    AF: 48,  // -12 dB vs S per Jongman (2000)
    AH: 0,
    AVS: -70,
    A5: 28,
    A6: 48,
    AB: 48,  // Klatt 1980: bypass for broadband frication noise
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
    AF: 38,  // -12 dB vs Z per Jongman (2000)
    AH: 0,
    AVS: 47,
    A5: 28,
    A6: 48,
    AB: 48,  // Klatt 1980: bypass for broadband frication noise
    dur: 70,
    type: "fricative",
    voiced: true,
    dental: true,
  },
  // /h/ aspiration: Klatt 80 COEWAV.FOR lines 160-178 routes AH→UGLOT→cascade
  // Klatt 1980 paper Table: "AH...Sent to cascade branch"
  // B1 widened per Klatt 1980 "B1 to ~300 Hz for aspiration"; Stevens 1998: ~280 Hz
  HH: {
    F1: 500,
    F2: 1500,
    F3: 2500,
    B1: 300,
    B2: 90,
    B3: 150,
    AV: 0,
    AH: 40,     // Aspiration source - routed through cascade per Klatt 80
    AF: 0,
    AVS: -70,
    SW: 0,      // CASCADE MODE - Klatt 80 COEWAV.FOR lines 160-178: aspiration→UGLOT→cascade
    // A1-A6 removed - cascade branch naturally filters aspiration through formants
    dur: 80,
    type: "fricative",
    voiceless: true,
    glottal: true,
  },
  // --- Nasals ---
  // Nasal pole/zero: Hawkins & Stevens (1985) "Acoustic and perceptual correlates
  // of the non-nasal-nasal distinction for vowels", JASA 77(4):1560-1575
  // BNP = BNZ = 100 Hz matches paper recommendations
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
    BNP: 100,
    BNZ: 100,
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
    BNP: 100,
    BNZ: 100,
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
    BNP: 100,
    BNZ: 100,
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
    F3: 2600,  // Lowered from 2880 to Klatt 80 baseline
    B1: 50,
    B2: 100,
    B3: 200,   // Tighter bandwidth
    AV: 59,
    dur: 80,
    type: "liquid",
    voiced: true,
    alveolar: true,
  },
  // F3 for American English /r/: Espy-Wilson et al. (2000)
  // "Acoustic Modeling of American English /r/", JASA 108(1):343-356
  // Measured range: 1300-1950 Hz (male speakers)
  R: {
    F1: 310,
    F2: 1060,
    F3: 1700,  // Raised from 1380 for less extreme r-coloring
    B1: 70,
    B2: 100,
    B3: 150,   // Wider for smoother transitions
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
    B1: 300,  // Klatt 1980: wide B1 during sealed closure
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
    B1: 300,  // Klatt 1980: wide B1 during sealed closure
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
    B1: 300,  // Klatt 1980: wide B1 during sealed closure
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
    B1: 300,  // Klatt 1980: wide B1 during sealed closure
    B2: 110,
    B3: 130,
    AV: 47,   // Voice bar during voiced stop closure (Klatt 1980: ~47-50 dB)
    AVS: -70,
    dur: 45,
    type: "stop_closure",
    voiced: true,
    bilabial: true,
  },
  D_CL: {
    F1: 200,
    F2: 1800,
    F3: 2700,
    B1: 300,  // Klatt 1980: wide B1 during sealed closure
    B2: 100,
    B3: 170,
    AV: 47,   // Voice bar during voiced stop closure (Klatt 1980: ~47-50 dB)
    AVS: -70,
    dur: 35,
    type: "stop_closure",
    voiced: true,
    alveolar: true,
  },
  G_CL: {
    F1: 200,
    F2: 1500,
    F3: 2800,
    B1: 300,  // Klatt 1980: wide B1 during sealed closure
    B2: 150,
    B3: 280,
    AV: 47,   // Voice bar during voiced stop closure (Klatt 1980: ~47-50 dB)
    AVS: -70,
    dur: 55,
    type: "stop_closure",
    voiced: true,
    velar: true,
  },
  // --- Stop Releases ---
  // Burst spectral shapes based on Blumstein & Stevens (1979) acoustic invariance:
  //   - Labials: Diffuse-falling/flat spectrum via bypass (AB)
  //   - Alveolars: Diffuse-rising spectrum (A3 < A4 < A5 < A6)
  //   - Velars: Compact midfrequency peak (A3 dominant)
  // Amplitude values from Klatt (1980) Table III
  // Durations from Allen et al. (1987) MITalk Table C-7
  // Zue (1976): labial bursts 12 dB weaker than alveolar/velar
  //
  // Voiceless stops: burst only (aspiration is separate phase)
  //
  // Labials: flat burst via bypass - no spectral peak (Zue 1976)
  // Blumstein & Stevens (1979): "diffuse-falling" template
  P_REL: {
    F1: 400,
    F2: 1100,
    F3: 2150,
    B1: 300,
    B2: 150,
    B3: 220,
    AF: 55,   // Raised for audible burst (was 15)
    AH: 52,   // Aspiration component (was 30)
    AB: 63,   // Labials use bypass (Table III)
    SW: 1,    // Parallel mode for burst spectral shaping via A3-A6
    dur: 5,   // MITalk Table C-7: PP = 5ms burst
    type: "stop_release",
    voiceless: true,
    bilabial: true,
  },
  // Alveolars: diffuse-rising spectrum - energy increases with frequency
  // Blumstein & Stevens (1979): peak above 2200 Hz
  // Zue (1976): burst peak ~3500-4000 Hz
  T_REL: {
    F1: 400,
    F2: 1600,
    F3: 2600,
    B1: 300,
    B2: 120,
    B3: 250,
    AF: 58,   // Alveolars have strongest burst (was 20)
    AH: 55,   // Aspiration (was 35)
    A3: 30,   // Table III: rising pattern A3 < A4 < A5 < A6
    A4: 45,
    A5: 57,
    A6: 63,
    AB: 0,    // Alveolars don't use bypass
    SW: 1,    // Parallel mode for burst spectral shaping via A3-A6
    dur: 15,  // MITalk Table C-7: TT = 15ms burst
    type: "stop_release",
    voiceless: true,
    alveolar: true,
  },
  // Velars: compact spectrum - prominent midfrequency peak
  // Blumstein & Stevens (1979): single peak in 1200-3500 Hz range
  // Zue (1976): vowel-dependent (front: ~2700 Hz, back: ~1200-1800 Hz)
  // F2 adjusted by declarative rulepack k_context_cl_f2/k_context_rel_copy
  K_REL: {
    F1: 300,
    F2: 1990,
    F3: 2850,
    B1: 250,
    B2: 160,
    B3: 330,
    AF: 55,   // Raised for audible burst (was 18)
    AH: 53,   // Aspiration (was 33)
    A3: 53,   // Table III: compact pattern with A3 dominant
    A4: 43,
    A5: 45,
    A6: 45,
    AB: 0,    // Velars don't use bypass
    SW: 1,    // Parallel mode for burst spectral shaping via A3-A6
    dur: 25,  // MITalk Table C-7: KK = 25ms burst
    type: "stop_release",
    voiceless: true,
    velar: true,
  },
  // Voiced stops: Table III A2=0 for burst spectrum, A1 for voicing F1
  // Same spectral templates as voiceless counterparts
  //
  // Labials: flat burst via bypass (Blumstein & Stevens 1979: diffuse-falling)
  B_REL: {
    F1: 200,
    F2: 1100,
    F3: 2150,
    B1: 60,
    B2: 110,
    B3: 130,
    AV: 47,   // Voicing onset (was 40)
    AF: 52,   // Burst component (was 50)
    AVS: -70,   // Stops use AV only (Table III does not specify AVS)
    // Table III: A2=0 for burst, A1 needed for voicing resonance
    A1: 60,
    A2: 0,    // Table III: A2=0 for all plosive bursts
    AB: 63,   // Labials: flat burst via bypass
    SW: 1,    // Parallel mode for burst spectral shaping via A3-A6
    dur: 5,   // MITalk Table C-7: BB = 5ms burst
    type: "stop_release",
    voiced: true,
    bilabial: true,
  },
  // Alveolars: diffuse-rising spectrum (Blumstein & Stevens 1979)
  // Zue (1976): /d/ burst ~200-300 Hz lower than /t/
  D_REL: {
    F1: 200,
    F2: 1600,
    F3: 2600,
    B1: 60,
    B2: 100,
    B3: 170,
    AV: 47,   // Voicing onset (was 40)
    AF: 50,   // Burst component
    AVS: -70,   // Stops use AV only (Table III does not specify AVS)
    // Table III: A2=0 for burst, A1 for voicing, A3-A6 for dental burst
    A1: 58,
    A2: 0,    // Table III: A2=0 for all plosive bursts
    A3: 47,   // Table III voiced dental values
    A4: 60,
    A5: 62,
    A6: 60,
    SW: 1,    // Parallel mode for burst spectral shaping via A3-A6
    dur: 10,  // MITalk Table C-7: DD = 10ms burst
    type: "stop_release",
    voiced: true,
    alveolar: true,
  },
  // Velars: compact spectrum (Blumstein & Stevens 1979)
  // F2 adjusted by declarative rulepack k_context_cl_f2/k_context_rel_copy
  G_REL: {
    F1: 200,
    F2: 1990,
    F3: 2850,
    B1: 60,
    B2: 150,
    B3: 280,
    AV: 47,   // Voicing onset (was 40)
    AF: 50,   // Burst component
    AVS: -70,   // Stops use AV only (Table III does not specify AVS)
    // Table III: A2=0 for burst, A1 for voicing, A3-A6 for velar burst
    A1: 58,
    A2: 0,    // Table III: A2=0 for all plosive bursts
    A3: 53,   // Table III voiced velar values
    A4: 43,
    A5: 45,
    A6: 45,
    SW: 1,    // Parallel mode for burst spectral shaping via A3-A6
    dur: 20,  // MITalk Table C-7: GG = 20ms burst
    type: "stop_release",
    voiced: true,
    velar: true,
  },
  // --- Stop Aspiration Phases ---
  // Voiceless stops have distinct burst (frication) and aspiration phases.
  // Aspiration follows burst - breathy noise shaped by vocal tract.
  // Durations from Zue 1976 VOT minus burst duration.
  P_ASP: {
    F1: 400,
    F2: 1100,
    F3: 2150,
    B1: 200,
    B2: 150,
    B3: 220,
    AV: 0,
    AF: 0,
    AH: 52,   // Aspiration only
    AB: 63,   // Labials use bypass
    dur: 53,  // Zue: /p/ VOT ~58ms, minus 5ms burst = 53ms aspiration
    type: "stop_aspiration",
    voiceless: true,
    bilabial: true,
  },
  T_ASP: {
    F1: 400,
    F2: 1600,
    F3: 2600,
    B1: 200,
    B2: 120,
    B3: 250,
    AV: 0,
    AF: 0,
    AH: 55,   // Aspiration only
    A3: 30,   // Maintain formant structure
    A4: 45,
    A5: 57,
    A6: 63,
    dur: 56,  // Zue: /t/ VOT ~71ms, minus 15ms burst = 56ms aspiration
    type: "stop_aspiration",
    voiceless: true,
    alveolar: true,
  },
  K_ASP: {
    F1: 300,
    F2: 1990,
    F3: 2850,
    B1: 200,
    B2: 160,
    B3: 330,
    AV: 0,
    AF: 0,
    AH: 53,   // Aspiration only
    A3: 53,   // Maintain formant structure
    A4: 43,
    A5: 45,
    A6: 45,
    dur: 48,  // Zue: /k/ VOT ~73ms, minus 25ms burst = 48ms aspiration
    type: "stop_aspiration",
    voiceless: true,
    velar: true,
  },
  // --- Affricates ---
  CH: {
    F1: 300, F2: 1840, F3: 2750,
    B1: 200, B2: 100, B3: 300, B4: 300, B5: 250, B6: 1000,
    AV: 0, AF: 62, AH: 0, AVS: -70,  // Affricate - similar to SH (66) but slightly reduced
    // FNP/FNZ inherit from BASE_PARAMS (250/250) - zero/pole cancel for passthrough
    A2: 0, A3: 57, A4: 48, A5: 48, A6: 46, AB: 0,
    SW: 1,    // Parallel mode for burst spectral shaping via A3-A6
    dur: 70,
    type: "affricate",
    voiceless: true,
    postalveolar: true,
  },
  JH: {
    F1: 260, F2: 1800, F3: 2820,
    B1: 60, B2: 80, B3: 270, B4: 300, B5: 250, B6: 1000,
    AV: 47, AF: 52, AH: 0, AVS: 47,  // Affricate - similar to ZH (56) but slightly reduced
    // FNP/FNZ inherit from BASE_PARAMS (250/250) - zero/pole cancel for passthrough
    A2: 0, A3: 44, A4: 60, A5: 53, A6: 53, AB: 0,
    SW: 1,    // Parallel mode for burst spectral shaping via A3-A6
    dur: 65,
    type: "affricate",
    voiced: true,
    postalveolar: true,
  },
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
    AVS: -70,
    F0: 0,
    dur: 100,
    type: "silence",
  },
};

// --- Rule Functions ---
export function fillDefaultParams(target) {
  const filled = { ...BASE_PARAMS }; // Start with base defaults

  if (target) {
    // Override defaults with valid numeric values from the target
    for (const key in target) {
      // Only process keys that are also defined in BASE_PARAMS (i.e., valid Klatt params)
      if (BASE_PARAMS.hasOwnProperty(key) && target.hasOwnProperty(key)) {
        const targetValue = target[key];
        // Check if the target value is a valid number
        if (typeof targetValue === 'number' && isFinite(targetValue)) {
          filled[key] = targetValue; // Use the valid target value
        } else {
          // Log a warning if the target has an invalid value for a known Klatt param
          // Keep the default value from BASE_PARAMS in this case.
          console.warn(`[fillDefaultParams] Invalid value '${targetValue}' for key '${key}' in target. Using default: ${filled[key]}`);
        }
      }
      // Ignore keys in target that are not in BASE_PARAMS (e.g., 'type', 'voiced')
    }
  } else {
    // If no target provided, ensure it's silent
    filled.AV = 0;
    filled.AF = 0;
    filled.AH = 0;
    filled.AVS = -70;
    filled.F0 = 0;
  }

  return filled;
}
