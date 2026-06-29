# 05 — Crispness & Intelligibility (Clean-Room Klatt-Style Synth)

Axis: consonant clarity, plosive bursts, fricative noise, formant transitions, and the
precise timing that makes speech sound *sharp and articulate* rather than mushy. This is
the TOP priority axis for the user's ear.

All claims cited by paper-folder name. Numbers are load-bearing — they are the spec.

---

## 0. The one thing to get right

Crispness is **temporal edge definition + correct onset spectral shape in the first
~26 ms after every consonantal release**. Everything below is in service of those two
things. The ear identifies stop place from the gross spectral envelope sampled in a
single ~26 ms window starting at release (Stevens_1978_InvariantCuesPlaceArticulation,
Blumstein_Stevens_1979_AcousticInvariance), and it identifies voicing/manner from
*sharp temporal events* — burst transient, VOT gap, abrupt vs. gradual amplitude onset
(Stevens_Klatt_1974_FormantTransitionsVoicing; Stevens_1989_QuantalNatureSpeech §5.5).
A mushy synth blurs those edges (slow ramps, smeared bursts, wrong VOT, low-passed
frication). A crisp synth nails them.

---

## 1. The acoustic cues that make consonants crisp

### 1.1 Stop place — onset spectrum templates (the big lever)

Place of articulation is carried by the **gross spectral shape** of the short-time
spectrum at release, sampled in a **26 ms window** with high-frequency pre-emphasis
(first-difference), invariant across vowel context, voicing, position, speaker
(Blumstein_Stevens_1979_AcousticInvariance; Stevens_1978_InvariantCuesPlaceArticulation).
Three templates, ~85% natural-token classification, ~90% perceptual full-cue ID:

| Place | Template | Spectral signature | Synth target |
|-------|----------|--------------------|--------------|
| Alveolar /t d/ | **diffuse-rising** | energy spread, rising toward HF; ≥2 peaks, the >2200 Hz peak higher than lower one | front cavity ~2 cm → prominence ~4500 Hz; burst exceeds following-vowel level by 10–20 dB above ~3 kHz |
| Labial /p b/ | **diffuse-falling/flat** | energy spread, falling toward HF; no single dominant peak; one peak <2400 Hz, one 2400–3600 Hz | no front cavity → flat/falling burst, weaker than vowel at all freqs |
| Velar /k g/ | **compact** | single prominent midfreq peak 1200–3500 Hz (F2–F3 "pinch") | excite a resonator at the F2/F3 convergence; peak lower before back vowels, higher before front |

Citations: Blumstein_Stevens_1979_AcousticInvariance (template specs, classification
rates), Stevens_1978_InvariantCuesPlaceArticulation (perceptual validation),
Stevens_1989_QuantalNatureSpeech §5.6 (coronal burst HF > vowel onset by ~3 dB crossover;
velar compact prominence 3–5 dB below vowel F2/F3).

**Critical design fact:** burst alone is NOT enough. Burst-only stimuli were identified
at **18%**; transition-only at **81%**; full burst+transition at **90%**
(Stevens_1978_InvariantCuesPlaceArticulation, Table II). The burst spectrum must be
**spectrally continuous with the formant transitions** — burst peak roughly continuous
with F2/F3 of the following vowel. A synth that fires a generic burst and then runs
transitions decoupled from it will sound wrong. The burst resonator frequency and the
F2/F3 transition starting loci must be set from the *same* place+vowel computation.

### 1.2 Formant transitions — loci (the second big lever)

The simple single-locus hypothesis is wrong; loci are place-specific and partly
vowel-dependent (Stevens_House_1956_FormantTransitionsVocalTract):

- **F1 locus = 0 Hz for ALL stops** (complete closure). F1 starts low (~180–200 Hz)
  and rises into the vowel. This is the manner cue (stop vs. non-stop). Non-negotiable.
