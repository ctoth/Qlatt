# Voice Quality — Clean-Room Design Axis

Design axis: VOICE QUALITY. The breathy/modal/tense/creaky/lax/falsetto continuum,
the aspiration-noise blend, and the source-level controls that make the same words
sound intimate, powerful, warm, or fragile. This is where "sexy" and "honest/depressed"
timbre lives.

Scope note: this document covers the SOURCE. Formant/vowel design and prosody/F0 live
on other axes. Everything here sits between "glottal source generator" and "first formant."

Papers synthesized: Klatt_1990_VoiceQualityVariations, Gobl_1988, Gobl_2003,
Hanson_1995/1997/1999/2001/2002/2003, Kreiman_2007/2012/2021,
Kreiman_Gerratt_2010, Childers_Lee_1991, Childers_1990, Titze_2014, Titze_2015.

---

## 1. THE VOICE-QUALITY DIMENSIONS — acoustic correlates with numbers

The phonation continuum runs (pressed/tense) → modal → (breathy → whispery) on one
axis, with (creaky/fry) and (falsetto) as off-axis registers. Each quality is a *bundle*
of correlated source measures. The five measurable correlates that matter:

1. **H1–H2** (amplitude of 1st harmonic minus 2nd) — open-quotient / low-frequency
   excitation shape.
2. **Spectral tilt** (best captured as H1–A3, the 1st harmonic minus the F3-region peak;
   in synth terms the TL knob) — abruptness of glottal closure / high-frequency rolloff.
3. **OQ** (open quotient) — fraction of the cycle the glottis is open.
4. **Aspiration noise level** (AH, and its spectral correlate, harmonic-to-noise ratio
   in the F3 region) — turbulence from glottal leak.
5. **F0 perturbation** (jitter, diplophonia/period-doubling, flutter) — vibratory
   regularity.

### Per-quality acoustic signatures

Numbers below are the consensus across the corpus. KLSYN88 synthesis settings from
Gobl_2003 (male, F0≈120 Hz baseline) and Childers_Lee_1991 (sustained vowel).

| Quality | OQ | Spectral tilt / slope | H1–H2 | Aspiration | F0 perturbation | Affect signaled |
|---|---|---|---|---|---|---|
| **Pressed / tense** | 0.35–0.45 (Childers_Lee_1991 fry 0.45; Gobl_2003 tense OQ 35–40%) | low tilt, ~-12 dB/oct or shallower, "bright" (Gobl_2003 TL 5–8 dB) | low (male pressed -2 to +4 dB, Kreiman_2012) | none | none | stressed, angry, confident, hostile (Gobl_2003) |
| **Modal** | 0.50–0.70 (Childers_Lee_1991 0.70; Klatt_1990 default 50%; Hanson_2002 OQm 50% male / 65% female) | -12 dB/oct flow, TL 5–15 dB (Gobl_2003; Hanson_2002 TLm 5 male/10 female) | male ~0, female ~3 dB corrected (Hanson_1999 Table X) | minimal | optional flutter ~25% for life (Klatt_1990) | neutral / mild confident |
| **Breathy** | 0.85–0.95 (Childers_Lee_1991 0.91; Gobl_2003 85–95%; Kreiman_2012 ~0.88–0.94) | steep, -18 dB/oct, TL 20–30 dB (Gobl_2003; Childers_Lee_1991 three-pole) | high (female breathy 10–20 dB, Kreiman_2012 Table I) | STRONG, AH 35–50 dB (Gobl_2003) | none | relaxed, content, intimate, friendly (Gobl_2003) |
| **Whispery** | 0.70–0.80 (Gobl_2003) | steep, TL 22–30 dB | high | VERY strong, AH 45–55 dB (Gobl_2003), DI 5% | low DI | timid, afraid (Gobl_2003) |
| **Creaky / fry** | low, ~0.45 (Childers_Lee_1991 fry OQ 0.45, SQ 3.5, very abrupt closure) | slight tilt, -6 dB/oct (Childers_Lee_1991 fry) | low | none | DI 5–25%, period-doubling; F0 18–52 Hz (Childers_Lee_1991); Gobl_2003 creaky -30 Hz F0 | similar to breathy but weaker (Gobl_2003) |
| **Lax-creaky** | mid 0.45–0.55 (Gobl_2003) | steep, TL 20–30 dB | high | AH-20 dB (reduced) | DI 15–25%, -30 Hz F0 (Gobl_2003) | **bored, relaxed, intimate, content, sad** (Gobl_2003) |
| **Harsh** | low 0.35–0.40 (= tense) | low tilt | low | none | DI 10–20% (Gobl_2003) | = tense (angry); irregular aperiodicity |
| **Falsetto** | very high 0.99 (Childers_Lee_1991) | steep -18 dB/oct, near-sinusoidal | high | low (NHR_h -6.6 dB, Childers_Lee_1991) | smooth, no knee in EGG (Titze_2014) | flute-like, thin |

