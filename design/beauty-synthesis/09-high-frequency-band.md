# 09 — The High-Frequency Band (>5 kHz): Brilliance, Air, Sheen

Clean-room design note for the new synthesizer. This corrects a gap: our first six-reader
sweep stopped at the formant/source story below ~5 kHz. The band **above ~5 kHz** carries
naturalness, brightness, talker identity, gender, and the female/singing "sparkle." This
note establishes that the band is perceptually real, that a Klatt-style synth **cannot**
fold it into a single higher-pole-correction term, and what explicit machinery the new
backend (BE) and frontend (FE) must expose.

**Bottom line (the hypothesis, confirmed):** the standard higher-pole correction term is a
single static, smooth, uncontrollable boost. The >5 kHz band demands the exact opposite:
**vowel-dependent, gender-dependent, phoneme-dependent, source-dependent, and time-varying
structure**. We need explicit high-frequency machinery, not a correction term.

---

## 1. IS THE >5 kHz BAND PERCEPTUALLY REAL?

Yes, unambiguously, and the historical "nothing matters above 4 kHz" assumption (born of
telephone bandwidth and the 4 kHz articulation-index ceiling) is wrong.

**Definition.** "High-frequency energy" (HFE) = the **8-kHz and 16-kHz octave bands ≈ 5.7–22
kHz** (Monson_2014, §HFE Definition). Sub-bands matter differently:

- **Naturalness — the critical region is 7–10.9 kHz** (Monson_2014 Parameters table;
  Moore & Tan 2003). The *largest* naturalness drop occurs when the upper cutoff falls from
  **10.9 kHz → 7 kHz** (mean naturalness ~8 → ~5.5 on a 1–10 scale), with a further large
  drop at the step to **5.6 kHz** (~3.5). Listeners reliably prefer a 10 kHz cutoff over 7.5
  kHz (Füllgrabe 2010). This is the single most important number in the file: **7–10.9 kHz is
  where "natural" lives.**
- **Brightness / quality.** Listeners spontaneously use quality words for changes above 5 kHz
  (Monson_2014 Table 2). The **6–8 kHz** spectral level correlates with perceived
  *breathiness* (Hammarberg 1980, via Monson_2014): breathy voices keep the 5–8 kHz band
  nearly level with the 2–5 kHz band rather than rolling off.
- **Talker ID / gender.** Speaker-recognition accuracy climbs **88% at 6 kHz bandwidth → 96%
  at 16 kHz** (Hayakawa & Itakura, via Monson_2014). Fricative-based gender discrimination:
  93% (/s/), 90% (/ʃ/), dropping to 74% (/f/) and 69% (/θ/) — the high-frequency *peak
  position* is the talker/gender cue.
- **Localization.** Front-back errors rise significantly when speech is low-passed at **8 kHz**
  (Best 2005, via Monson_2014); elevation accuracy degrades in 20-dB HFE steps.
- **Intelligibility.** Consonant ID is maintained at **75% with an 8 kHz high-pass** and the
  drop from 8→10 kHz isolates a useful **8–10 kHz consonant band** (Lippmann 1996). Listeners
  give the **highest** weight to the **3.5–10 kHz** band for consonant ID when the low spectrum
  is degraded (Apoux & Bacon 2004). The 8-kHz octave's amplitude modulation is the single best
  predictor of overall intelligibility (LeGendre 2009).

**How far down is it?** HFE sits **15–17 dB below the overall speech level** and **30–45 dB
below the band with maximum energy** (Monson_2014, Table 1 + Parameters). Concretely, scaled
to 65 dB SPL overall, mean HFE ≈ **47 dB SPL** in normal speech. Monson_2012's on-axis read:
overall **62.0 dB SPL @ 1 m**, with the **8-kHz octave at 46.4 dB and the 16-kHz octave at
38.0 dB** (Monson_2012 Table I, 0°). So the design target for the new synth's on-axis output:
**8-kHz octave ≈ 16 dB below overall; 16-kHz octave ≈ 24 dB below overall.** That is the
calibration the "air" machinery must hit — present, but well below the F1–F3 energy.

