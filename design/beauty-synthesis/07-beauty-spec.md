# P1 — The Beauty Spec

Status: synthesis of the six axis reports (`01`–`06`), 2026-06-28. This is the
contract the new backend (DSP body) and new frontend (control soul) must satisfy.
Clean-room: reuses nothing from klatt80/klsyn88/dectalk. Flagship target = a
beautiful **female** voice, **neutral** first (crispness + timbre both gorgeous),
emotion layered on a surface designed in from day one.

Every knob below traces to a paper. Numbers without a citation are `# engineering
estimate` and must be sourced before they harden.

---

## The shape of the whole thing: THREE PILLARS + ONE SCALAR

The six axes are not six subsystems. They collapse into three nearly-independent
pillars, plus one scalar that ties three of them together.

### Pillar A — SOURCE (timbre · voice quality · emotional valence · gender)
The glottal flow derivative. Carries warmth, breath, intimacy, "sexiness," the
male/female source difference, AND the *valence* of emotion. Engine: **LF, realized
CALM-style.** (`01`, `02`, `03`, `06`)

### Pillar B — PROSODY & ALIVENESS (melody · arousal · expressiveness)
F0 contour + micro-imperfection. Carries the tune, the *arousal* of emotion, and the
jitter/flutter that makes it sound spoken not drawn. Engine: **ToBI picks the notes →
Fujisaki bends them → O'Shaughnessy roughens them**, over a flutter+jitter floor.
(`04`, `03`)

### Pillar C — TRACT & CONSONANTS (intelligibility · crispness · ring · identity)
Six cascade resonators + a parallel branch for noise. Carries vowel identity, the
singer's-formant "ring/presence," and consonant crispness. (`06`, `05`)