Key correlate relationships, with citations:

- **OQ → H1–H2 is NOT a clean monotonic map.** KLGLOTT88 assumes perfect OQ↔H1–H2
  correlation (Kreiman_2012), but real speakers use three different strategies:
  (1) OQ+F0 weighted, (2) OQ alone, (3) pulse-asymmetry+F0. Overall r=0.50 only
  (Kreiman_2012). Pulse skewness (asymmetry coefficient) takes over when OQ > 0.7–0.8.
  **Design consequence: do not derive tilt purely from OQ. Treat OQ, skew, and tilt as
  at least partially independent.**
- **Spectral tilt is the strongest single perceptual / gender correlate.** Hanson_1995
  found TL (H1–A3) the best breathiness predictor, more than OQ. Hanson_1999: H1*–A3*
  is the largest gender difference (~9.6 dB). The breathy spectrum acquires an *extra*
  6–12 dB/oct rolloff above a breakpoint f_T = 1/(2πT), where T is the closure time
  constant (Hanson_1997 Eqs. 1–3).
- **Aspiration noise is the single most important breathiness cue perceptually**
  (Klatt_1990 §12: AH=60 dB rated 2.88/5 alone; H1+6 dB only 0.92; all cues combined
  3.76). This overturned the older "H1 amplitude" emphasis. **AH is the headline knob
  for breathiness.**
- **Symmetric pulses are dangerous.** A perfectly symmetric glottal pulse (Qo=0.5,
  Qs=1.0) cancels all odd harmonics → pitch-doubling and missing odd-harmonic formant
  excitation (Titze_2015). Safe zone: Qo outside [0.45, 0.55] OR skewing quotient Qs ≥ 2.0.

---

## 2. THE KNOBS — minimal continuous parameter set

Kreiman's program (Kreiman_Gerratt_2010, Kreiman_2007, Kreiman_2021) is the strongest
theoretical anchor: voice quality = "everything except pitch and loudness" (ANSI),
measured by method-of-adjustment synthesis, NOT rating scales. Their validated
**psychoacoustic model** (Kreiman_2021, 198/200 synthetic copies indistinguishable from
natural; every harmonic-source parameter proven *necessary*) decomposes the source into:

- **Harmonic source: 4 piecewise-linear spectral slopes** — H1–H2, H2–H4, H4→2 kHz,
  2 kHz→5 kHz. All four necessary; the H4–5 kHz region controls "breathy/turbulent"
  brightness and CANNOT be compensated by formant adjustment (Kreiman_2021 Exp. 2).
- **Inharmonic (noise) source: 4 spectral slopes + mean HNR** (0–961, 961–2307,
  2307–3653, 3653–5000 Hz).
- **F0 (mean + contour), amplitude (mean + contour), vocal tract.**

This converges with the PCA result (Kreiman_2007): 78 source measures collapse to **4
independent spectral factors** — (1) H1–H2 / low-freq excitation, (2) overall spectral
slope, (3) high-frequency NOISE excitation (independent of harmonic tilt — validates a
separate AH knob), (4) H2–H4. Critically, mid-frequency (1.5–4 kHz) spectral shape is
>25% of variance and is captured by NONE of the classic single-number measures. **A
single "spectral tilt" scalar is insufficient; we need at least a 3-band source tilt.**

### Recommended knob set (the minimal spanning set)

I recommend a **two-layer** control: a small *perceptual* surface for the frontend, mapped
to a slightly larger *engine* parameter set. Engine knobs, with ranges:

| Knob | Symbol | Range | Default (modal M / F) | What it does | Primary cite |
|---|---|---|---|---|---|
| Voicing amplitude | AV | 0–80 dB | 60 | Source loudness (NOT quality) | Klatt_1990 |
| Open quotient | OQ | 0.30–0.99 | 0.50 / 0.65 | Low-harmonic shape, H1–H2 | Klatt_1990; Hanson_2002 |
| Pulse skew / speed quotient | SQ | 1.4–3.5 (or Qs 1.0–3.5) | 2.6 | Asymmetry; controls H1–H2 when OQ high; vocal effort percept | Childers_Lee_1991; Titze_2015; Kreiman_2012 |
| Closure abruptness / return-phase tilt | TL (or LF `ra`) | 0–41 dB (ra 0–15%) | 8 / 12 | Spectral tilt above breakpoint; THE breathiness/gender knob | Hanson_1995; Klatt_1990 |
| Aspiration amplitude | AH | 0–80 dB (perceptible from HNR≈8 dB) | 0 | Turbulence noise; #1 breathiness cue | Klatt_1990; Hanson_1997 |
| **Aspiration spectral shape** | AH_tilt (≥3 bands) | low-band -12 dB @100 Hz to flat >1 kHz | flat>1kHz | Noise color; the missing mid-freq dimension | Kreiman_2007/2021; Gobl_2003 |
| F1 bandwidth (glottal-leak coupled) | B1 | 50–300 Hz | 60–80 / 120–165 | Widens with breathiness; couples to OQ>0.7 | Hanson_1997; Kreiman_2012 |
| Diplophonia / period-doubling | DI | 0–100% | 0 | Creak, harshness, roughness | Klatt_1990; Gobl_2003 |
| Flutter (slow quasi-random F0) | FL | 0–100% | 25% | Naturalness/life | Klatt_1990 |
| Jitter (fast cycle-to-cycle F0) | — | 0–~2% RAP | ~1% | Roughness; modal ~1–2% (Childers_1990 RAP) | Childers_1990 |

**Opinionated minimal "beauty" surface (frontend-facing), 4 continuous sliders:**

1. **Breathiness** (0→1): co-varies AH↑, TL↑, OQ↑, B1↑, SQ↓, AV↓ (the Gobl_2003
   modal→breathy transform, §3.5). This is the intimacy/warmth axis.
2. **Tension** (−1 lax → +1 pressed): OQ↓, SQ↑, TL↓, B1↓, +small F0 (Gobl_2003
   modal→tense). This is the power/confidence ↔ relaxed axis.
3. **Creak** (0→1): DI↑ to ~25%, F0↓ ~30 Hz, period-doubling on alternate pulses
   (Gobl_2003 creaky/lax-creaky; Klatt_1990 DI). This is the intimate/bored/sad axis.
4. **Roughness** (0→1): jitter + DI without the F0 drop (Gobl_2003 harsh; Childers_1990
   RAP). Use sparingly — it reads as harsh/angry or pathological.

Why these four and not the seven Laver/Gobl labels: Gobl_2003 shows the seven qualities
collapse perceptually onto an **arousal** axis (tense/harsh = high activation;
breathy/whispery/creaky/lax-creaky = low activation), and voice quality codes arousal
NOT valence. Harsh≈tense (not perceptually distinct), whispery≈breathy+more AH. So the
spanning set is: a tension axis, a breathiness axis, a creak axis, and a roughness
modifier. "Whispery" = breathiness slider near max with AV pulled down.

---

## 3. MALE vs FEMALE SOURCE DIFFERENCES (beyond formant scaling)

Hanson_1999 directly measured 21 M vs 22 F and proved the differences are NOT just F0
scaling. Pure 2× F0 time-scaling would leave H1–H2 unchanged and raise H1–A3 by only
6 dB (Hanson_1999 frequency-domain derivation). Observed differences exceed this →
**genuine glottal-configuration differences.**

| Measure | Male mean | Female mean | Gap | Cite |
|---|---|---|---|---|
| H1*–H2* | 0.0 dB | 3.1 dB | ~3 dB (higher female OQ) | Hanson_1999 Table X |
| H1*–A1 | -6.9 dB | -3.9 dB | ~3 dB (wider female B1) | Hanson_1999 |
| **H1*–A3*** (spectral tilt) | **13.8 dB** | **23.4 dB** | **~9.6 dB (largest)** | Hanson_1999 |
| B1 (/æ/) | 126 Hz | 165 Hz | ~40 Hz | Hanson_1999 |
| Noise rating N_w | 1.9 | 2.3 | females noisier | Hanson_1999 |
| Noise in F3 (Klatt scale 1–4) | 1.7 | 2.7 | females noisier | Klatt_1990 |