---

## 2. FEMALE vs MALE, AND SINGING

**Female voices carry MORE HFE, and the surplus is specifically high.**

- Female HFE is **2–6 dB higher** than male across studies (Monson_2014 Table 1: e.g. Monson
  2012a 48.2 dB M vs 51.0 dB F; Byrne 43.7 vs 46.3). Crucially the **gender difference is
  significant only in the 16-kHz octave (8–22 kHz); the 8-kHz octave shows no significant
  gender difference** (Monson_2014, §Gender Differences in HFE). **Translation for a flagship
  female voice: the "sparkle" that reads as female lives above ~8 kHz, not at 5–8 kHz.** A
  synth that stops at 8 kHz throws away the female cue.
- Vowel dependence: HFE peaks are higher in level for **/a/, /e/, /i/** than for **/o/, /u/**
  (Shoji 1991, via Monson_2014). HFE is not a constant "air layer" — it tracks vowel identity.
- A **spectral dip near 5 kHz** from the **piriform fossa antiresonance** (Dang & Honda 1997,
  via Monson_2014) sits right between the top "speech" formants and the HFE peaks. Real voices
  have a notch here; a flat HF shelf would sound synthetic.
- Fricative front-cavity peaks move **up ~1–2 kHz for women**: /s/ F_M ≈ **3–7 kHz (men) →
  3–8 / 5–8 kHz (women)** (Shadle_2023 Table I + §Gender). Shorter tract → higher /s/.

**Singing.** Directivity is *identical* for speech and singing (Monson_2012, DI = 2.1 dB both),
so speech-derived HF targets transfer to song. What changes:

- The classic **singer's formant is ~2.8–3.2 kHz** (Sundberg_1972) — this is *below* F6 and
  is **not** our >5 kHz axis. It is a clustering of F3/F4/F5 from a lowered larynx (larynx-tube
  Helmholtz resonator ≈ 2.8 kHz) plus a **piriform-sinus zero at ~3.5–4 kHz**, giving ~**20 dB
  gain at 3 kHz** for sung vs spoken /u/. Useful, but a separate (lower) chapter.
- **Above the singer's formant**, the literature is explicit that real HF structure persists:
  a **second "singer's formant" peak near 10 kHz** in trained tenors from the epilaryngeal
  tube (Titze & Sung 2003), and **harmonic energy out to 20 kHz** in singing (Ternström 2008),
  both via Monson_2014. So for singing the BE must carry controllable structure at **~10 kHz**
  and harmonic content to **~20 kHz** — not just a rolled-off shelf.
- **Source brightness rises with pitch and effort in song.** In mechanism M2 (female head
  register, Oq 0.5–0.95) higher f0 **lowers Oq** (partial r up to −0.79, Henrich_2005) → more
  abrupt closure → flatter source spectrum → **brighter at high notes**. In M1, louder lowers
  Oq (r up to −0.90). Sundberg_1993: as **F1/F0 < 3** the pulse becomes symmetric and the
  spectrum flattens (brighter). Net: **the female-singing "ring" is partly a source effect
  (Oq↓, return-phase↓) that the HF machinery must respond to, not just a fixed filter.**

---

## 3. WHERE A KLATT-STYLE SYNTH NEEDS EXPLICIT HF STRUCTURE

### (a) Can the higher-pole correction term substitute for real >F6 content? **No.**

The Klatt higher-pole correction is a **single, static, monotonic spectral boost** that
approximates the aggregate skirt of the infinite series of poles above the top simulated
formant. It has **no parameters you can steer**. The >5 kHz band requires, simultaneously,
five things the correction term structurally cannot provide:

1. **The ~5 kHz piriform-fossa notch** — a *zero*, i.e. a dip. A monotone boost cannot make a
   notch (Monson_2014 §5 kHz dip).
2. **Vowel-dependent HFE** — /a,e,i/ > /o,u/ (Shoji 1991). The correction term is identical
   for every vowel.
3. **The 16-kHz-octave gender cue** — female surplus is *specifically* above 8 kHz
   (Monson_2014). A correction term scaled to overall level can't move energy into one octave.
4. **Fricative peaks at 5–9 kHz with the right slopes** — /s/ peak, /f,θ/ flat-or-rising
   (Shadle_2023; §4 below). The correction term is a fixed voiced-tract skirt; it knows nothing
   about frication.
5. **Independent HF *noise* excitation** — Kreiman_2007 Factor 3 ("high-frequency noise
   excitation", 10.8% of source variance) is **statistically orthogonal** to spectral tilt and
   H1-H2. You cannot reach it by scaling a deterministic correction.

The strongest single piece of evidence: Kreiman_2021's *validated* psychoacoustic model — the
one that made 198/200 synthetic voices indistinguishable from natural — uses **11 formants +
3 spectral zeros + a 4-piece source**, and that entire model was fit at **10 kHz sampling, i.e.
only to 5 kHz**. **Eleven formants were needed to capture quality within 0–5 kHz alone.** That
is the death certificate for "one correction term handles everything above F6": the field's
best copy-synthesis needed dense explicit structure even *below* the band we are discussing.

### (b) How many high formants / what HF branch amplitudes?

Kreiman_2021's **11 formants** (with 11 bandwidths) + **3 zeros** (with 3 bandwidths) are the
benchmark. Breakdown of what they are *for* (Kreiman_2021 Table I; Kreiman_2007):

- **F1–F3:** vowel identity (the classic story).
- **F4–F6 (~3–5 kHz):** timbre / talker color; includes the singer's-formant cluster region
  (Sundberg_1972) and the mid-frequency 1.5–4 kHz band that Kreiman_2007 flags as **>25% of
  source spectral variance that existing measures completely miss**.
- **F7–F11 (~6–18 kHz, female-scaled):** the HFE band proper — naturalness (7–10.9 kHz),
  the 16-kHz-octave gender cue, fricative peaks.
- **3 zeros:** the ~5 kHz piriform notch, nasal antiresonances, and source/tract zeros.

For the new synth I recommend, female-scaled (shorter tract → higher formants):
**F1–F6 individually controllable** (vowel + timbre), then **F7–F11 as a semi-fixed HF
cascade** at roughly **7, 9, 11, 13, 16 kHz** with per-formant amplitude trims, **plus a
parallel "air"/frication branch** carrying A7–A11. Suggested resting amplitudes (voiced,
on-axis, relative to the F1–F3 envelope), reconciled to Monson's calibration (8-kHz octave
−16 dB, 16-kHz octave −24 dB from overall):

| Branch formant | Center (female) | Voiced resting level | Fricative role |
|---|---|---|---|
| A7 | ~7 kHz | −16 dB (most perceptually critical, naturalness floor) | /s/, /f/, /θ/ primary |
| A8 | ~8–9 kHz | −18 dB | /f/, /θ/ peak; female gender onset |
| A9 | ~10 kHz | −20 dB (singer's 2nd-formant region) | /f/, /θ/ broadband |
| A10 | ~12–13 kHz | −22 dB | non-sibilant rising tail |
| A11 | ~15–16 kHz | −24 dB (16-kHz octave gender cue) | sibilant/non-sibilant air |

All HF amplitudes **+2 to +4 dB for the female preset vs a notional male** (Monson_2014
§Gender), concentrated in A9–A11. These are engineering estimates anchored to Monson_2012
Table I octave levels — flag as such until copy-synthesis tuning refines them.

### (c) The H4–5 kHz / 2k–5k source-slope finding (Kreiman) and breathiness/brightness.

Kreiman_2021's harmonic source is a **4-piece piecewise-linear spectrum: H1–H2, H2–H4,
H4→2 kHz, 2 kHz→5 kHz**. Experiment 2 collapsed adjacent pieces and re-fit formants to
compensate. **The H4–5 kHz merger (collapsing the H4→2 kHz and 2 kHz→5 kHz source slopes into
one line) produced the WORST perceptual match — mean d′ = 2.25, exceeding the d′ = 2.10
discriminability criterion — and the damage was to "breathy/turbulent quality and brightness"
and was NOT correctable by formant adjustment** (Kreiman_2021 §Exp 2; Table II). 

This is decisive: the **slope of the *source* between 2 and 5 kHz is an independent,
perceptually load-bearing control for brightness/breathiness that the vocal-tract filter
cannot fake.** It is corroborated from the physiology side: Gauffin_1989 shows the
**return-phase time constant t_a controls spectral tilt = HF content** (t_a = 0.15 ms → sharp
closure, strong HF; t_a = 0.6 ms → soft closure, weak HF), with E_e acting as a flat "volume
control" on all overtones. So **brightness has two knobs**: the source return-phase/tilt (t_a /
TL) and the explicit HF filter structure — and they are not interchangeable. The 6–8 kHz band
specifically tracks breathiness (Hammarberg, via Monson_2014), and Kreiman_2007 confirms HF
*noise* excitation is yet a third orthogonal axis.

---

## 4. FRICATIVES IN THE HF BAND

This is where the >5 kHz band stops being a luxury and becomes intelligibility. The parallel
noise branch must produce the *right spectral shape up high*, or fricatives sound dull and
mush together.

**Peak positions (the talker/place cue):**
- **/s/, /z/:** front-cavity peak **F_M ≈ 3–7 kHz (men), 5–8 kHz (women)**; energy substantial
  through **11–15 kHz** (Shadle_2023 Table I, §HFE; Monson_2014 5.5–8 kHz). Directivity
  confirms /s/ energy is concentrated in the **8-kHz octave** (Monson_2012, DI 5.3 dB).