- **Alveolar /t d/: F2 locus fixed ~1800 Hz** (use 1800; the retracted-tongue model
  matches DLC's 1800 better than 2000), independent of vowel. F3 locus ~3000–3200 Hz.
- **Labial /p b/: F2 locus vowel-dependent ~700–1500 Hz, ALWAYS below the vowel's F2.**
  ~700–800 before back vowels (/u/), ~1200–1500 before front (/i/). All formants rise
  from low closure values.
- **Velar /k g/: F2 locus vowel-dependent ~600–2500 Hz, generally ABOVE the vowel's F2.**
  ~600–900 before /u/, ~1500 before /a/, ~2300–2400 before /i/. F2–F3 converge ("velar
  pinch") — the perceptual compact-peak cue (Stevens_1989_QuantalNatureSpeech §2.6).

Transition *rate* matters as a place/voicing cue too (Stevens_Klatt_1974_FormantTransitionsVoicing;
Stevens_1998_AcousticPhonetics §7.6): labial transitions complete in 10–20 ms, alveolar
have a rapid (10 ms) then slow component, velar are slowest (~50 ms). F1 transition
duration ~15–45 ms depending on vowel (Stevens_1978: 15 ms for /u/, 20–45 ms for /a/).

### 1.3 VOT — the voicing edge

VOT = burst frication duration + aspiration duration (Klatt_1975_VoiceOnsetTimeFrication).
The perceptual voiced/voiceless boundary is at **~20–25 ms** (Klatt_1975;
Stevens_Klatt_1974: 50% temporal-order threshold at ~20 ms, reliable separation >25 ms,
fusion <15 ms). Mean singleton prevocalic VOTs:

| Stop | Voiced VOT | Voiceless VOT | Burst dur |
|------|-----------|---------------|-----------|
| /b p/ | 11 ms | 47 ms | ~11 ms (p≈b) |
| /d t/ | 17 ms | 65 ms | 17 / 24 ms |
| /g k/ | 27 ms | 70 ms | 27 / 37 ms |

(Klatt_1975 Table 1, burst-duration table). Ordering labial<alveolar<velar is universal,
driven by slower velar articulation needing more time for transitions to complete before
voicing (Stevens_Klatt_1974). VOT trades with F1 onset: a 30 ms change in F1 transition
duration shifts the /d/–/t/ boundary by ~13 ms; best-fit = ~23 ms residual F1 transition
after voicing onset cues /t/ (Stevens_Klatt_1974). After /s/, VOT collapses to voiced-like
values (/sp/ 12, /st/ 23, /sk/ 30 ms — Klatt_1975 Table 1).

### 1.4 Frication spectral shape

Place cue for fricatives = front-cavity resonance position + source location
(Stevens_1971_AirflowTurbulenceNoise; Stevens_1989_QuantalNatureSpeech §3.2;
Stevens_1998_AcousticPhonetics §8):

- /f θ/ (labial/dental): front-cavity resonance very high (~10 kHz), no strong peak in
  speech band → weak, flat, **15–30 dB below /s ʃ/** (Stevens_1971). These are
  amplitude-distinguished, weak.
- /s/ (alveolar): dipole source at lower incisors, front cavity ~2 cm → **peak ~4500 Hz**;
  strident, obstacle adds up to +20 dB (Stevens_1989 §3.2). Strong HF energy.
- /ʃ/ (palatoalveolar): longer front cavity (~8.5 cm total) → lowest zero ~1000 Hz,
  prominences F3 ~2500 Hz, F4 ~3250 Hz; energy lower than /s/, broader.
- Voiced fricatives: noise **~7 dB below** voiceless (intraoral pressure ~50% vs 80–90%
  of subglottal; 20·log(0.6^1.5) ≈ 7 dB — Stevens_1998 §2.12) AND pitch-synchronously
  modulated (Stevens_1971: ~15 dB modulation at the constriction per glottal cycle).

Noise source amplitude is **broadly stable**: within 3 dB of max for constriction area
0.03–0.2 cm² (Stevens_1989 §3, Fig 19) → the noise *level* is forgiving; the *spectral
shaping and timing* are what must be right.

### 1.5 What the ear actually uses (priority order)

1. **Temporal/onset structure** — abrupt vs. gradual amplitude onset (rise time ≥15 ms =
   "bow"/continuant; abrupt overshoot = "pluck"/stop — Stevens_1989 §5.5). Categorical.
2. **VOT gap** (~20–25 ms boundary) — voicing.
3. **Onset spectral envelope shape** in 26 ms window — place (the 3 templates).
4. **Formant transition loci/rate** — place + manner, reinforces the burst.
5. **Frication spectral peak + amplitude** — fricative place/voicing.
6. F0 perturbation (+5–10% after voiceless, −5–7% after voiced — Stevens_1998 §7.13),
   low-frequency energy presence, preceding-vowel shortening (secondary but cumulative).

---

## 2. The knobs (per-consonant control surface)

What the synth MUST control, with ranges and citations.

### 2.1 Burst (transient + frication)

- **Burst amplitude, place-relative:** /d/ burst = /b/ burst **+17 dB**; /g/ = /b/ **−12 dB**;
  aspirated = unaspirated **+5 dB**; voiced burst 3–6 dB below voiceless
  (Stevens_1998 §7.11; Klatt_1975). Alveolar frication ~+2 dB over alveolar burst.
- **Burst spectral peak frequency:** set by front-cavity resonator —
  alveolar ~4500 Hz (BW ~600 Hz), velar at F2/F3 convergence (1500–2500 Hz vowel-dep),
  labial none (flat/falling, weak resonator near vowel F4) (Stevens_1978 burst-generation
  notes; Stevens_1993; Stevens_1998 §7.8–7.10). Burst peak must equal the F2/F3
  *transition start* (spectral continuity, §1.1).
- **Burst duration:** /p/ ~11, /t/ ~17–24, /k/ ~27–37 ms (Klatt_1975). Within 5 dB of max
  for 9–19 ms (Stevens_1998 §2.13). Transient itself <1 ms (Stevens_1993 source type 1).
- **Burst transient amplitude** comparable to a glottal pulse at HF >1 kHz (Stevens_1998 §2.13).

### 2.2 Transition rate & target loci

- **F1:** start 180–200 Hz, rise to vowel target over 15–45 ms (vowel-dep). Always.
- **F2 locus:** labial 700–1500 (below vowel F2), alveolar 1800 fixed, velar 600–2500
  (above vowel F2, F2–F3 pinch) — Stevens_House_1956.
- **Transition duration:** labial 10–20 ms, alveolar 10 ms fast + slow tail, velar ~50 ms
  (Stevens_1998 §7.6). Fricative transitions 30–40 ms (Stevens_1998 §8.1).

### 2.3 VOT

- Per §1.3 table. Implement as the AV-onset delay relative to release. Boundary ~20–25 ms.
- Apply context scaling (Klatt_1975 appendix): preceded by voiceless C ×0.9 (word-initial),
  non-prestressed word-medial/final ×0.4–0.7, after homorganic nasal → 0, intervocalic /t/
  → flap (VOT 0), voiced stop after voiceless C ×1.3, after nasal ×0.8.

### 2.4 Frication noise shaping (parallel branch A2–A6)

The parallel-branch formant amplitudes set the spectral envelope of noise. Target shapes
(re following vowel spectrum, from Stevens_1998 Tables 8.2/8.3, §8.4–8.5):

- **/s/:** push A4/A5/A6 (peak ~4500 Hz, i.e. F4–F5 band); A2/A3 low. Strong.
- **/ʃ/:** A3/A4 prominent (~2500/3250 Hz); lowest zero ~1000 Hz → keep A2 low.
- **/f θ/:** all low, falling, overall −15 to −30 dB vs /s/ (Stevens_1971). ΔA2≈+30 dB
  re vowel but absolute level weak.
- **Aspiration (/h/, stop aspiration):** excites all but F1; F1 region 15–25 dB weaker
  because abducted folds widen B1 (Stevens_Klatt_1974; Klatt_1975). vs vowel:
  F2 −13, F3 −12, F4 −9, F5 0 dB (Stevens_1998 §8.9).

### 2.5 Aspiration / B1 widening

- During aspiration, **B1 widens 3–4×** (~70 → ~280 Hz, Stevens_1998 §8.8). This kills
  F1 energy and is *the* reason aspiration sounds breathy-noisy not buzzy. Must implement.
- Aspiration amplitude set so F3/F4 energy is **continuous** across aspiration→voicing
  (no level discontinuity) — Stevens_Klatt_1974.

---

## 3. Timing — what "mushy" vs "crisp" means numerically

### 3.1 Duration rules that matter most (Klatt_1976_SegmentalDuration)

JND for duration ≈ **25 ms** in sentence context. **Do not bother modeling effects
< 25 ms** — they cost complexity and buy nothing perceptible. Priority order (largest
effect first):

1. **Phrase-final lengthening:** vowels up to **2× longer**; +60–200 ms absolute, or ×1.3.
   Final consonants (non-plosive) ×1.6.
2. **Stress shortening:** unstressed vowels 35–60% shorter (K=0.4–0.6).
3. **Inherent duration:** vowel range ~8:1 (prepausal /aɪ/ down to unstressed schwa).
   Use Table II inherent values as baseline.
4. **Postvocalic voicing:** voiceless coda shortens preceding vowel −45 ms phrase-final
   (−10–20 ms elsewhere — below JND elsewhere, so skip except phrase-final).
5. **Cluster shortening:** 20–30% (additive percentages, Klatt_1973).

**Incompressibility (Eq. 1):** `D_f = K·(D_i − D_min) + D_min`, with D_min ≈ 0.42–0.45 ×
D_inherent (vowels), ~0.6 (stops). Multiple shortening rules do NOT multiply below the
floor. Apply rules sequentially through this formula. The 4-rule vowel model hits 97% of
variance with 9 parameters — it is cheap and effective.

### 3.2 Consonant/cluster timing (Klatt_1973_DurationStopConsonantClusters)

Baseline singleton closure durations: labials > dentals > velars; fricatives > stops >
sonorants (e.g. s 152, f 138, p 100, b 97, t/d 85, k/g 78 ms). Additive cluster rules:
2-element C1 −12% C2 −22%; 3-element C1 −15% C2 −25% C3 −30%. **Sonorant after aspirated
voiceless stop +28%** (e.g. /r/ in "tried" lengthened — transitions delayed into voicing
to preserve voicelessness; Stevens_Klatt_1974 confirms). Pre-stop −8%; labial +6% /
adjacent-to-labial −6%; /r/ after dental stop +13% (dental −13%).

### 3.3 Transition durations (the crispness dial)

- Formant transition default in the existing tooling is 30 ms; that is reasonable for the
  rapid component. Numerically: F1 500 Hz/60 ms rate is a *detectable* transition at ~13 ms
  duration (Stevens_Klatt_1974). Transitions **shorter than ~10 ms read as instantaneous**;
  **longer than ~50 ms read as glide-like/sluggish**.
- **"Mushy" = transitions too long (>40–50 ms on stops), bursts smeared/low-passed, VOT
  wrong, amplitude onsets ramped instead of stepped.** Onset rise time ≥15 ms flips a stop
  into the continuant/"bow" category perceptually (Stevens_1989 §5.5) — so stop/affricate
  amplitude onsets MUST be abrupt (<~10 ms), fricative onsets gradual (≥15–20 ms).
- **"Crisp" = burst transient <1 ms, frication 1–3 ms dominance, place-correct 26 ms onset
  window, VOT within a few ms of the §1.3 targets, F1-from-180 Hz, transitions 10–50 ms
  matched to place (labial fast, velar slow).**

---

## 4. The parallel branch (how stops/fricatives are made crisp not buzzy)

### 4.1 Topology

Obstruents need a **noise source → parallel formant bank (A2–A6 individually gained) →
sum**, switched in against the cascade (vocal) branch. The cascade alone (all-pole) cannot
make the diffuse/compact burst shapes or the zero in /ʃ/. The parallel branch with
per-formant amplitudes is exactly what paints the Blumstein-Stevens templates
(Blumstein_Stevens_1979 "parallel branch amplitudes A2–A6 should produce these spectral
shapes").

### 4.2 The four sequential sources at a stop release (Stevens_1993_ModelsProductionAcousticsStop §Fig 6)

The BE must generate, in order:

1. **Transient** (<1 ms): DC discharge of compressed intraoral air through the opening
   constriction. Spectrum ∝ intraoral pressure × area-opening rate. This is the
   PLSTEP/edge-decay mechanism — a step injected and decayed, triggered at release.
2. **Frication** (1–3 ms dominance, longer for velar): turbulence at constriction,
   amplitude ∝ **Uc³ · Ac^(−2.5)** (Stevens_1993, Shadle; also Stevens_1989 p_s=K·U³·A^−5/2).
   Peaks 1–2 ms after release, decays ~8 dB over 6 ms as Ac grows.
3. **Aspiration** (place-dependent, fills VOT): turbulence at the glottis, distributed
   1–3 cm downstream; flat-ish noise exciting all but F1; F1 region killed by wide B1.
4. **Voicing**: AV onset at VOT, F1 transition begins here.

These overlap; the controller schedules AF (frication), AH (aspiration), AV (voicing)
envelopes with the §1.3 timing.

### 4.3 What makes it crisp not buzzy — DSP imperatives

- **Switching must be a STEP, not a ramp.** Branch/source-select gains use
  setValueAtTime, not linearRamp. A ramped cascade↔parallel switch smears the burst edge
  into a buzz. (Matches existing project note: "SW branch gains must use setValueAtTime.")
- **Noise must be broadband white into the parallel bank**, flat to ~5 kHz
  (Stevens_Klatt_1974 frication/aspiration "flat to 5 kHz"). Low-passed noise = dull /s/.
- **Voiced-fricative pitch-synchronous modulation:** modulate the noise amplitude at F0
  (~15 dB swing, gated to the open phase) — Stevens_1971. Without it, /z ʒ v ð/ sound like
  steady hiss glued to a buzz instead of a single voiced fricative.
- **Burst transient** wants near-instantaneous attack; the decay-envelope on the DC step
  gives the <1 ms click that signals "pluck"/stop.
- **B1 widening during aspiration** (×3–4) is what separates a breathy /h/-like aspiration
  from a tonal buzz (Stevens_1998 §8.8).
- **Quantal noise onset:** AF should cross from ~0 to full quickly as the constriction
  passes ~0.1–0.2 cm² (Stevens_1989 Fig 19) — model AF onset as a sharp step/short ramp,
  not a slow swell.

---

## 5. BE (DSP) and FE (control) requirements

### 5.1 Backend (DSP) must implement

1. **Cascade formant branch** (vowels/sonorants): 5 resonators, F1–F5, voicing source.
2. **Parallel formant branch** (obstruents): noise source → A2…A6 individually-gained
   resonators + summed; this is the spectral-template painter.
3. **Noise source:** broadband white, flat to ≥5 kHz, separately routable as frication
   (at constriction, shaped by parallel bank) and aspiration (at glottis, excites all but F1).
4. **Transient/PLSTEP:** DC-step injector + decay envelope, edge-triggered at release for
   the <1 ms burst transient (Stevens_1993 source 1).
5. **Step-switching** between/among branches and sources (setValueAtTime) — no ramps on
   switches.
6. **Per-formant bandwidth control**, including B1 ×3–4 widening during aspiration.
7. **Pitch-synchronous noise amplitude modulation** for voiced obstruents (~15 dB at F0).
8. **Amplitude env scheduling** with both abrupt (stop onset) and ramped (fric onset, AH/AF)
   modes — ramp param marked per the existing convention.
9. Frication amplitude law option ∝ Uc³·Ac^−2.5 (or a calibrated table), so burst level
   tracks place correctly.

### 5.2 Frontend (control surface + duration rules) must produce, per segment

- **Place+vowel → {burst resonator freq & amp, F2/F3 transition start loci}** computed
  TOGETHER (spectral continuity, §1.1). One function, not two.
- **F1 = 180–200 Hz at every stop release**, rising over 15–45 ms.
- **VOT** from §1.3 table × Klatt_1975 context multipliers; schedules AV onset, AF/AH split.
- **Burst amplitude** place-relative (/d/=+17, /g/=−12 re /b/; voiced −3 to −6 vs voiceless).
- **Parallel A2–A6 envelopes** per fricative/affricate to hit /s/(4.5k), /ʃ/(2.5/3.25k),
  /f θ/(weak −15..−30 dB), aspiration (F1 −20, F5 0).
- **Transition durations** by place (labial ~15, alveolar ~10+tail, velar ~50 ms).
- **Duration rules** (Klatt_1976 + Klatt_1973), via incompressibility Eq.1, in priority
  order, ignoring sub-25-ms effects. Cluster percentages additive.
- **Onset rise-time class**: stops/affricates abrupt (<10 ms), fricatives gradual (≥15 ms).
- Every emitted decision carries its citation (templates → Blumstein_Stevens_1979; VOT →
  Klatt_1975; loci → Stevens_House_1956; durations → Klatt_1976/1973).

### 5.3 Opinionated defaults (start here, then tune by ear)

- Stop F1 release = 190 Hz. Alveolar burst peak 4500 Hz, BW 600 Hz. Velar burst = vowel
  F2/F3 midpoint. Labial: no burst resonator, flat noise −17 dB re alveolar.
- VOT: p/t/k = 47/65/70, b/d/g = 11/17/27 ms; after /s/ = 12/23/30.
- Transition (rapid component) 25–30 ms default; velar stop 45–50 ms.
- /s/ A5≈A4 high, A2 low; /ʃ/ A3 peak; aspiration B1×4.

---

## 6. Open questions & which paper settles each

| Question | Settled by |
|----------|-----------|
| Exact burst spectral template per place | Blumstein_Stevens_1979 (acoustic) + Stevens_1978 (perceptual) — diffuse-rising/falling/compact |
| Are burst-only cues sufficient? | Stevens_1978 — NO (18%); need burst+transition continuity (90%) |
| F2 locus per place, vowel dependence | Stevens_House_1956 — labial 700–1500 (below vowel), alveolar 1800 fixed, velar 600–2500 (above vowel) |
| Where is the voiced/voiceless VOT boundary? | Klatt_1975 & Stevens_Klatt_1974 — ~20–25 ms |
| How does VOT trade with F1 transition? | Stevens_Klatt_1974 — ~23 ms residual F1 transition cues /t/; 13 ms boundary shift per 30 ms transition change |
| VOT values & context scaling | Klatt_1975 (Table 1 + appendix rules) |
| Why labial<alveolar<velar VOT/burst-dur | Stevens_Klatt_1974 + Stevens_1993 (velar 4× slower area opening, transitions must finish before voicing) |
| Source sequence at release (what BE schedules) | Stevens_1993 — transient→frication→aspiration→voicing, with timings |
| Frication noise amplitude law | Stevens_1971 (∝ΔP^1.0–1.5·A^1/2) / Stevens_1993 (Uc³·Ac^−2.5) |
| Why /f θ/ weak vs /s ʃ/ | Stevens_1971 — source-location/transfer-function, 15–30 dB |
| Frication spectral peak per place | Stevens_1989 §3.2 / Stevens_1998 §8 — front-cavity affiliation (s→4.5k, ʃ→2.5k, f→10k) |
| Voiced fricative noise level & modulation | Stevens_1998 §2.12 (−7 dB) + Stevens_1971 (~15 dB F0 modulation) |
| Aspiration F1 suppression mechanism | Stevens_1998 §8.8 (B1 ×3–4) + Stevens_Klatt_1974 |
| Which duration effects are audible | Klatt_1976 — JND ~25 ms; ignore smaller |
| Duration rule math (combining rules) | Klatt_1976 Eq.1 incompressibility, D_min ≈ 0.42–0.45·D_inh |
| Cluster duration changes | Klatt_1973 (additive % rules) |
| Why abrupt vs gradual onset = stop vs fric | Stevens_1989 §5.5 — rise-time ≥15 ms categorical boundary |
| Noise-onset abruptness (quantal) | Stevens_1972 / Stevens_1989 §3 Fig 19 — noise quantal at Ac ~0.1–0.2 cm² |

### Still genuinely open (no paper in this set fully settles)

- Exact parallel A2–A6 numeric envelopes for English fricatives in the *clean-room* BE —
  the papers give spectral *targets* and dB *differences* but not turnkey gain tables;
  these need calibration against `npm run measure` once the BE exists. (Jongman_2000 /
  Shadle_1985, outside this set, would tighten fricative numbers.)
- How aspiration overlays vs. sequentially follows transitions — Stevens_1993 says
  sequential; Hanson_2003 (outside set) challenges this (aspiration overlays transitions).
  Pick sequential first (simpler), revisit if velars sound wrong.
- Precise pitch-synchronous modulation depth/phase for voiced fricatives — Stevens_1971
  gives ~15 dB but not the envelope shape; tune by ear + measure.

---

## TL;DR for the builder

Crispness = (1) correct **26 ms onset spectral template** per place (diffuse-rising
alveolar / diffuse-falling labial / compact velar), with the **burst spectrally continuous
with F2/F3 transitions**; (2) **F1 from ~190 Hz** at every stop release; (3) **VOT** right
(~20–25 ms boundary; p/t/k 47/65/70, b/d/g 11/17/27); (4) a **parallel noise branch** with
per-formant A2–A6 painting frication/aspiration spectra, **step-switched** (never ramped),
white noise flat to 5 kHz, **B1×4** during aspiration, **F0-modulated** for voiced
fricatives; (5) **abrupt** stop onsets / **gradual** fricative onsets; (6) duration rules
only where the effect exceeds **25 ms**, combined via the incompressibility floor. Get the
edges and the onset spectra right and it will sound sharp; blur them and it turns to mush.