Physiological root (Hanson_1995/1997/2001; Titze_2014): **females more often have an
incomplete / non-simultaneous glottal closure** — a posterior glottal chink (PGO) and/or
a zipper-like closure along the fold length. ~80% of females show a visible posterior
aperture vs ~20% of males (Klatt_1990 §15). This chink:
- adds a DC leakage flow → raises F1 bandwidth (Hanson_1997 Table I: chink area
  0.00→0.10 cm² takes B1 from 50→302 Hz and adds 0–18 dB tilt at F3),
- adds aspiration noise (the leak is a turbulence source),
- softens closure → steeper spectral tilt.

Hanson splits females into **two groups at H1*–A3* = 23 dB** (Hanson_1997/2001):
Group 1 (abrupt closure, modal-ish, B1 53–100 Hz) and Group 2 (non-simultaneous closure,
breathy, B1 150–280 Hz, more noise). Males cluster tightly at the low-tilt end.

**Design defaults (from Hanson_2002 HLsyn speaker constants, Table VI):**

| Constant | Female | Male |
|---|---|---|
| Modal OQ (OQm) | 65% | 50% |
| Modal spectral tilt (TLm) | 10 dB | 5 dB |
| Modal subglottal pressure (psm) | 6.5 cm H2O | 8 cm H2O |
| Modal glottal area (agm) | 3 mm² | 4 mm² |
| Effective glottal length (Lg) | 0.7 cm | 1.0 cm |

So a female voice preset is NOT a male preset with formants moved up. It is:
higher OQ, ~2× spectral tilt, ~40 Hz wider B1, a small standing posterior-chink
aspiration floor, and more noise. A male voice that wants to read as *intimate/breathy*
borrows the female configuration (raise OQ, TL, B1, add AH) — which is exactly why
breathy male voices read as "soft."

One more male-specific phenomenon worth modeling: **secondary glottal excitation pulses**
(a second, ~50%-delayed pulse per cycle) appear in some male speakers (Hanson_1999 Figs.
4–5), producing alternating-harmonic attenuation. This is a naturalness detail, not a
core knob — implement as an optional second sub-pulse (related to DI machinery).

---

## 4. THE BREATHINESS MECHANISM — intimate vs sick

Breathiness = voiced harmonic source + turbulence noise, mixed. What separates "intimate"
from "sick/pathological" is **how the noise is shaped, gated, and balanced against the
harmonics** — not the raw noise level.

### How aspiration is mixed in a Klatt-style synth

1. **Two parallel sources summed before the cascade tract** (Klatt_1990 block diagram):
   the KLGLOTT88 voiced pulse (at²−bt³, then spectral-tilt low-pass by TL) PLUS a noise
   generator scaled by AH. Both flow through the same formant cascade. Noise source is
   ~-6 dB/oct, ≈flat after radiation (Klatt_1990 §14).
2. **Noise spectral shape**: pseudo-random, **flat above 1 kHz, with a 12 dB rolloff
   below 1 kHz** (down at 100 Hz) (Gobl_2003 AH behavior). This keeps the low end clean
   so the noise sits "above" the voice rather than muddying it.
3. **Pitch-synchronous amplitude modulation of the noise** — THE critical naturalness
   trick. Klatt_1990 and Gobl_2003: when voicing is present, noise amplitude is reduced
   ~50% in the second half of the glottal period → noise is stronger during the open
   phase (when the glottis actually leaks air). Childers_Lee_1991 confirms this is
   *critical* for naturalness: noise onset T_n ≈ 75% of the period (near closure), duty
   cycle D_n ≈ 50%, sounds most natural. **Unmodulated noise sounds like added hiss /
   sick; modulated noise sounds like breath riding the voice.**

### Intimate vs sick — the concrete dividing lines

- **Intimate / sexy / warm** = noise *coherently gated* to the open phase, moderate AH
  (perceptible threshold HNR≈8 dB at F3, Hanson_1995; Gobl_2003 breathy AH 35–50 dB),
  steady HNR, with OQ↑ and TL↑ moving together. The Gobl_2003 breathy setting maps to
  "relaxed, content, intimate, friendly." Lower AV (35–42 dB) so the noise is a
  meaningful fraction of total energy → reads as proximity/whisper-adjacent.
- **Sick / pathological / depressed** = the SAME mean noise level but **temporally
  unsteady** — fluctuating HNR/CPP over time. Kreiman_2021's only 2 synthesis failures
  (out of 200) were caused by time-varying noise levels the steady-state model couldn't
  capture; both were pathological voices. So **steady noise = healthy-breathy; jittery
  noise = sick.** Add roughness (jitter/DI) on top and it crosses into harsh/dysphonic.