### THE UNIFYING SCALAR — R_d
`Fant_1997`'s master waveshape parameter is the keystone. It is, simultaneously:
- the **timbre** dial (pressed→lax→breathy), `01`;
- the **voice-quality** continuum (Gobl's breathy↔tense master axis), `02`, via
  `H1*−H2* ≈ −7.6 + 11.1·R_d`;
- the **emotional valence** dial — and valence is carried *only* by voice quality
  (Scherer: acoustics encode arousal well, valence poorly), `03`;
- the **gender** source difference (female R_d ~1.4 vs male ~0.7), `02`/`06`.

So one scalar — R_d, moved together with E_e per the mandatory covariation rule
(`Fant_1997`: Δ(1/R_d) of 1 dB ↔ ΔE_e of 2 dB) — is the pivot of timbre, intimacy,
valence, and sex. **Build R_d right and most of "beautiful + emotional + female"
follows.** This is the single most important finding of the campaign.

---

## CORNERSTONE DECISIONS (the bets that define the backend)

1. **Source = LF model, realized as a CALM causal/anticausal filter** (2 anticausal
   poles = glottal formant; 1 causal pole = spectral tilt). Control via R_d (master)
   + E_e (amplitude); R_a/R_k/R_g default from R_d, overridable. KLGLOTT88 kept only
   as an ablation baseline. Physical (body-cover) models are reference-only — never in
   the audio path. (`01`)
   - **Aliasing is a real hazard** (source spectrum isn't band-limited; worse at the
     high female F0). Default to the frequency-domain alias-free LF (`Gobl_2021`) OR an
     oversampled generator — settle by build-and-measure bake-off. (`01` Q1)
2. **Tract = ~11 resonances + ≥3 zeros + a shaped HF "air" shelf** (corrected by `09`;
   Kreiman_2021's *validated* model needed 11 formants for quality in 0–5 kHz alone — a
   single higher-pole correction term CANNOT substitute for the >5 kHz band).
   - **F1–F6 individually controllable.** F1–F3 vowel identity; F4–F6 (~3–5 kHz) timbre/
     talker color + singer's-formant region (~2.8–3.2 kHz "ring," `06`).
   - **F7–F11 semi-fixed HF cascade** ~7/9/11/13/16 kHz (female-scaled), amplitude trims.
     This band carries naturalness (the 7–10.9 kHz core), the female sparkle (specifically
     the 16-kHz octave, +2–6 dB over male), and crisp sibilants. (`09`)
   - **≥3 zeros**, incl. the ~5 kHz **piriform-fossa notch** (a dip a boost can't make).
   - **Shaped HF "air" shelf** above the poles, calibrated −16 dB (8-kHz oct) / −24 dB
     (16-kHz oct) vs overall. Optional piriform sinus notch ~3.5–4 kHz sharpens the ring. (`09`)
3. **Consonants = parallel branch + broadband noise**, step-switched (never ramped),
   with a transient (PLSTEP) source. Burst spectrum and F2/F3 transition loci computed
   from ONE shared place+vowel function (burst-alone=18% place ID, +transition=90%).
   (`05`)
4. **F0 = Fujisaki realization in the log/semitone domain.** ToBI-style autosegmental
   targets (treated as *gradient*, per `Ladd_2021`) → phrase+accent commands → damped
   2nd-order larynx filter → organic curve. Then O'Shaughnessy micro-prosody +
   Klatt flutter + Titze jitter on top. (`04`)
5. **Source→tract is LINEAR/separable.** Buy back only the two cheap, audible
   interaction effects as side-channels: dynamic B1 widening from R_a
   (`ΔB1 = 250·(F1/500)²·(R_a/12)`) and the intrinsic LF pulse skew (free). No
   closed-loop physics. (`01` §3)

---

## DIMENSIONING (the three clocks + the resonator budget) — see `09`
- **Signal sample rate: 48 kHz, MANDATORY** (44.1 floor). Forced by `09`: naturalness lives
  at 7–10.9 kHz, the female cue in the 16-kHz octave (8–22 kHz), sibilants to 15 kHz, sung
  harmonics to 20 kHz. A 32 kHz rate amputates the female sparkle. WebAudio renders in
  128-sample quanta (2.67 ms). Glottal source internally oversampled / freq-domain (anti-alias).
- **Control-frame quantum: ~5 ms default** (Klatt heritage; tighten to 2.67 ms if `measure`
  shows transition stair-stepping). Continuous params ramp/step per `ramp:` flag.
- **Sub-frame events: sample-accurate** (bursts <1 ms PLSTEP, VOT ~20 ms, cascade/parallel
  switch flips). Per-cycle modulation (jitter/flutter/breath-noise AM) inside the source worklet.
- **Resonator budget: ~11 formants + ≥3 zeros + HF air shelf + 2-regime noise branch (→15 kHz).**
  NOT 6 (too few for the >5 kHz band), NOT 20/500 (that's articulatory/waveguide, a different
  synth class). 11 is Kreiman_2021's perceptually-validated count.

## THE KNOB INVENTORY (the full control surface, by subsystem)

### A. Source (per-frame, ~5 ms)
| Knob | Range | Role | Cite |
|---|---|---|---|
| F0 | 60–500 Hz | pitch; scales glottal formant | `04` |
| E_e | amplitude | excitation strength → presence/level | `01` |
| **R_d** | 0.3–2.7 (F default ~1.4) | master waveshape: pressed→breathy = valence dial | `Fant_1997` |
| F_a = 1/(2π·t_a) | 100 Hz (breathy) – 2 kHz (bright) | spectral tilt = warmth↔brightness | `Fant_1985/88` |
| O_q | 0.3–1.0 (F higher) | open quotient → glottal-formant freq | `Doval_2003` |
| αm | 0.65–0.8 | glottal-formant bandwidth (the knob KLGLOTT88 lacks) | `Doval_2006` |
| AH (aspiration) | breathy: AV−3 | breath noise, phase-gated; **#1 breathiness cue** | `Klatt_1990` |
| jitter | 0.2–0.3% (≤1%) | cycle-to-cycle, spectrally peaked 3/10/17 Hz NOT white | `Titze_1991` |
| flutter (FL) | ~25% | slow 3-sine wander | `Klatt_1990` |
| DI (diplophonia) | 0 neutral, >0 creak | alternate-pulse delay | `Klatt_1990` |

Four perceptual FE sliders sit on top of these: **Breathiness, Tension(−lax/+pressed),
Creak, Roughness** (Gobl: the 7 classic qualities collapse onto these). (`02`)

### B. Tract (per-frame)
F1–F3 per-vowel targets; F4–F6 speaker constants; per-formant bandwidths B1–B6
(default NARROW clear-speech values, global warm↔bright scale); nasal pole+zero
(`FNZ=(FNP+F1)/2`, spacing 75–110 Hz) + F1 attenuation up to ~8 dB driven by one
`nasal_coupling` scalar; `ring`/`presence` scalar (pulls singer's-formant resonator).
(`06`)

### C. Prosody & aliveness
AM accent placement + gradient accent/boundary strength → Fujisaki commands (phrase
α≈2–3, accent β≈20, γ=0.9) in log-F0; downstep k≈0.6; final lowering; range as
level-vs-span two-dim (`F0₂=Fr·[F0₁/Fr]^R`, R=1.0 neutral / 1.4–1.7 aroused / 0.6–0.75
bored); segmental micro-prosody (voiceless-C raises onset F0 ~20%, intrinsic vowel
pitch, ±50 ms peak timing). (`04`)

### D. Consonants / crispness
Per-consonant: burst amp+spectrum and F2/F3 loci from the shared place+vowel function
(F1 locus = 0/≈190 Hz at release; alveolar F2≈1800; labial<vowel; velar pinch);
VOT table (p/t/k 47/65/70, b/d/g 11/17/27 ms, ×context); transition rates (labial 15,
alveolar 10+tail, velar 50 ms); parallel A2–A6 frication envelopes; rise-time class
(stop onset <10 ms abrupt, fricative ≥15 ms gradual); Klatt-1976 durations (JND ~25 ms
floor). (`05`)

### E. Affect (the layer that drives A–D)
Affect State `(valence, arousal, power)` + intensity → lowered to: R_d/F_a (valence,
via voice quality), F0-mean/range + E_e + rate (arousal), thin/full voice (power); a
contour-type selector resolved against sentence type; per-emotion presets as named
coordinates (Rutledge multipliers: angry F0×1.90/AV×1.32/TL×0.85; tender F0×0.97/
breathier/TL×1.18). (`03`)

---

## NEW BACKEND PRIMITIVES (Rust/WASM worklets to build)
1. `lf-glottal-source` — LF flow-derivative, pitch-synchronous; CALM realization
   (biquad glottal formant + tilt pole) default, freq-domain alias-free variant as
   alternate. Inputs F0, E_e, R_d (or R_a/R_k/R_g).
2. `aspiration-noise` + open-phase modulator — Gaussian noise, ≥3 shapeable bands,
   pitch-synchronous AM (the intimate-vs-hiss gate).
3. `micro-modulation` — jitter (spectrally peaked, not white) + shimmer + flutter + DI.
4. `glottal-formant biquad` / `spectral-tilt` — shared resonator primitives.
5. Six cascade `resonator`s + `singer-formant` resonator + piriform `antiresonator`.
6. `parallel-branch` (A2–A6) + broadband `frication-noise` + `transient` (PLSTEP),
   step-switched.
7. `nasal` pole+zero, schedulable.
8. `fujisaki-realizer` — two damped 2nd-order systems summed in log-F0 (could live in
   FE math instead; decide in P2).
9. `dynamic-bandwidth` side-channel — ΔB1/ΔB2 from R_a.

Several map onto primitives that already exist in `crates/` (resonator, antiresonator,
lf-source, decay-envelope, edge-detector, signal-switch, pitch-sync-mod, biquad-notch,
tilt-filter, fujisaki-resonator) — **inventory existing vs new is a P2 task**, but we
do NOT reuse the existing *graph topology* or semantics; this synth gets its own.

## NEW FRONTEND LAYERS
g2p + inventory (own data) → rule phases → **prosody engine** (AM→Fujisaki→micro) →
**affect layer** (valence/arousal/power → source+prosody deltas) → **voice-quality
control** (4 sliders → R_d/F_a/O_q/AH) → **gender transform** (nonuniform formant
scale + source bundle) → assemble track. Covariation rule (E_e↔R_d) enforced. Every
emitted value cited + tagged for provenance.

---

## THE FEMALE-FLAGSHIP NEUTRAL PRESET (concrete starting point)
- F0 ~190 Hz, range R=1.0 (`04`, `06`).
- Source: R_d ~1.3–1.5 (breathier than male), F_a ~430–2000 Hz (steeper tilt, ~9.6 dB
  more than male), O_q ~0.65, light standing aspiration (posterior-chink floor), αm
  modal. (`02`, `06`)
- Tract: female nonuniform scale — F1 ×~1.17 *plus* ~5% extra volume boost, F2/F3 ×~1.17,
  per-vowel front/back correction; NARROW clear-speech bandwidths; B1 OQ-coupled wide on
  open vowels; singer's-formant `ring` mild-on for presence. (`06`)
- Aliveness: flutter 25%, jitter 0.25%, DI 0. (`04`)
- Crispness: full VOT + locus + transition tables, clear-speech (low undershoot). (`05`)

## DEFINITION OF DONE / VERIFICATION (no external oracle, Q is blind)
- **Instrument guardrails:** `npm run measure` (Praat) — formant tracks land in published
  ellipses, F0 contour smooth, intensity sane, jitter/HNR in target band; `npm run
  lint:audio` for voiced-periodicity. A render that buzzes or clips fails before Q hears it.
- **Intelligibility:** ASR round-trip / minimal-pair on the neutral voice (Pillar C gate).
- **Beauty:** Q's ear, spent sparingly on prepared A/B renders (real `render-phrase
  --out-wav`, node backend; browser-validate before any default). Proof is a render +
  a number, never a description.

## PAPERS TO RETRIEVE / PROCESS before the spec hardens
- `Klatt_1990_VoiceQualityVariations` — in collection; jitter/shimmer/flutter/DI param
  detail underspecified in this pass. (Pillar A/B micro-imperfection.)
- `Scherer_1986` — no `notes.md`; emotion keystone read off page images. Run paper-process.
- `Fant_1995_LFModelRevisited` — locked PDF, unreadable; re-acquire (Rd transformed params).
- `Sundberg_1979` — no `notes.md` (it's Sundberg & Gauffin 1978).
- Henrich 2003 — NOT in collection; needed for αm/OQ perceptual JND. Retrieve.
- Jongman 2000 / Shadle 1985 — NOT in set; would tighten fricative A2–A6 gain tables.

---

## NEXT (P2/P3)
P2 — Backend design: lock the source realization (bake-off), draw the graph topology,
inventory existing-vs-new primitives, write registry+graph+semantics for the new BE.
P3 — Frontend design: the affect/prosody/VQ/gender control stack.
Then P5 — smallest path to a first audible female "hello," and iterate per pillar.
