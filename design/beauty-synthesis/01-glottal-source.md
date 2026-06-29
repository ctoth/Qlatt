# Beauty Synthesis — 01: The Glottal Source

Clean-room design research. The glottal source is where timbre, body, warmth, and
"sexiness" live in a Klatt-style synth. Everything below is extracted from paper
notes (cited by folder name). This document is opinionated and feeds an
architectural decision; it reuses nothing from the existing klatt80/klsyn88/dectalk
engines.

> Provenance note: `Fant_1995_LFModelRevisited` has no `notes.md` and its PDF is
> password-protected with empty page renders — I could not read it. Its content
> (Rd revisited, transformed parameters) is substantially covered by
> `Fant_1988_LFFrequencyDomainInterpretation` and `Fant_1997_VoiceSourceConnectedSpeech`,
> which I did read. `Sundberg_1979_WaveformSpectrumGlottalVoice` also lacks
> `notes.md`; I read its page PNGs directly (it is actually Sundberg & Gauffin,
> STL-QPSR 2-3/1978).

---

## 1. The source models on the table

We are choosing the mathematical object that generates the glottal flow
derivative U'_g(t) — the signal that excites the formant filters. Four candidates.

### 1a. The impulse / KLGLOTT88 family (what classic Klatt does)

Classic Klatt voicing is an impulse train shaped by a low-pass "glottal resonator"
RGP and an antiresonator RGZ, giving roughly -12 dB/oct
(`Klatt_1980_CascadeParallelFormantSynthesizer`: "Normal voicing: -12 dB/octave
spectral tilt from RGP"). The KLGLOTT88 polynomial source is the explicit version:
flow n_g(t) = t² − t³, derivative 2t − 3t²
(`Doval_2006_SpectrumGlottalFlowModels`).

The fatal limitation, stated bluntly in the literature: **KLGLOTT88 fixes the
asymmetry coefficient αm = 2/3 and cannot vary it**
(`Doval_2006_SpectrumGlottalFlowModels`: "KLGLOTT88 cannot vary the bandwidth
because αm is fixed at 2/3. This is a fundamental limitation compared to LF
model."). αm controls the *bandwidth* of the glottal formant — the single spectral
feature most responsible for the difference between a tense, ringing voice and a
soft, rounded one. A source that can't move it can't reach large parts of the
"beautiful voice" space. Klatt himself flags that his glottal waveform "lacks
proper phase spectrum and spectral zeros seen in natural voicing"
(`Klatt_1980_CascadeParallelFormantSynthesizer`, Limitations).

Verdict: **floor, not goal.** Cheap, well-understood, but expressively capped.

### 1b. The LF model (Liljencrants–Fant) — the reference standard

LF models the flow *derivative* in two phases
(`Fant_1985_LFModelGlottalFlow`):

- Open phase (0 < t < t_e): exponentially growing sinusoid
  E(t) = E_0 · e^(αt) · sin(ω_g t)
- Return phase (t_e < t < t_c): exponential decay
  E_2(t) = −(E_e / (ε·t_a)) · [e^(−ε(t−t_e)) − e^(−ε(t_c−t_e))]

Four time-domain parameters fully determine the pulse: **t_p** (time of positive
flow-derivative peak), **t_e** (instant of the negative peak = main excitation),
**t_a** (return-phase time constant), **E_e** (excitation amplitude at t_e)
(`Fant_1985_LFModelGlottalFlow`, Fig. 2). An area-balance constraint
(∫E dt = 0 over a period) ties α to the others
(`Fant_1985_LFModelGlottalFlow`).

These map to dimensionless, F0-independent "R-parameters"
(`Fant_1988_LFFrequencyDomainInterpretation`):

- **R_g = F_g/F0** (glottal frequency ratio, ~0.7–1.6) — sets glottal-formant freq
- **R_k = (t_e/t_p) − 1** (skew / relative closing) — pulse asymmetry
- **R_a = T_a/T0** (normalized return time) — spectral tilt
- **Q_o = (t_e + t_a)/T0** (open quotient, ~0.3–0.8)

The headline spectral fact: the return phase acts as a **first-order low-pass**
with corner **F_a = 1/(2π·t_a)** (`Fant_1985_LFModelGlottalFlow`,
`Fant_1986_GlottalFlowModelsInteraction`,
`Fant_1988_LFFrequencyDomainInterpretation`). That single number is the master
spectral-tilt / breathiness knob (see §2). LF reaches modal, pressed, and breathy
phonation continuously from one formulation, and matches inverse-filtered real
speech including breathy waveforms better than its predecessors
(`Fant_1985_LFModelGlottalFlow`, Results).

Verdict: **the reference standard and the safe bet.** Decades of analysis-by-
synthesis validation, complete voice-quality coverage, the richest published
control mappings.

### 1c. Rd — LF collapsed to one master knob

`Fant_1997_VoiceSourceConnectedSpeech` introduces **R_d**, a single waveshape
parameter that predicts default R_a, R_k, R_g:

- R_d = (U_o/E_e)·(F0/110)·1000 ≈ T_d/(0.11·T0), where T_d = U_o/E_e ≈ 1 ms
- R_ap = (−1 + 4.8·R_d)/100,  R_kp = (22.4 + 11.8·R_d)/100 (defaults from R_d)

R_d spans ~0.3 (pressed) to ~2.7 (very lax/breathy); **male ~0.5–1.5, female
~0.8–2.5** (`Fant_1997_VoiceSourceConnectedSpeech`, Table 1). The default table
gives, per R_d, the full (R_a, F_a, R_k, R_g, OQ) set — directly usable as a 1-D
voice-quality dial. Crucially it carries a covariation rule (§5) that keeps loudness
and quality coupled the way real voices couple them.

Verdict: **this is the control abstraction we expose.** LF is the engine; R_d is
the steering wheel.

### 1d. CALM — LF re-expressed as a linear filter (causal/anticausal)

`Doval_2003_VoiceSourceCALM` proves the glottal flow can be generated as the
impulse response of a **mixed causal/anticausal linear filter**: 2 *anticausal*
poles (the "glottal formant," giving the right-skewed open phase) + 1 *causal* pole
(spectral tilt). This is the same object as LF, viewed in the frequency domain
(`Doval_2006_SpectrumGlottalFlowModels` unifies KLGLOTT88, Rosenberg C, R++, LF
under 5 generic params T0, E, O_q, αm, Q_a).

Two design gifts from CALM/Doval:

1. **The glottal formant.** A 2nd-order resonance whose *frequency* is set by O_q
   (F_g ≈ f_g(αm)·F0/O_q; ~0.75·F0 when soft/O_q≈1, up to ~3·F0 when pressed/
   O_q≈0.3) and whose *bandwidth* is set by αm
   (`Doval_2003_VoiceSourceCALM`, `Doval_2006_SpectrumGlottalFlowModels`). You can
   literally implement the source as a tunable biquad excited by an impulse.
2. **Independent perceptual axes.** Anticausal poles ↔ tense/lax; causal pole ↔
   loud/weak — and these can be varied independently in model *and* real voice
   (`Doval_2003_VoiceSourceCALM`, "Tenseness and loudness can be varied
   independently").

Cost: anticausal filtering must be computed in *reversed time* (poles outside the
unit circle), so it is naturally pitch-synchronous / block-based, not a trivial
sample-by-sample recursion (`Doval_2003_VoiceSourceCALM`, Implementation).

Verdict: **the best implementation strategy for the engine**, especially because a
biquad "glottal formant" resonator is a primitive we will already have. CALM and LF
are the same physics; CALM is the cheaper, more controllable realization.

### 1e. Physical (body-cover, two/three-mass) models

`Story_1995_BodyCoverVocalFoldModel` is a 3-mass lumped vocal-fold model (cover
upper+lower masses + body mass) integrated with Runge-Kutta at 22 kHz, ~100:1
slower than real time on 1995 hardware. It beautifully *explains* why source
parameters covary (CT vs TA muscle → cover vs body stiffness → F0, vertical phase
difference, open quotient, mucosal-wave velocity), and it self-generates falsetto vs
chest waveforms.

Verdict: **do not put this in the audio path.** Too expensive, hard to control
(you steer stiffnesses, not timbre), and over-kill for a parametric beautiful voice.
Mine it for *parameter covariation priors* only.

### Decision

**Engine = LF, realized as a CALM-style causal/anticausal filter (glottal-formant
biquad + tilt pole). Control = R_d (one master dial) + E_e (amplitude), with the
other LF R-parameters derived from R_d by default and overridable.** This gives LF's
validated realism, CALM's cheap controllability, and Rd's one-knob steering.
KLGLOTT88 is the fallback/ablation baseline; physical models are reference-only.

---

## 2. The knobs — continuous parameters to expose

Ranked by perceptual impact. Fant's own ranking:
**(1) T_a/F_a (most dramatic: breathy↔pressed), (2) E_e (excitation strength),
(3) U_o (fundamental level), (4) R_g, R_k (subtle)**
(`Fant_1988_LFFrequencyDomainInterpretation`).

| Knob | Symbol | Range | What it does / citation |
|------|--------|-------|--------------------------|
| **Spectral tilt** | F_a = 1/(2π·t_a) | ~100 Hz (breathy/voiced-h) → 1000–3000 Hz (male modal); female 430–2000 Hz | THE voice-quality knob. First-order low-pass on the source; ΔL = −10·log10(1+(2π·t_a·f)²). Low F_a = warm/breathy/soft, high F_a = bright/pressed. `Fant_1985`, `Fant_1986`, `Fant_1988` |
| **Master waveshape** | R_d | 0.3–2.7 (male 0.5–1.5, female 0.8–2.5) | Single dial from pressed→lax; predicts R_a, R_k, R_g defaults. `Fant_1997` |
| **Excitation amplitude** | E_e | sets formant-excitation level | Negative peak of U'_g; sets high-frequency / overall level. `Fant_1985`, `Fant_1988` |
| **Open quotient** | O_q (or Q_o) | 0.3 (pressed) – 0.8 (lax), up to 1.0 (soft) | Controls glottal-formant frequency F_g ≈ f_g(αm)·F0/O_q. `Doval_2003`, `Doval_2006` |
| **Asymmetry** | αm (= R_k relative) | 0.6–0.8 (LF valid ≥0.65) | Glottal-formant *bandwidth*; higher αm = narrower/ringier. The knob KLGLOTT88 lacks. `Doval_2006` |
| **Peak flow** | U_o | M ~420, F ~210 cm³/s | Fundamental (H1) amplitude; A_0 ∝ U_o·k·F0. Note U_o/E_e ≈ 1.1 ms, nearly constant M/F. `Fant_1988` |
| **Aspiration amplitude** | AH | breathy: AH = AV − 3 | Adds turbulent noise during the open phase for breath/air. `Klatt_1980` |
| **Fundamental** | F0 | speech 60–500 Hz | Pitch; also scales glottal-formant and (weakly) E_e (see §5). |

Spectral-balance intuition for "rich/warm/present"
(`Fant_1988_LFFrequencyDomainInterpretation`, Key Insights):

- **U_o sets the low end** (fundamental region) → body, chest, "size."
- **E_e sets the high end** (above 2·F_g) → presence, edge, intelligibility.
- **F_a (via t_a) sets the tilt between them** → warmth vs brightness.
- **R_g, R_k tweak only the 2nd–3rd harmonic balance** → subtle, "barely audible in
  [a]" but matters for naturalness.

Sundberg & Gauffin's independent confirmation (`Sundberg_1979`): a quantitative
relation exists between (1) waveform *amplitude* ↔ spectral *fundamental* amplitude
and (2) waveform *shape* (closing time S_c, closed-phase length T_c) ↔ relative
*overtone* amplitudes. They posit a **press↔flow phonatory dimension**: pressed
phonation = low pulse amplitude + long closed phase (weak fundamental, more
high-harmonic energy, "thin"); flow phonation = large-amplitude, near-sinusoidal
pulse (strong dominant fundamental, "warm/round"). This dimension is exactly what
R_d + O_q parameterize. The reference source slope is −12 dB/oct
(`Sundberg_1979`, Fig. III-A-4) and "beauty" lives in deviations from it.

Voice-quality presets from the LF literature
(`Fant_1985_LFModelGlottalFlow`, Voice Quality Parameter Ranges):

| Quality | t_a (ms) | A_e = E_e/E_i | R_d | character |
|---------|----------|---------------|-----|-----------|
| Modal   | 0–0.2    | 1.5–2.5 | 0.5–1.0 | normal |
| Pressed | ~0       | 3–4     | 0.8–1.2 | tense, thin, bright |
| Breathy | 0.6–1.5  | 1–2     | 0.3–0.8 (high R_d on the lax tail) | airy, soft, intimate |

(For a warm-but-present "beautiful" voice, aim modal-to-slightly-flow: moderate
R_d ~0.9–1.3, O_q ~0.6, F_a in the 1–2 kHz band, with a touch of aspiration.)

---

## 3. Source–tract interaction: nonlinear or separable?

The literature documents real interaction effects
(`Fant_1986_GlottalFlowModelsInteraction`): pulse **skewing** (flow shifts right vs
the area function), **superimposed F1 ripple** in the closed phase, **double-peak**
flow derivative when F1 coupling is strong, and pulse-to-pulse amplitude/shape
perturbation even at constant F0. Interaction is driven mainly by the F1 component
of supraglottal pressure and is worse at high F0 (accumulated pressure from prior
periods). `Fant_1979_GlottalSourceExcitationAnalysis` adds that the open glottis
contributes a time-varying **bandwidth increase** to the formants (max instantaneous
B ~600 Hz at flow peak; effective 20–160 Hz).

But the same papers say the *expensive* parts of interaction are small:

- Glottal **friction** contributes 0–2 dB; glottal **inductance** effect also small
  (`Fant_1986_GlottalFlowModelsInteraction`, Results).
- The LF model is explicitly "intended for non-interactive modeling"
  (`Fant_1985`) and is treated as an adequate linear source throughout
  `Fant_1988` and `Fant_1997`.
- Doval goes further: the source *is* a linear filter
  (`Doval_2003_VoiceSourceCALM`), so a linear, separable source-filter chain is
  theoretically sound. (Caveat they raise: if the source is a linear filter,
  inverse filtering can't cleanly separate the glottal formant from low tract
  formants — an *analysis* problem, not a *synthesis* one.)

**Recommendation: linear, separable source→tract is the architecture.** Buy back the
two interaction effects that are cheap *and* perceptually real, as parametric
side-channels rather than true feedback:

1. **Dynamic B1 widening during the open phase.** `Fant_1997` gives a closed form:
   ΔB1 = 250·(F1/500)²·(R_a/12), ΔB2 = ΔB1·F1/(2·F2). Drive B1 from R_a frame-to-
   frame. Cheap, audible, adds the "live" closed-phase ripple character.
2. **Pulse skew** is already intrinsic to the LF/CALM open phase (the anticausal
   poles) — we get it for free.

Do **not** implement true closed-loop source-tract feedback (Story body-cover,
IF72): high cost, marginal benefit for a parametric voice, and it trades away the
controllability that makes the voice steerable. Pay for the two approximations,
skip the physics.

---

## 4. BE (backend / DSP) requirements

Concrete WASM/Rust worklet primitives the new backend must provide. The source
subsystem produces U'_g(t) (flow derivative) that feeds the formant chain; radiation
is the existing first-difference, so the source should output the *derivative*
directly (matches LF and Klatt convention).

1. **`lf-glottal-source` worklet (primary).** Generates one LF flow-derivative pulse
   per fundamental period, pitch-synchronously.
   - Inputs per frame: F0, E_e (amplitude), and R_d (or explicit R_a, R_k, R_g).
   - Internally derive t_p, t_e, t_a, α (α via the area-balance iteration,
     `Fant_1985`/`Gobl_2021`).
   - **Two viable implementations — pick one as default, keep the other as
     ablation:**
     - (a) **CALM realization** (`Doval_2003_VoiceSourceCALM`): a 2-anticausal-pole
       glottal-formant biquad (computed in reversed time over the open phase) +
       1-causal-pole tilt filter. Coefficients: a_p = −π/(O_q·T0·tan(π·αm)),
       b_p = π/(O_q·T0); tilt pole from TL/F_a. This reuses a biquad primitive and
       makes O_q/αm/tilt first-class.
     - (b) **Frequency-domain alias-free LF** (`Gobl_2021_LFModelFrequencyDomain`):
       build the closed-form LF amplitude+phase spectrum per pulse, IDFT to samples,
       concatenate with linear phase delay. Eliminates the aliasing that plagues
       naive time-domain LF at high F0 / low Fs (female/child voices) — directly
       relevant to a *beautiful* voice that must not buzz.
   - **Aliasing is a real backend hazard**: the source spectrum is not band-limited;
     naive sampling adds inharmonic junk that worsens at high F0
     (`Gobl_2021`). Either oversample the time-domain generator or use the
     frequency-domain method.

2. **`spectral-tilt` filter (causal one-pole).** Optional explicit tilt stage if not
   folded into the LF return phase. Realizes F_a = 1/(2π·t_a) / Klatt TL as a
   first-order (or second-order) low-pass; conversion
   t_a = sqrt(10^(TL/10) − 1)/(2π·3000) for "TL dB at 3 kHz"
   (`Doval_2006_SpectrumGlottalFlowModels`). `Doval_2003` gives the digital
   coefficients.

3. **`aspiration-noise` generator + open-phase modulator.** Gaussian noise
   (`Klatt_1980`: sum-of-uniforms, −6 dB/oct LP), amplitude-modulated by the glottal
   open phase so breath rides on the flow (breathy voice). Needed for AH and for the
   air in "intimate" timbres.

4. **`micro-modulation` unit (jitter/shimmer/flutter).** Period-to-period F0 jitter
   and E_e shimmer, plus slow flutter. Real voices have it; `Fant_1997` explicitly
   notes its model does *not* cover jitter/shimmer (a gap to fill from elsewhere —
   Klatt 1990). This is a large part of "alive vs robotic."

5. **`dynamic-bandwidth` side-channel.** Apply ΔB1/ΔB2 to the formant resonators per
   frame from R_a (`Fant_1997`, §3). Not a source primitive per se but driven by
   source state.

6. **Glottal-formant biquad as a shared primitive.** Whether or not we use full
   CALM, exposing the glottal formant (freq ∝ F0/O_q, bandwidth ∝ αm) as a tunable
   2nd-order resonator is the cleanest way to get the low-frequency "voice color"
   right (`Doval_2003`, `Doval_2006`).

---

## 5. FE (frontend / control-surface) requirements

What the linguistic→control track must drive, frame to frame (5 ms or so).

- **Per-frame source vector:** F0, E_e (or AV), R_d, O_q, F_a (or TL), αm,
  aspiration amplitude, jitter/shimmer depth. R_a/R_k/R_g default from R_d
  (`Fant_1997` Table 1) unless explicitly set.

- **The covariation rule is mandatory** (`Fant_1997`): a 1 dB change in 1/R_d must
  co-occur with a 2 dB change in E_e. The FE must move E_e and R_d together so
  louder→tenser→brighter tracks the way real voices do. Treating them independently
  produces an uncanny voice.

- **Phrase-level E_e contour** (`Fant_1997`, §"Phrase Contour"):
  onset rise ~50 ms; main declination ~2 dB/s; accelerating final fall to ~6 dB/s
  over the last 300–500 ms; plus segment-specific dips (voiced consonants get higher
  R_d, lower E_e, ~10 dB span from vowels to stops).

- **Effort → source mapping** (`Sundberg_2005_GlottalSourceLoudness`,
  `Fant_1997`): drive from a normalized excess subglottal pressure PSEN. Sundberg
  gives sex-differentiated regressions usable directly:
  - Q_closed = A − e^(−α·PSEN + B) (saturating; A≈0.49 at modal F0, lower at high F0)
  - MFDR = C·PSEN + Icpt (linear; males 2–3× female slope)
  - peak-to-peak flow Û = C·PSEN + Icpt (linear)
  - H1−H2 = C·Q_closed + Icpt (more effort → higher Q_closed → smaller H1−H2 →
    more harmonics → brighter)
  Fant's SPL coupling: ΔSPL ≈ 9 dB when doubling Ps from 4→8 cmH2O (`Fant_1997`).

- **Voice-quality targets per segment / affect.** Map perceptual goals to R_d / F_a:
  warm-intimate = high-ish R_d + low F_a + light aspiration; bright-projecting =
  low R_d + high F_a + high E_e (the "press" end). H1*−H2* handles for analysis-by-
  ear: H1*−H2* = −6 + 0.27·e^(5.5·OQ_i) or ≈ −7.6 + 11.1·R_d (`Fant_1997`).

- **Speaker presets (male/female).** Base R_d (male ~0.7, female ~1.4), F0r
  saturation boundary (male 110–160 Hz, female 200–300 Hz) above which E_e stops
  growing with F0 (`Fant_1997`); U_o/E_e ≈ 1.1 ms for both (`Fant_1988`) so derive
  one from the other.

---

## 6. Open questions and which paper settles each

1. **Time-domain oversampled LF vs frequency-domain alias-free vs CALM filter — which
   default?** All three produce the same target spectrum; they differ in CPU,
   latency, and how cleanly per-frame R_d changes interpolate. *Settle with:*
   `Gobl_2021_LFModelFrequencyDomain` (alias-free freq-domain) vs
   `Doval_2003_VoiceSourceCALM` (filter form); needs a build-and-measure bake-off in
   our own backend, not just reading. Decision is empirical.

2. **Is independent αm control worth the cost over KLGLOTT88's fixed 2/3?**
   `Doval_2006_SpectrumGlottalFlowModels` argues yes (αm = glottal-formant bandwidth,
   a real timbre axis KLGLOTT88 can't reach) — but quantitatively how audible is it
   in connected speech? *Settle with:* `Doval_2006` Fig. 9/16–17 plus a perceptual
   JND check (needs Henrich 2003 JND data — not in this set; flag for retrieval).

3. **Jitter/shimmer/flutter values.** None of these papers specify them;
   `Fant_1997` explicitly excludes period-to-period variation. *Settle with:*
   Klatt & Klatt 1990 (`Klatt_1990_VoiceQualityVariations`, in collection but not in
   this reading set) — retrieve its FL/DI/jitter parameterization next.

4. **How much source–tract interaction to fake.** We chose linear + two cheap
   side-channels (§3). Is the dynamic-B1 ΔB formula enough, or do we also need the
   double-peak / ripple for naturalness at high F0? *Settle with:*
   `Fant_1986_GlottalFlowModelsInteraction` (interaction taxonomy) vs an A/B render;
   the double-peak is "not a bug" but may be inaudible after radiation.

5. **Glottal-formant vs first-formant separability in synthesis.** CALM warns the
   glottal formant (≈0.75–3·F0) can sit near F1 and is hard to separate in
   *analysis* (`Doval_2003`). In *synthesis* we control both, but their interaction
   near low F1 vowels (e.g. [u], [i]) needs checking. *Settle with:*
   `Doval_2006` Fig. 16 (Fmax/F0 vs O_q) plus render tests.

6. **Effort model: trained vs untrained constants, and PSEN→LF mapping.**
   `Sundberg_2005` gives untrained-voice regressions in flow-glottogram measures
   (Q_closed, MFDR), not directly in LF R-parameters. *Settle with:* `Sundberg_2005`
   (its own Open Questions flag this) cross-walked through `Fant_1997`'s R_d↔OQ↔E_e
   relations; may also want Sundberg 1999 (singers) for the "beautiful/trained" end.

7. **Fant_1995 gap.** Could not read `Fant_1995_LFModelRevisited` (locked PDF).
   It is the canonical "transformed-parameters" treatment; if any Rd/Ra/Rk detail
   below feels under-specified, re-acquire an unprotected copy.