- **The "honest/depressed" timbre** is *lax-creaky*, not breathy: low AV, high TL,
  mid OQ, DI 15–25%, F0 dropped ~30 Hz (Gobl_2003 lax-creaky → bored, relaxed, intimate,
  sad). This is the most potent setting for "bored/sad/intimate" and is distinct from
  clean breathiness. It is the depressive cousin of the breathy/intimate voice.

### Mid-frequency noise is the missing ingredient

Kreiman_2007/2021: the 1.5–4 kHz and the H4→5 kHz noise bands carry breathy/turbulent
"brightness" that a single flat AH cannot reproduce and that formants cannot compensate.
**To make breathiness sound like a real warm body and not a noise gate, the aspiration
source needs ≥3 independently shapeable spectral bands**, not one flat generator.

---

## 5. BE REQUIREMENTS (DSP primitives) and FE REQUIREMENTS (control surface)

### Backend (DSP primitives) — what the engine must provide

1. **Voiced glottal pulse generator with continuous OQ and skew.** Either KLGLOTT88
   (at²−bt³) or an LF source. LF is preferred for quality (Childers_Lee_1991: LF gives
   "considerable enhancement," child voice "most strikingly improved"; Gobl_1988
   connected-speech LF data exists). Must expose: amplitude (AV/EE), open quotient (OQ),
   pulse skew (SQ / Qs / rk), and return-phase tilt (TL / ra / ta). Hard constraint from
   Titze_2015: keep effective Qo outside [0.45, 0.55] OR Qs ≥ 2.0 to avoid odd-harmonic
   cancellation and pitch-doubling.
2. **Spectral-tilt low-pass filter on the voiced source**, parameterized as dB-down at
   3 kHz, range 0–41 dB (Klatt_1990 TL). This is separate from the LF return phase if
   using KLGLOTT88; with LF the tilt comes from `ra`.
3. **Aspiration noise generator** with:
   - flat-above-1 kHz, -12 dB/oct below-1 kHz default shape (Gobl_2003),
   - **≥3-band independently-shapeable spectral envelope** (Kreiman_2007/2021 mid-freq
     requirement; FIR-shaped white noise is the validated approach, Kreiman_2021),
   - **pitch-synchronous amplitude modulation** keyed to glottal phase: ~50% reduction
     in the closed half, onset ~75% of period, duty ~50% (Klatt_1990; Childers_Lee_1991).
     This modulation MUST be wired to the same F0/phase clock as the voiced source.
4. **Diplophonia / period-doubling primitive (DI):** delay + attenuate alternate pulses
   (Klatt_1990: linear attenuation 1→0 as DI 0→100%; max delay = closure of pulse N
   meets opening of pulse N+1). Drives creak, harshness, roughness.
5. **Flutter (FL):** slow quasi-random F0 modulation, the 3-sine formula
   Δf0 = (FL/50)(F0/100)[sin(2π·12.7t)+sin(2π·7.1t)+sin(2π·4.7t)] (Klatt_1990 Eq. 1),
   default 25%.
6. **Jitter:** fast cycle-to-cycle period perturbation, ~1–2% RAP modal (Childers_1990).
   Distinct from flutter (slow) and DI (period-2 structured).
7. **Glottal-leak-coupled F1 bandwidth (B1):** B1 must range 50–300 Hz and ideally
   widen pitch-synchronously during the open phase (Klatt_1990 DF1/DB1; Kreiman_2012:
   multiply B1 by 1→3× as OQ goes 0.7→1.0). A standing posterior-chink term raises the
   B1 floor for breathy/female voices (Hanson_1997 Table I).
8. **Time-varying noise level as a first-class control** (not a static mean). Kreiman_2021
   shows steady vs unsteady HNR is the healthy/sick boundary. The HNR/AH contour must be
   schedulable per-frame.

Aerodynamic constraint layer (optional but recommended): the HLsyn equivalent-circuit
model (Hanson_2002, Eqs. 15–37) automatically enforces that AV drops as oral pressure
rises, AH ≈ AV−20 dB at modal glottal area, and forbids simultaneous high-AV+high-AF.
If we don't adopt the full circuit, we should at least enforce these co-variations as
rules so the source never enters physically impossible states.

### Frontend (control surface) — what the FE must expose

- **4 continuous perceptual sliders**: Breathiness, Tension(−lax/+pressed), Creak,
  Roughness (§2). Each is a documented co-variation macro over engine knobs (Gobl_2003
  transforms), not a single engine parameter.