- **/ʃ/, /ʒ/:** lower peak, **F_M ≈ 2–4 kHz** (Shadle_2023; Hughes_1956 2–4 kc); energy in the
  **4-kHz octave** (Monson_2012, DI 4.6 dB); steeper rolloff above the peak than /s/.
- **/f/, /θ/ (and /v/, /ð/):** **broadband, FLAT or slightly RISING toward high frequency**,
  with the high-frequency maximum **F_h ranging 5–12 kHz** and modest **AmpRange 10–20 dB**
  (Shadle_2023 §Non-Sibilant, Table). Hughes_1956: /f/ has such a short front cavity it
  **often shows no peak below 10 kHz** and sometimes a peak ~8 kHz; low-frequency /f/ energy is
  *not* front-cavity resonance. /f/ peaks higher than /θ/.

**The crisp-not-dull rule (Shadle_2023 §Key Principle):**
> Non-sibilant fricatives must NOT have a steeply falling HF envelope. They should be **flat or
> slightly rising from mid to high frequency.** Applying a uniform spectral tilt to all
> fricatives is *wrong* — it dulls /f/ and /θ/.

So the noise branch needs **two regimes**:
1. **Sibilants** — a sharp front-cavity resonance (A_M, the parallel-branch peak at
   F_M = 3–4 kHz for /ʃ/, 5–8 kHz for /s/) on a deep low-frequency trough (**Amp_D ≈ 25–35 dB
   for /s/**, deeper than /ʃ/'s ~20–30 dB, Shadle_2023). /s/ slope from peak ≈ **−3 to −6
   dB/kHz** but energy persists to 15 kHz.
2. **Non-sibilants** — **near-unfiltered broadband noise** with a *flat-to-rising* envelope to
   **12–15 kHz**, peak F_h in 5–12 kHz, only ~10–20 dB total amplitude range. This argues for a
   noise path that can present essentially **white (or HF-shelved-up) noise**, not noise forced
   through a single low resonator.

**Temporal dynamics:** HF energy is not static within a fricative — the peak-to-HF slope gets
*less steep over the course of the fricative* (Shadle_2023 §Temporal). So **A7–A11 should ramp
during the fricative**, not step.

---

## 5. BE AND FE REQUIREMENTS

### Backend (DSP) requirements

1. **Sample rate / Nyquist — this is forced, not a preference.**
   - Fricative measures run to **15 kHz** (Shadle_2023 Level_HH = 11–15 kHz); HFE perceptual
     studies run to **22 kHz**; the female gender cue is the **16-kHz octave (8–22 kHz)**;
     singing harmonics reach **20 kHz** (Ternström, via Monson_2014).
   - **Decision: design at 48 kHz (Nyquist 24 kHz), or at minimum 44.1 kHz (Nyquist 22.05 kHz)
     — the rate Monson_2012 and Shadle_2023 themselves recorded at.** A 32 kHz rate (Nyquist
     16 kHz) would cover the 7–10.9 kHz naturalness region and the 8-kHz octave but **clips the
     16-kHz octave that carries the female sparkle** — unacceptable for a flagship female voice.
     Do **not** design the core DSP at 16 kHz/22.05 kHz half-rates.
   - **Noise path bandwidth must reach the Nyquist** (15+ kHz of usable frication), because
     /f/, /θ/, /s/ all carry energy to 15 kHz.

2. **Explicit high-formant cascade: F7–F11** at ~7/9/11/13/16 kHz (female-scaled), each with
   frequency, bandwidth, and amplitude. Not a correction term. (Kreiman_2021's 11 formants.)

3. **At least 3 spectral zeros**, one dedicated to the **~5 kHz piriform-fossa notch**
   (Monson_2014), the others for nasal antiresonance and source zeros. A pure all-pole HF
   section will sound flat-bright and synthetic without this dip.

4. **A shaped HF / "air" shelf** layered above the discrete formants — a gentle, steerable
   shelf from ~5 kHz to Nyquist that supplies the broadband "air" between the resolved high
   poles and supplies the female 16-kHz-octave surplus. Calibrate to **−16 dB (8-kHz oct) /
   −24 dB (16-kHz oct)** relative to overall (Monson_2012 Table I).

5. **Two-regime parallel noise branch** (§4): a sharp resonant path for sibilants (steerable
   F_M, A_M) **and** a flat/rising broadband path for non-sibilants. A_M and the HF noise
   amplitudes must **ramp** through the fricative (Shadle_2023 temporal).

6. **Source-spectrum control above H4, including the 2–5 kHz source slope as its own
   parameter** (Kreiman_2021's H4→2 kHz and 2 kHz→5 kHz pieces kept *separate*), plus a
   return-phase / spectral-tilt control (t_a / TL, Gauffin_1989) and an **independent HF noise
   excitation** level (Kreiman_2007 Factor 3 / aspiration). These three are orthogonal — give
   them three real knobs.

7. **Aspiration/breath noise high-passed and pitch-synchronous.** Lu_Smith: aspiration noise
   HP at **~4 kHz default (1.2–2 kHz for breathier)**, amplitude ~**4% of E_e**, Hanning-
   windowed ~10% after the glottal closure instant so it *integrates* perceptually rather than
   segregating. This is the mechanism that puts controllable energy into the 5–8 kHz
   breathiness band.

### Frontend (control-surface) requirements

1. **A single "Brilliance / Air" scalar** as the headline knob, internally mapped to a small
   coordinated vector (so one slider does the musically right thing): {HF shelf gain above
   ~5 kHz, source 2–5 kHz slope, return-phase/TL, HF aspiration level}. Range anchored so that
   "neutral" hits Monson's −16/−24 dB octave calibration and "max" approaches breathy-voice HF
   levels (5–8 kHz band level with 2–5 kHz).

2. **A gender/voice-type axis** that, toward "female," adds **+2 to +4 dB concentrated in the
   16-kHz octave (A9–A11 / the air shelf)** and raises /s/ F_M by ~1–2 kHz (Monson_2014;
   Shadle_2023).

3. **Per-fricative place control** exposing sibilant vs non-sibilant regime, F_M, and the
   flat/rising non-sibilant HF tilt — so a phoneme rule can say "/f/: broadband, rising to 12
   kHz" vs "/s/: peak 6.5 kHz (female), −4 dB/kHz, energy to 15 kHz."

4. **A "ring / projection" control for singing** that engages the ~10 kHz second-singer's-
   formant region (Titze & Sung) and lets harmonic content extend toward 20 kHz, coupled to
   the Oq↓-with-pitch behavior (Henrich_2005) so high notes brighten automatically.

5. **Brightness must also be reachable from prosody/stress**, since spectral balance (energy
   above 500 Hz, i.e. relative HF level) is the **second-strongest stress cue after duration**
   and is robust to reverberation, while overall intensity is a near-useless cue
   (Sluijter_1996: stressed = flatter spectrum, TL reduced **3–9 dB**). So the stress rule
   should drive the same tilt/brilliance vector, not just AV.

---

## 6. OPEN QUESTIONS AND WHICH PAPER SETTLES EACH

| # | Question | Best settling source | Status |
|---|---|---|---|
| 1 | Exact Hz of the "naturalness" critical band | **Monson_2014** (Moore & Tan): **7–10.9 kHz** | Settled |
| 2 | How far down is HFE (calibration target) | **Monson_2014 / Monson_2012**: −15/−17 dB vs overall; 8-kHz oct −16 dB, 16-kHz oct −24 dB | Settled |
| 3 | Where is the female surplus | **Monson_2014**: **16-kHz octave only** (8–22 kHz); 2–6 dB | Settled |
| 4 | Can a higher-pole term replace >F6 structure | **Kreiman_2021** (11 formants needed even ≤5 kHz) + Monson §5 kHz notch | Settled: **No** |
| 5 | Is the 2–5 kHz *source* slope perceptually real | **Kreiman_2021** Exp 2 (H4–5 kHz merger worst, d′=2.25, not formant-correctable) | Settled |
| 6 | Is HF noise excitation independent of tilt | **Kreiman_2007** Factor 3 (10.8% variance, orthogonal) | Settled |
| 7 | Fricative HF shapes (/s/ vs /ʃ/ vs /f,θ/) | **Shadle_2023** (to 15 kHz) + **Hughes_1956** + **Monson_2012** directivity | Settled |
| 8 | Non-sibilant HF tilt direction | **Shadle_2023**: flat/**rising**, not falling | Settled |
| 9 | Singing structure *above* the singer's formant | **Monson_2014** (Titze&Sung ~10 kHz; Ternström to 20 kHz) | Partially settled (mechanism modeled in Sundberg_1972 only ≤3 kHz) |
| 10 | How brightness covaries with pitch/effort in song | **Henrich_2005** (Oq↓ with f0 in M2; r −0.79) + **Sundberg_1993** (F1/F0<3 → flatter) | Settled (rule), magnitudes for female head register thin |
| 11 | Aspiration HF noise spectral shaping | **Lu_Smith** (HP 4 kHz, An ≈ 4% E_e, pitch-sync) — note original paper calls shaping "under investigation" | Open: shaping needs copy-synthesis tuning |
| 12 | Exact per-phoneme A7–A11 amplitudes | None directly — **Shadle_2023** + **Monson** constrain shape; absolute levels are engineering estimates | Open: tune by `npm run measure` against recorded female /s,f,θ/ |
| 13 | How to render the ~5 kHz piriform notch in this framework | **Monson_2014** identifies it (Dang & Honda); depth/bandwidth unmeasured here | Open |

### What this corrects in the existing spec
The prior six-reader sweep treated everything above F6 as a tail to be folded into a
higher-pole correction. **That is wrong for a beautiful female/singing voice.** The >5 kHz
band is (1) perceptually real with a sharp **7–10.9 kHz naturalness core**, (2) the **specific
locus of the female cue** (16-kHz octave), (3) **un-substitutable** by any single correction
term, and (4) the make-or-break band for crisp fricatives. The new backend must run at
**44.1–48 kHz**, carry **explicit F7–F11 + ≥3 zeros + a steerable HF "air" shelf + a
two-regime noise branch to 15 kHz**, and expose a coordinated **Brilliance/Air** control that
moves the HF shelf, the 2–5 kHz source slope, the return-phase tilt, and the HF aspiration
together.
