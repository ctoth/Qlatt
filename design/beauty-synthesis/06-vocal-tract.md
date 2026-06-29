# 06 — The Vocal Tract / Formant Structure for a Beautiful Voice

Clean-room design axis: formant frequencies & bandwidths, higher formants (F4/F5/F6), the
singer's formant, nasality, and vocal-tract-length (VTL) scaling that makes a gorgeous male
voice vs a gorgeous female voice. This axis carries "rich / powerful / present" and gender
identity. Every number below is cited to a paper-folder `notes.md`.

---

## 1. FORMANT STRUCTURE FOR BEAUTY

### How many formants we actually need

**Minimum: F1–F5. Target: F1–F6.** This is not negotiable for a "rich" voice.

- The neutral (schwa) tube of length 17.6 cm puts resonances at F1=500, F2=1500, F3=2500,
  F4=3500, F5=4500 Hz, with average spacing `c/2l ≈ 1000 Hz`
  (`Fant_1960_AcousticTheorySpeechProduction`). So by ~5 kHz you already have five formants;
  a sixth lives near 5.5 kHz.
- The decisive evidence that 5 is the floor comes from the singer's formant: Sundberg found
  that **five formants below 3 kHz are required** to synthesize the singing-formant peak
  (`Sundberg_1972_SingingFormant`). If you stop at F3 or F4 you cannot produce "ring."
- F1–F3 do the linguistic work (vowel identity). F4/F5/F6 do the **beauty work**: they
  carry timbre, presence, speaker identity, and the high-frequency energy that makes a voice
  sound "open" rather than "behind a blanket." They are largely vowel-independent and
  speaker-fixed (Hawkins–Stevens hold F4≈3500, F5≈4500 across all five vowels, varying F4
  only for [i]; `Hawkins_Stevens_1985_NasalVowelCorrelates`).

**Opinion:** build SIX cascade resonators. F1–F3 are articulator-driven; F4–F6 are
speaker-profile constants that we tune for timbre, not phonetics. Dropping F6 is the single
biggest "cheap synth" tell.

### The singer's formant — the source of "ring / presence / power"

Sundberg's mechanism (`Sundberg_1972_SingingFormant`):

- Lowering the larynx makes the **larynx tube act as a separate Helmholtz resonator** at
  **~2.8–2.9 kHz**, inserting an extra formant between normal speech F3 and F4.
- This requires the pharynx to be **≥ 6× wider than the larynx-tube opening** (`A_n < A/6`).
  Below that ratio the resonator does not decouple — so "ring" is a clusterable, switchable
  effect, not always-on.
- The **sinus piriformes** add a transfer-function **zero (notch) at 3.5–4 kHz** (quarter-wave
  `f = c/4ℓ_e`), which sharpens the peak above by carving away energy just past it.
- Net effect: **~20 dB gain at 3 kHz** for sung vs spoken [u].