- **A speaker-sex / configuration default** that sets OQm, TLm, B1 floor, psm, and the
  posterior-chink aspiration floor (Hanson_2002 Table VI; Group-1/Group-2 female split
  at H1*–A3*=23 dB, Hanson_2001). NOT just formant scaling.
- **Dynamic (time-varying) voice-quality contours**, because voice quality is
  utterance-position dependent, not a constant: utterance ends drift breathy-laryngealized
  (Klatt_1990; Hanson_2001 reduced vowels show 7–13 dB more tilt and wider B1); onsets/
  offsets glottalize (rapid F0 fall ~30 ms, OQ→30%, AV−6 dB, Klatt_1990 §11; Hanson_2001
  allophonic glottalization). The FE must schedule VQ changes at prosodic boundaries and
  on unstressed/reduced syllables.
- **Provenance hooks**: every VQ setting must carry its citation+tag (e.g.
  `tag: voice_quality, citation: Gobl_2003` for a breathy transform) per project
  Principle 1.

---

## 6. OPEN QUESTIONS and which paper settles each

1. **Does OQ alone set H1–H2?** — Settled NO by Kreiman_2012: speaker-dependent,
   needs OQ + skew + F0; r=0.50 overall. Implement OQ and skew as separable controls.
2. **Which single cue dominates breathiness?** — Settled by Klatt_1990 §12: **aspiration
   noise (AH)**, far above H1 boost or bandwidth. Lead with AH.
3. **What is the biggest real male/female source difference?** — Settled by Hanson_1999:
   **spectral tilt H1*–A3*, ~9.6 dB**, beyond F0 scaling. Female preset = higher tilt +
   higher OQ + wider B1 + chink noise.
4. **Is one spectral-tilt number enough?** — Settled NO by Kreiman_2007 (mid-freq
   1.5–4 kHz is >25% of variance, uncaptured) and Kreiman_2021 (4 source slopes all
   necessary; H4–5 kHz uncompensable). Need ≥3-band source spectral control + ≥3-band
   noise control.
5. **What makes breathiness intimate vs sick?** — Settled by Klatt_1990 +
   Childers_Lee_1991 (pitch-synchronous noise modulation = natural) and Kreiman_2021
   (time-varying noise = pathological). Steady, phase-gated noise = intimate; unsteady
   noise = sick.
6. **Why are register (modal↔falsetto) transitions abrupt, not smooth?** — Settled by
   Titze_2014: bistable glottal geometry (convergent vs divergent), the area ratio
   a1/a2 jumps near rectangular. **Consequence: do NOT linearly interpolate modal→falsetto;
   it will sound unnatural. Snap, or maintain a narrow mixed-voice condition** (balanced
   stiffness, reduced transglottal pressure). Falsetto needs higher subglottal pressure.
7. **How to map LF Qo/Qs to safe harmonic content?** — Settled by Titze_2015: avoid
   Qo∈[0.45,0.55] with Qs<2.0. Pick defaults outside the symmetry danger zone.
8. **How does emotion map to VQ?** — Settled by Gobl_2003: VQ codes **arousal not
   valence**; tense/harsh=high arousal (angry/confident), breathy/creaky/lax-creaky=low
   arousal (relaxed/intimate/bored/sad). For full emotion, combine VQ with F0 dynamics
   (a separate axis).
9. **What about creaky-voice physiology (jitter vs period-doubling)?** — Childers_1990
   gives RAP/jitter measurement and EGG ground truth; Klatt_1990/Gobl_2003 give DI
   (period-doubling) as the synth mechanism. Creak ≈ DI + low F0; roughness ≈ jitter.
10. **Aerodynamic co-variation (can AV and AF be high together)?** — Settled NO by
    Hanson_2002: the circuit model forbids it; AH≈AV−20 dB at modal area. Enforce as
    constraints even if we skip the full HLsyn circuit.

### Deliberately NOT settled by this corpus (flagged for the design)
- Exact LF parameter trajectories for English connected speech beyond the Swedish/limited
  data of Gobl_1988 and Gobl_2003 — we will need our own tuning corpus.
- Whether to ship the full HLsyn aerodynamic circuit (Hanson_2002) or a lighter rule set;
  this is an engineering tradeoff, not a settled science question.
- Child-voice source constants (Gobl_1988 has child LF data: higher ra 5–12%, higher OQ,
  more sinusoidal pulses — but no full synthesis spec).