The acoustic recipe (Sundberg's own synthesis prescription):
1. Add an extra resonator at ~2.8 kHz (narrow bandwidth — the larynx-tube Helmholtz mode).
2. Push normal F4 (3.5 kHz)→F5 and F5 (4.5 kHz)→F6 (formant compression).
3. Add a spectral zero at ~3.5–4 kHz (piriform notch).

**Opinion for beauty (not just opera):** even for speech, a *mild* version of this — a
narrow F4 placed near 2.9–3.2 kHz and slightly boosted, with a gentle zero above it — is
exactly what reads as "warm, present, broadcast-quality." Expose it as a **`presence`/`ring`
scalar** that (a) pulls F4 toward ~3 kHz, (b) narrows its bandwidth, (c) optionally inserts
the piriform zero. Sundberg's larynx-tube mode is "relatively stable across vowels," so it
behaves as a speaker-timbre control independent of which vowel is being said.

---

## 2. BANDWIDTH CONTROL — warmth vs harshness

Bandwidth is `B = -σ/π` (the real part of the pole); `Q = F/B`
(`Fant_1960_AcousticTheorySpeechProduction`). **Narrow B = high Q = strong, ringing peak =
brightness/presence; wide B = damped = muffled/warm/breathy.** This is the single most
under-used beauty knob.

### Published bandwidth values (use these, not guesses)

Fant Table 2.34-1 (`Fant_1960_AcousticTheorySpeechProduction`):

| Vowel | B1 | B2 | B3 | B4 |
|---|---|---|---|---|
| [a] | 57 | 72 | 130 | 175 |
| [o] | 54 | 65 | 100 | 135 |
| [u] | 69 | 50 | 110 | 115 |
| [i] | 43 | 125 | 77 | 134 |
| [e] | 39 | 95 | 170 | 325 |

Ranges: B1 ≈ 40–70, B2 ≈ 50–125, B3 ≈ 77–240.

Stevens & House measured B (3 male speakers) — note how **narrow** B1 is for high vowels in
*clear/isolated* speech (`Stevens_House_1961_AcousticalTheoryVowelProduction`):
/i/ B1=50 B2=120; /ae/ B1=100 B2=100; /a/ B1=130 B2=80; /u/ B1=60 B2=100. They also note 100
Hz is a serviceable all-formant default, with a `10·log10(100/B)` dB correction to peak level
when B deviates.

Crucially, the **null-context (isolated) bandwidths are narrower than conversational ones**
(`Stevens_House_1963_PerturbationVowelConsonant`, Table 4):

| | /i/ | /I/ | /E/ | /ae/ | /a/ | /A/ | /U/ | /u/ |
|---|---|---|---|---|---|---|---|---|
| B1 null | 30 | 40 | 50 | 100 | 110 | 60 | 30 | 40 |
| B1 in consonant context | 50 | 50 | 60 | 110 | 130 | 100 | 50 | 60 |
| B3 null | 220 | 180 | 230 | 190 | 220 | 200 | 180 | 110 |

Higher-formant defaults from a working Klatt setup: B3=150, B4=170, B5=250
(`Hawkins_Stevens_1985_NasalVowelCorrelates`).

### What to DO with bandwidths

- **Default to the NARROW (clear-speech / isolated) values, not conversational.** B1≈30–50 on
  close vowels, ≈60 mid, ≈100–130 on open vowels. Narrow B1 is the difference between a voice
  that "rings" and one that sounds congested. The conversational widening in
  `Stevens_House_1963` is an *undershoot/coarticulation* artifact — we don't want to bake it
  into the canonical timbre.
- **B1 of open vowels is legitimately wide (~130 for /a/)** because of glottal coupling
  (`Stevens_House_1963`, `Stevens_House_1961`). Keep it — it's natural, not a defect.
- **Bandwidth rises with frequency** by physics: radiation-resistance damping grows as `f²`
  (`Fant_1960`, B_R0: 3.9 Hz at F1=500 → 224 Hz at F4=3500). So B4/B5/B6 should be wide by
  default (150–300) — EXCEPT the singer's-formant resonator, which must be deliberately
  **narrowed** to make the peak project.
- **Harshness comes from over-narrow high formants** (buzzy/electronic) and **muddiness from
  over-wide low formants** (no ring). Warmth = slightly widened B1/B2 + gentle high-frequency
  rolloff; presence = narrowed F3/F4 region.
- Expose a per-formant **bandwidth-scale** in the speaker profile so "bright vs warm" is one
  coordinated gesture across B1–B6, not 6 hand-tuned numbers.

---

## 3. MALE vs FEMALE — VTL scaling is NONUNIFORM, and the source matters as much as the filter

### Is it a uniform formant scale? No.

`Nordstrom_1975_SimulateFemaleInfantVocalTracts` is the decisive paper, and the headline is:
**uniform length scaling alone does NOT reproduce female formants.** Anatomical size
differences explain only *part* of the male↔female formant difference; the vocal-tract *form*
(shape, mouth/pharynx proportion) differs between sexes, not just the size.

Two findings to implement:
1. **Pure length scaling, uniform vs non-uniform, is nearly identical** for F1/F2/F3 — so you
   can't fix it by just scaling the pharynx and mouth differently in length.
2. **Volume scaling (shrinking cross-section too, area ∝ length²) raises F1 by ~11.8% on
   average** over length scaling alone, with much smaller effect on F2/F3. F1 increase tracks
   the mouth/pharynx balance (6.5%–15.3% depending on configuration).

Net practical scaling (Nordstrom's own synthesis recommendation):

- **F1 female/male ≈ 1.12–1.18** (length **plus** the volume/cross-section effect — so F1 is
  scaled MORE than a uniform factor).
- **F2, F3 female/male ≈ 1.15–1.20** (essentially the length ratio; female VTL ≈ 83–87% of
  male).
- **Vowel-dependent:** front vowels ([i],[e]) scale differently from back ([u],[a]); the
  uniform model fits back vowels well and front vowels poorly. So gender scaling should be a
  small per-vowel (or per-region) table, not one global multiplier.

Anchor lengths: male VT ≈ 16.7–18.25 cm (`Story_1996_VocalTractAreaFunctionsMRI`, subject BS),
17.0–19.5 cm in Fant's data; female ≈ 14.5 cm; girl(8) ≈ 11.9 cm
(`Nordstrom_1975_SimulateFemaleInfantVocalTracts`).

**Opinion:** implement gender as `(VTL_scale, F1_boost, per-vowel_correction)`, where
`VTL_scale ≈ 1.17` for the basic up-shift of all formants, plus an extra `~1.05×` applied to
F1 only (the volume effect), plus a small front/back correction. Do NOT ship a single global
"×1.17 on everything" — that is exactly the "pitched-up male" failure mode Nordstrom warns
against.

### What makes a BEAUTIFUL female voice (not a pitched-up male)

The filter is only half of it. `Titze_1989_MaleFemaleVoices` gives the source/physiology:

- Two scale factors: **α ≈ 1.2** (overall larynx size) and **β ≈ 1.6** (membranous vocal-fold
  length). F0 tracks β: female ~170 Hz (L_m=10 mm) vs male ~106 Hz (L_m=16 mm); mean speaking
  F0 ≈ 190 Hz female / 120 Hz male (`Titze_1992_VocalIntensity`).
- **Female glottis is linearly convergent (Q_b=0), more triangular**, with a **longer open
  quotient and smaller baseline flow variation**; the male glottis has medial bulging (Q_b=2.5)
  giving a sharper closure "knee." Translation: the female source is **breathier, with more
  spectral tilt and a softer closure**, and often an incomplete-closure posterior chink.
- Female voice is **~25% more glottally efficient** at higher F0. Titze's metaphor: **male =
  woofer (bigger cone, more air, low-frequency power), female = tweeter (comparable power
  delivered higher up).**
- Intensity constants differ by sex (`Titze_1992_VocalIntensity`, Table I): female P_m=0.65
  kPa vs male 2.0; female k1 far smaller. Phonation-threshold pressure
  `P_th = 0.14 + 0.06(F0/F̄0)²` uses F̄0=190 female / 120 male.

**So a beautiful female voice = (a) nonuniform formant up-scaling per above, (b) F0 ~190 with
appropriate range, (c) a breathier source — higher OQ, more spectral tilt, a touch of
aspiration noise, gentler MFDR, modeling the convergent/chinked glottis, (d) tweeter-style
energy balance (relatively more upper-formant presence, less low-frequency woof).** Items
(c)/(d) belong to the source/voice-quality axis but the formant axis must cooperate: keep
female upper formants present (don't over-damp B3–B5) so the "tweeter" has something to ring.

---

## 4. NASALITY — character vs congestion

Two complementary papers. The mechanism is a **pole–zero pair near F1**.

### The pole/zero model (Hawkins–Stevens)

`Hawkins_Stevens_1985_NasalVowelCorrelates`:
- Universal correlate of vowel nasality = a nasal pole (FNP) + nasal zero (FNZ) in the F1
  region, with the zero placed **midway between F1 and the pole**: **`FNZ = (FNP + F1)/2`**.
- Perceptual nasal/non-nasal boundary sits at a **pole–zero spacing of 75–110 Hz** (vowel-
  dependent; high vowels [i],[u] need ~100–110 Hz, low [a] ~75–80 Hz). At full nasalization
  the spacing grows to 100–200 Hz.
- Bandwidths BNP, BNZ ≈ **100 Hz**. Timing: nasalization begins ~40 ms into the vowel with a
  ~40 ms piecewise-linear transition; pole and zero start coincident (canceling) and split
  apart.

### The "F1 weakening" model (House–Stevens, Fant)

`House_Stevens_1956_NasalizationVowels` — the perceptually dominant cue is what happens to F1:
- **F1 amplitude reduction ≈ 8 dB at the 50% nasality boundary** (vowel-independent). Their
  key implementation rule: *"For perceived nasality, reduce F1 amplitude by ~8 dB. This is
  more important than adding extra nasal formants."*
- F1 **bandwidth increases** from ~150 Hz (oral) to **200–500 Hz**; F1 center shifts **upward**.
- Overall vowel level **drops 5–9.5 dB**.
- **High vowels nasalize far more readily**: 50%-nasal coupling area is ~0.7 cm² for /i/,
  ~0.9 for /u/, but ~2.8 for /a/. So the SAME velar opening reads as much more nasal on /i/
  than on /a/ — nasality must be vowel-scaled.

Nasal *consonant* (murmur) constants (`Fant_1960`): nasal formants ≈ 250, 1000, 2000, 3000,
4000 Hz; F1 ≈ 250–300 Hz; first antiresonance ~1000 Hz for [m], shifting with place;
antiresonance typically 100–200 Hz above the low murmur pole.

### A touch of character vs congested

- **Character (warm, intimate, "human"):** a *small* coupling, well below the perceptual
  threshold — for a low vowel use coupling far under 2.8 cm², for a high vowel stay under
  ~0.7 cm². Implement as **mild F1 amplitude reduction (~2–4 dB) + slight B1 widening + a weak,
  closely-spaced pole/zero (spacing < 75 Hz)**. This adds body without naming itself "nasal."
- **Congested (head-cold, honky):** too much coupling — F1 over-damped, the zero deep and
  prominent, pole–zero spacing > 110 Hz on every vowel, overall level dumped 8+ dB. Avoid by
  capping the coupling parameter per vowel using the House–Stevens thresholds and never letting
  the zero get deeper than ~−8 dB on F1 for a "characterful" (non-phonemic) setting.

**Opinion:** expose nasality as ONE `nasal_coupling` scalar (0–1) per token; internally map it
through the House–Stevens per-vowel threshold to (FNP, FNZ via `(FNP+F1)/2`, B widening, F1
amplitude cut). Keep a separate hard path for phonemic nasal consonants (the murmur resonator
at ~250 Hz + antiresonance ~1000 Hz).

---

## 5. BACKEND (BE) REQUIREMENTS

- **Six cascade resonators (F1–F6).** Cascade, not parallel, for voiced sounds: the cascade
  product-of-poles form automatically yields the correct relative formant amplitudes from the
  frequencies alone (`Stevens_House_1961_AcousticalTheoryVowelProduction` — this is *the*
  theoretical justification for cascade synthesis; their isoamplitude contours show F2≈−9.5 dB,
  F3≈−15 dB fall out for free at neutral). Hand-setting A1..A6 is unnecessary and error-prone.
- **A dedicated singer's-formant / "presence" resonator** near 2.8–3.2 kHz with an independently
  **narrow bandwidth (~80–100 Hz)** and a level boost, plus an optional **piriform zero
  (antiresonator) at 3.5–4 kHz** above it (`Sundberg_1972_SingingFormant`). This can either be
  a 7th cascade pole or a re-tasking of F4 under a `ring` control.
- **A nasal pole + nasal zero (antiresonator) pair** insertable in the cascade near F1, with
  `FNZ=(FNP+F1)/2`, BNP=BNZ≈100 Hz (`Hawkins_Stevens_1985_NasalVowelCorrelates`); plus the
  ability to **attenuate F1 by up to ~8 dB and widen B1 to 200–500 Hz**
  (`House_Stevens_1956_NasalizationVowels`).
- **A fixed nasal-murmur resonator (~250 Hz) + antiresonance (~1000 Hz)** for phonemic nasal
  consonants (`Fant_1960`).
- **Parallel branch** reserved for fricatives/stops (source location changes the spectrum) —
  out of scope for this axis but the topology must leave room for it.
- **Per-formant bandwidth is a first-class, schedulable parameter** (B1–B6, plus BNP/BNZ), not
  a constant — because warmth/presence and nasality both act through B.
- **Higher-pole correction** for energy above F6 so the cascade doesn't lose high-frequency
  level: `20log10 k = 0.54x² + 0.00143x⁴` dB, x=f/f1 (`Fant_1960`).
- Net source+radiation slope **−6 dB/oct** baseline (−12 source + 6 radiation) (`Fant_1960`).

## 5b. FRONTEND (FE) REQUIREMENTS

- **Per-vowel formant targets F1–F3** (the linguistic core). Use a measured table, e.g. Story's
  MRI natural values (`Story_1996_VocalTractAreaFunctionsMRI`, Table IV: /i/ 333/2332/2986,
  /a/ 754/1195/2685, /u/ 541/1045/2568 …) or Stevens & House male averages
  (`Stevens_House_1963`). **F4–F6 are speaker-profile constants**, not per-vowel.
- **Per-formant bandwidth control**, defaulting to the **narrow clear-speech values** (B1 30–50
  close / ~130 open, B2 60–100, B3 150, B4 170, B5 250), with a global bandwidth-scale knob for
  warm↔bright (`Stevens_House_1963` null context; `Hawkins_Stevens_1985`; `Fant_1960`).
- **Gender / VTL scaling as a structured transform, not one multiplier:**
  `VTL_scale ≈ 1.17` applied to all formants for female, an **extra F1 volume boost (~×1.05)**,
  and a **per-vowel front/back correction** (`Nordstrom_1975`). Plus a source-gender bundle
  (F0≈190, higher OQ/tilt/breathiness, tweeter balance) from `Titze_1989` / `Titze_1992`.
- **A `ring`/`presence` scalar** that pulls F4 toward ~3 kHz, narrows its bandwidth, and arms
  the piriform zero (`Sundberg_1972`). Gate it on the `A_n < A/6` condition conceptually — i.e.
  it's a deliberate timbre mode, not always on.
- **A `nasal_coupling` scalar per token**, mapped through per-vowel House–Stevens thresholds to
  (FNP, FNZ, B1 widening, F1 attenuation); high vowels reach perceived nasality at ~¼ the
  coupling of low vowels, so scale by vowel height (`House_Stevens_1956`, `Hawkins_Stevens_1985`).
- **Coarticulation/undershoot is a separate, optional layer** (F2 drifts toward ~1500 Hz neutral
  by consonant place; B1/B2 widen in context — `Stevens_House_1963`). For a *beautiful* voice we
  want LESS undershoot than conversational speech (clearer targets), so this layer should be
  dialable down, not maxed.

---

## 6. OPEN QUESTIONS — and which paper settles each

| Question | Status / which paper |
|---|---|
| Exact **bandwidth of the singer's-formant resonator** | **Open.** `Sundberg_1972_SingingFormant` lists this as an explicit open question; he gives the frequency (~2.8 kHz) and ~20 dB gain but not B. Needs empirical tuning or a newer source. |
| **Female singer's formant** — does the same larynx-tube mechanism apply at high F0? | **Open.** `Sundberg_1972` studied male bass singers only and flags female applicability as unknown. Not settled in this collection. |
| Per-vowel **nonuniform female scaling** — is it size+shape or just size? | **Partially settled** by `Nordstrom_1975`: size explains only part; *form* differs by sex. Gives F1≈+12–18%, F2/F3≈+15–20%, vowel-dependent — but admits the model doesn't fully fit front vowels. Residual is open. |
| **Higher-pole / F4–F6 amplitude correction** in cascade | **Settled** by `Fant_1960` (HPC formula `0.54x²+0.00143x⁴` dB) and the cascade amplitude theory in `Stevens_House_1961`. |
| **Where to place the nasal zero** for a given nasal pole | **Settled** by `Hawkins_Stevens_1985`: `FNZ=(FNP+F1)/2`, spacing 75–110 Hz at boundary. |
| **How much F1 attenuation = "nasal"** and per-vowel coupling thresholds | **Settled** by `House_Stevens_1956`: ~8 dB at 50% boundary; coupling 0.7 (/i/) → 2.8 cm² (/a/). |
| **Default vowel formant targets / VT lengths** for a male reference | **Settled** by `Story_1996` (MRI, single male, F1–F3 natural+simulated, VTL 15.9–18.3 cm) and `Stevens_House_1963` (3-male averages). |
| **Source-side male/female differences** (OQ, tilt, breathiness, efficiency) | **Settled** by `Titze_1989` (α=1.2, β=1.6; convergent female glottis, +25% efficiency) and `Titze_1992` (sex-specific intensity constants, P_th). Belongs to the source axis but constrains formant-side energy balance. |
| **Dynamic B1 within the glottal cycle / glottal-coupling widening of open-vowel B1** | **Open** (`Fant_1960` flags it). We approximate with static wide B1 for open vowels (/a/ B1≈130). |
