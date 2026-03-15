# Verdict: Source-Filter Interaction

## Papers Considered

- Fant_1960_AcousticTheorySpeechProduction
- Fant_1985_LFModelGlottalFlow
- Fant_1986_GlottalFlowModelsInteraction
- Rothenberg_1981_InteractiveVoiceSource
- Sun_2006_VocalTractGlottalSource
- Kamiloglu_2021_VoiceProductionPerception
- Bonada_2008_VoiceSynthesisSpectralModels
- McGowan_Howe_2007_CompactGreensFunction
- Kaburagi_2007_VocalTractSpectrum
- Laine_1988_HigherPoleCorrection
- Titze_1992_VocalIntensity
- Richards_1968_AcousticRadiationFundamentals
- Lin_1995_CascadeIntoParallel
- Holmes_1983_FormantSynthesizersCascadeParallel
- Klatt_1980_CascadeParallelFormantSynthesizer
- Stevens_1989_QuantalNatureSpeech
- Stevens_1998_AcousticPhonetics
- Yegnanarayana_1998_VocalTractExtraction
- Schwarz_Rodet_SpectralEnvelopeEstimation
- Milner_2002_MFCCReconstruction
- Chalker_1985_MouthRadiationImpedance
- Story_1996_VocalTractAreaFunctionsMRI

## Historical Timeline

**1960 -- Fant** establishes the source-filter model: P(f) = S(f) * T(f) * R(f). Source and filter are "approximately independent." The voice source has -12 dB/octave slope; radiation adds +6 dB/octave; net -6 dB/octave. Vocal tract is a cascade of formant resonators. This is the founding assumption of all formant synthesis.

**1968 -- Rabiner & Gold** implement digital formant synthesis using impulse-invariant transformation. Claim digital systems do not need higher-pole correction. (Later shown to be wrong by Laine 1988.)

**1968 -- Richards & Mead** publish aeroacoustic radiation theory. Not speech-relevant. (Appears to be in collection by accident.)

**1980 -- Klatt** publishes the cascade/parallel formant synthesizer. Architecture fully embodies source-filter independence: glottal source generates flow, which is routed through either cascade (vowels) or parallel (fricatives) formant chains, then through a first-difference radiation filter. Source and tract are completely decoupled. Parallel branch uses fixed ndbScale offsets (A1=-58, A2=-65, A3=-75, A4=-78, A5=-79, A6=-80) to approximate cascade spectral balance.

**1981 -- Rothenberg** demonstrates source-filter interaction via inertive vocal tract loading. Key findings: (1) vocal tract inertance transforms symmetric glottal area pulses into asymmetric sawtooth flow; (2) the f1/f0 ratio controls excitation strength for ALL formants, not just F1; (3) back vowels produce greater glottal flow asymmetry than front vowels due to higher pharyngeal inertance. Introduces normalized inertance parameter Lt with critical range 0.2-1.0.

**1983 -- Holmes** argues parallel formant synthesis is superior to cascade for all sounds. Key insight: cascade synthesizers cannot account for source spectrum changes with vocal effort (which violate source-filter independence). Introduces per-formant voicing offset mechanism.

**1985 -- Fant, Liljencrants & Lin** publish the LF four-parameter model of glottal flow derivative. Captures return phase via ta parameter. Spectral tilt controlled by Fa = 1/(2*pi*ta). Does NOT model source-filter interaction -- explicitly a "non-interactive" parametric model.

**1985 -- Chalker & Mackerras** show Flanagan's radiation impedance (used in Klatt) has 13.4 ohms reactance error at 5 kHz for large mouth apertures. Propose a two-term approximation with <1.8 ohms error.

**1986 -- Fant** extends LF model with source-filter interaction analysis. Shows: (1) F1 drives pulse skewing and superimposed ripple; (2) interaction effects are more severe at high F0; (3) double-peak flow derivative is real, not artifact; (4) the LF model parametrically absorbs interaction effects into its four parameters rather than modeling them explicitly.

**1988 -- Laine** validates and extends Fant's higher-pole correction (HPC) formula. Shows: (1) HPC depends only on effective vocal tract length, not vowel profile; (2) digital all-pole models DO need variable HPC when effective length varies; (3) each cascade formant should ideally be paired with a wide-bandwidth zero.

**1989 -- Stevens** establishes quantal theory. Source-filter interaction is implicit: coupled resonators create quantal articulatory-acoustic relationships. Voiced fricatives are "inherently unstable" due to requiring simultaneous voicing and frication (a source-filter coupling issue). Three phonation types (modal/breathy/pressed) have distinct spectral signatures.

**1992 -- Titze & Sundberg** derive analytical expressions for vocal intensity. Show radiated power P = Pg * G(F0) where G(F0) is the vocal tract power gain function. This explicitly quantifies how the filter amplifies the source -- a form of one-directional source-filter coupling. 8-9 dB SPL per doubling of excess pressure over threshold.

**1995 -- Lin et al.** derive partial fraction expansion to convert cascade to parallel, replacing Klatt's fixed ndbScale offsets with dynamically computed values. This eliminates a major artifact of the independence assumption: the ndbScale values become inaccurate when formants shift from default positions.

**1996 -- Story et al.** publish MRI vocal tract area functions for 18 phonemes. Effective vocal tract length ranges 15.88-18.25 cm (one speaker). These data quantify the geometric variation that drives HPC variation per Laine 1988.

**1998 -- Stevens** Acoustic Phonetics textbook. Chapter 3 extensively treats source-filter interaction: (1) open-phase coupling widens B1 by an amount dependent on glottal area; (2) closed-phase formants are narrower; (3) F0-proximity widens perceived B1 when F0 approaches F1. Provides the formulas Qlatt currently uses for bandwidth adjustment.

**1998 -- Yegnanarayana & Veldhuis** demonstrate pitch-synchronous formant extraction distinguishing open vs. closed glottal phases. Pre-excitation F1 is typically higher than post-excitation (open phase coupling). Provides empirical evidence that source-filter interaction measurably shifts formant parameters within a single pitch period.

**2006 -- Sun et al.** show vocal tract shape (LSF parameters) predicts glottal waveform shape with 9 optimal codebook classes. Correlation 0.80 vs 0.61 for LF model -- the LF model's independence assumption loses information.

**2007 -- McGowan & Howe** extend source-filter theory with compact Green's functions. Factor the Green's function into go (classical transfer function) and gs (source-region coupling). Sharp edges (teeth) produce far more efficient aeroacoustic coupling than rounded edges (false folds). This explains the 10-15 dB amplitude difference between sibilants and aspiration without invoking jet velocity alone.

**2007 -- Kaburagi & Kim** present articulatory-to-acoustic mapping via dynamic model. Context-independent phonemic tasks with smoothness constraints reproduce coarticulatory formant transitions. Relevant to source-filter in that the mapping is purely filter-side (no source modeling).

**2008 -- Bonada** builds singing synthesizer using EpR (Excitation plus Resonances) model. Explicitly uses source-filter decomposition with Klatt-style resonators. Notes that formant phase relationships affect perceived naturalness, and that 19 dB amplitude difference corresponds to pi radians phase shift.

**2021 -- Kamiloglu & Sauter** review voice production/perception. State that source and filter "can be controlled independently in humans" -- a true physiological statement that does not address acoustic coupling.

## Findings by Category

### Wrong (methodology error or flawed reasoning)

**WRONG: Rabiner & Gold (1968) claim that digital all-pole models do not need higher-pole correction.**
Laine (1988) demonstrated this is incorrect. Digital models need variable HPC whenever the "digital effective length" (c*N/Fs) differs from the physical effective vocal tract length. At 48 kHz with 10 formants, the digital effective length is c*10/48000 = 350*10/48000 = 0.073 m = 7.3 cm, versus physical 14-21 cm. Rabiner's claim was based on the coincidental case where digital and physical lengths happen to match.

**WRONG: Klatt (1980) fixed ndbScale offsets as adequate approximation for parallel branch amplitudes.**
Lin et al. (1995) showed these fixed values (A1=-58, A2=-65, A3=-75, etc.) become inaccurate when formant frequencies shift significantly from their default positions. The correct approach is dynamic computation via partial fraction expansion of the cascade transfer function. Holmes (1983) independently reached the same conclusion from the opposite direction (arguing the cascade "advantage" of automatic amplitude balancing is overstated because it breaks down with vocal effort changes).

### Superseded (better data replaced it)

**SUPERSEDED: Fant (1960) simple source spectrum model (-12 dB/octave from two poles at 100 Hz).**
Superseded by Fant (1985) LF model with four parameters. The LF model captures return phase (ta), pulse asymmetry (Rk), and excitation strength (Ee) that the 1960 two-pole model cannot represent. The 1960 model remains valid as a first-order approximation of the average spectrum but cannot represent voice quality variation (modal/breathy/pressed).

**SUPERSEDED: Flanagan (1972) first-order radiation impedance approximation.**
Chalker & Mackerras (1985) showed Flanagan's single-term approximation has 13.4 ohms reactance error at 5 kHz for open vowels (5.0 cm^2 aperture). Their two-term approximation reduces this to 1.22 ohms. The Flanagan approximation (equivalent to Klatt's first-difference radiation filter) remains adequate below 3 kHz but causes measurable high-frequency formant bandwidth errors for open vowels.

**SUPERSEDED: Kamiloglu (2021) statement "source and filter can be controlled independently."**
This is physiologically true (different muscle groups) but acoustically misleading. Rothenberg (1981) and Fant (1986) demonstrated that aerodynamic coupling makes the acoustic output of the source dependent on the filter's input impedance, particularly F1. The independence is approximate, not absolute. Kamiloglu's review paper is not wrong for its purpose (psychology overview) but would be wrong if cited as evidence for acoustic independence.

### Limited (correct but over-applied)

**LIMITED: Fant (1960) source-filter independence assumption.**
Correct for: (1) vowels at moderate F0 where F1/F0 > 3 (Rothenberg 1981); (2) when the LF parametric model absorbs interaction effects into its parameters (Fant 1986); (3) cascade synthesis of non-nasal voiced sounds at conversational speech levels. Breaks down for: (1) high F0 (soprano singing, F1/F0 < 3) where f1/f0 interaction changes ALL formant amplitudes; (2) vowel-dependent source variation (back vowels produce more asymmetric flow due to higher pharyngeal inertance); (3) voiced fricatives where simultaneous voicing and frication is "inherently unstable" (Stevens 1989). The LF model's parametric approach implicitly accounts for interaction by fitting ta and Ee to observed waveforms -- but this makes these parameters vowel-dependent, which is not reflected in Klatt's architecture.

**LIMITED: Klatt (1980) cascade/parallel switching (SW parameter).**
Correct in principle (cascade for voiced vowels, parallel for obstruents). Limited by: (1) spectral discontinuity at the switch point (Lin 1995); (2) cascade branch cannot represent vocal effort variation without source spectrum changes (Holmes 1983); (3) the fixed ndbScale offsets become wrong when formants shift. Lin's partial fraction expansion and Holmes's per-formant amplitude control both address these limitations.

**LIMITED: Higher-pole correction as a fixed spectral shaping.**
Laine (1988) showed HPC depends on effective vocal tract length (le = physical length + 0.8*sqrt(A/pi)), which varies 14-21 cm across vowels. Static HPC (as implied by Klatt's fixed cascade topology with N formants) is only correct for the vowel whose le matches the digital effective length. The HPC varies by +/-20 dB at 5 kHz across the vowel space. The ideal approach is Laine's pole-zero model: each formant resonator paired with a wide-bandwidth zero.

**LIMITED: McGowan & Howe (2007) compact Green's function factorization.**
Valid for frequencies where the source region is acoustically compact (wavelength >> source region size), which holds below 15-20 kHz. Above that, the factorization breaks down. Also, the theory only provides the acoustic coupling framework -- the hydrodynamic field (vortex/turbulence structure) must still be determined separately.

### Incomparable (different questions mistaken for disagreement)

**INCOMPARABLE: Fant (1986) source-filter interaction vs. LF model (Fant 1985) parametric independence.**
These are not contradictory. Fant (1986) showed that interaction effects exist and matter physically. Fant (1985) showed that a parametric model (LF) can absorb these effects into its parameters. The LF model's ta, Ee, and Rk implicitly encode interaction effects when fitted to real speech. So you can model interaction either explicitly (Rothenberg-style circuit model) or implicitly (LF parametric model fitted to data that already includes interaction). Klatt chose the latter path.

**INCOMPARABLE: Holmes (1983) all-parallel vs. Klatt (1980) cascade/parallel hybrid.**
Holmes argues parallel is universally superior. Klatt argues cascade is better for vowels. They are optimizing for different things: Holmes optimizes for direct parameter control and robustness to vocal effort changes; Klatt optimizes for minimal parameters (cascade needs only frequencies and bandwidths for vowels). Both produce intelligible speech. The real issue is the cascade-parallel transition, which Lin (1995) resolved mathematically.

**INCOMPARABLE: Kaburagi (2007) articulatory dynamics vs. Klatt (1980) formant specification.**
Kaburagi shows coarticulation emerges from articulatory dynamics with invariant targets. Klatt uses explicit formant frequency specifications. These are different levels of abstraction: Kaburagi models the physics that produces formant trajectories, Klatt directly specifies the trajectories. Not a disagreement about source-filter interaction.

**INCOMPARABLE: Sun (2006) codebook-based glottal source vs. LF parametric source.**
Sun's codebook captures speaker-specific waveform details (including interaction effects) that parametric models cannot. But it requires analysis of natural speech -- useless for rule-based TTS. The 0.80 vs 0.61 correlation comparison is valid but the methods serve different purposes.

## What Subsumes What

1. **Fant (1985) LF model subsumes Fant (1960) source spectrum.** The LF model's four parameters can represent the 1960 two-pole source as a special case (ta=0, symmetric opening phase).

2. **Laine (1988) HPC analysis subsumes Fant (1960) HPC formula.** Laine validates Fant's formula and extends it with effective-length dependence and practical filter designs.

3. **Lin (1995) partial fraction expansion subsumes Klatt (1980) ndbScale.** PFE computes the correct parallel amplitudes for any formant configuration; ndbScale is the special case when formants are at default positions.

4. **Chalker (1985) two-term radiation subsumes Flanagan (1972) one-term approximation.** The two-term model includes the one-term as its leading order.

5. **Rothenberg (1981) interactive source model subsumes Fant (1960) independent source.** Rothenberg shows when independence holds (F1/F0 > 3) and what corrections are needed otherwise. The independent model is a limiting case.

6. **McGowan & Howe (2007) Green's function subsumes Fant (1960) transfer function.** The classical transfer function go is one factor of the full Green's function G = go * gs. Fant's model is recovered when gs = 1 (uniform source coupling).

## Genuinely Uncertain

1. **Magnitude of vowel-dependent source variation in connected speech.** Rothenberg (1981) demonstrated that back vowels produce greater flow asymmetry than front vowels due to pharyngeal inertance. Fant (1986) showed F1 drives interaction effects. But no paper quantifies how much this matters for perception in connected speech at conversational F0 (100-150 Hz for adult males). The LF model may absorb enough of the variation to make explicit interaction modeling unnecessary for most practical purposes. Confidence: low.

2. **Whether HPC variation is perceptually significant for formant synthesis.** Laine (1988) showed +/-20 dB variation at 5 kHz across vowels. But no perceptual test has established whether listeners can hear this in synthetic speech when lower formants (F1-F4) are correct. The HPC primarily affects spectral balance above F5. Confidence: low.

3. **Whether per-frame dynamic ndbScale computation improves perceived quality.** Lin (1995) showed the math works but the conference abstract reports no perceptual evaluation. Lalwani (1992) showed Q-factor-based correction helps, but no systematic comparison of fixed vs. dynamic ndbScale exists in the literature. Confidence: medium (likely helps for extreme formant configurations like /r/ where F2-F3 converge).

4. **Optimal radiation model for formant synthesis above 3 kHz.** Chalker (1985) showed the two-term model is more accurate, but no one has tested whether the difference is audible in formant-synthesized speech. The Klatt first-difference filter is a crude approximation of even the one-term model. Confidence: low.

## Best Current Understanding

### Is source-filter independence a valid assumption for formant synthesis?

**Answer:** Yes, with caveats. For adult male conversational speech at F0 = 80-200 Hz, cascade formant synthesis with an LF parametric source produces intelligible, reasonably natural speech. The LF model's parameters (particularly ta and Ee) implicitly absorb most source-filter interaction effects when set from empirical data. The independence assumption fails for: (a) high F0 relative to F1 (soprano singing, child speech); (b) vowel-dependent source variation (back vowels have different source characteristics than front vowels); (c) voiced fricatives. **Evidence:** Rothenberg 1981, Fant 1986, Stevens 1989. **Confidence:** high.

### What is the primary mechanism of source-filter interaction?

**Answer:** Vocal tract inertance at frequencies below F1. Inertive loading of the glottis by the supraglottal tract transforms symmetric glottal area pulses into asymmetric flow pulses with sharp closure. The normalized inertance parameter Lt (range 0.2-1.0) controls the degree of asymmetry. The pharyngeal component of inertance is more important than the oral component. **Evidence:** Rothenberg 1981, Fant 1986. **Confidence:** high.

### How should the Klatt synthesizer handle source-filter coupling?

**Answer:** Through the LF source model's parameters, not through explicit aerodynamic coupling. The Rd parameter (Fant 1997) provides a convenient one-dimensional control that covaries ta, Rk, and Ee. Vowel-dependent Rd adjustment (slightly higher Rd for front vowels, lower for back vowels) would partially account for interaction effects. The bandwidth adjustment formulas already in Qlatt (Fant 1997 glottal leakage, Stevens 1998 F0-proximity) handle the filter-side effects. **Evidence:** Fant 1985, Fant 1986, Fant 1997, Stevens 1998. **Confidence:** medium.

### Should Klatt's ndbScale values be dynamically computed?

**Answer:** Yes. Lin (1995) showed the mathematical approach. At minimum, the ndbScale values should account for formant frequency shifts from default positions. The current fixed values are a known source of spectral error, particularly for formant convergence (/r/, /l/) and extreme vowels. **Evidence:** Lin 1995, Holmes 1983. **Confidence:** high.

### Is the first-difference radiation filter adequate?

**Answer:** Adequate for speech below 3 kHz. Increasingly inaccurate above 3 kHz for open vowels with large mouth aperture. The Chalker (1985) two-term approximation would improve F3-F5 bandwidth accuracy at minimal computational cost. **Evidence:** Chalker 1985. **Confidence:** medium.

## Synthesizer Audit

### 1. Source-filter independence assumption

**Current:** Qlatt treats source and filter as fully independent. The LF source generates glottal flow, which passes through the cascade formant chain unchanged. No vowel-dependent source parameter adjustment exists.

**File:** `public/experiments/klatt80-baseline/semantics.yaml`, lines 128-133 (Rd parameter) and 580-587 (voiceGain formula).

**Source:** Klatt 1980 architecture.

**Category:** LIMITED. Correct for most adult male speech, but fails to account for vowel-dependent source variation documented by Rothenberg 1981 and Fant 1986.

**Replacement:** Add vowel-dependent Rd adjustment rules. Back vowels (high pharyngeal inertance) should have Rd shifted ~0.1 lower (more pressed/asymmetric flow). Front high vowels (low pharyngeal inertance) should have Rd shifted ~0.1 higher. This is a small effect but physically grounded. Citation: Rothenberg 1981 (vowel-dependent inertance distribution), Fant 1986 (F1-driven interaction). Implementation: add a rule in the duration/formant phase that adjusts Rd based on vowel backness/height.

### 2. Fixed ndbScale values for parallel branch

**Current:** Fixed offsets: A1=-58, A2=-65, A3=-73, A4=-78, A5=-79, A6=-80, A7=-81, A8=-82, A9=-83, A10=-84.

**File:** `src/builtin-functions.ts`, lines 16-36; `public/experiments/klatt80-baseline/semantics.yaml`, lines 346-353.

**Source:** Klatt 1980 PARCOE.FOR.

**Category:** WRONG (per Lin 1995). These fixed values are only correct when formants are at their default positions (F1=500, F2=1500, F3=2500...). They become inaccurate when formants shift.

**Replacement:** Implement Lin (1995) partial fraction expansion: for each formant Fn, compute ndbScale_n = 20*log10(|H_others(fn)|) where H_others is the cascade product of all formants except Fn evaluated at fn's frequency. This can be computed per-frame from the formant frequencies and bandwidths. As a simpler intermediate step, Lalwani (1992) Q-factor shortcut: ndbScale_n ~ -20*log10(Fn/Bn). Citation: Lin et al. 1995, Lalwani 1992.

### 3. Higher-pole correction (F7-F10 cascade formants)

**Current:** F7-F10 at fixed 1000 Hz spacing above F6. Bandwidths from Rabiner (1968) Q factors. Comment in semantics.yaml notes these formants receive "negligible signal energy (~82 dB attenuation by F1-F6 chain)."

**File:** `public/experiments/klatt80-baseline/semantics.yaml`, lines 377-423.

**Source:** Fant 1960 neutral vowel spacing + Rabiner 1968.

**Category:** LIMITED. The spacing model is correct for neutral vowels but the effective vocal tract length varies 14-21 cm across vowels (Story 1996), so the HPC should vary with vowel. More critically, Laine (1988) showed the theoretically correct approach is pole-zero pairs: each formant paired with a wide-bandwidth zero (BW ~1.5-2 kHz).

**Replacement:** (1) Scale F7-F10 spacing proportionally to effective vocal tract length: F_neutral = (2n-1) * c/(4*le) where le varies per vowel. Use Story (1996) area function data to estimate le. (2) Long-term: add paired antiresonators to F7-F10 cascade formants with BW ~1.5 kHz at the same frequencies. Qlatt already has antiresonator WASM primitives. Citation: Laine 1988, Story 1996.

### 4. Radiation filter

**Current:** First-difference filter (single zero at z = 1, +6 dB/octave). This is a Flanagan (1972) one-term approximation.

**File:** `public/experiments/klatt80-baseline/graph.yaml`, line 289 (radiationDiff node).

**Source:** Klatt 1980, following Flanagan 1972.

**Category:** SUPERSEDED by Chalker & Mackerras 1985. The one-term approximation has 13.4 ohms reactance error at 5 kHz for open vowels (5.0 cm^2 aperture). Affects F3-F5 bandwidth accuracy.

**Replacement:** Implement Chalker (1985) two-term radiation filter. The resistance becomes (y^2/(2*4) - y^4/(2*4^2*6)) and reactance becomes (4/pi)*(y/3 - y^3/(3^2*5)) where y = 2*k*a. This would require a second-order filter rather than first-order. The improvement is most relevant for /a/-like vowels. Citation: Chalker & Mackerras 1985. Note: the perceptual benefit has not been established. This is a low-priority improvement.

### 5. F0-proximity B1 widening

**Current:** B1 += 200 * max(0, F0/F1 - 0.5)^2. Effect: 0 Hz at F0/F1=0.5, ~8 Hz at 0.7, ~32 Hz at 0.9.

**File:** `public/experiments/klatt80-baseline/semantics.yaml`, lines 547-559.

**Source:** Stevens 1998, Sections 3.8-3.9.

**Category:** Correct and well-cited. No change needed. This is a proper implementation of the source-filter interaction effect on perceived bandwidth.

### 6. Glottal leakage bandwidth adjustment

**Current:** DeltaB1 = 250 * (F1/500)^2 * (Ra - RaRef) / 12. DeltaB2 = DeltaB1 * F1 / (2*F2).

**File:** `public/experiments/klatt80-baseline/semantics.yaml`, lines 547-564.

**Source:** Fant 1997.

**Category:** Correct and well-cited. This accounts for the filter-side effect of open-phase glottal coupling (wider bandwidth during open phase averaged over the cycle). No change needed.

### 7. Ee-to-1/Rd covariation

**Current:** eeCovaryDb = 40 * log(RdRef/effectiveRd) / log(10). This implements a 2:1 dB ratio between Ee and 1/Rd.

**File:** `public/experiments/klatt80-baseline/semantics.yaml`, lines 566-577.

**Source:** Fant 1997.

**Category:** Correct. This captures the empirical covariation between excitation strength and voice quality parameter. No change needed.

### 8. Absence of f1/f0 interaction on formant amplitudes

**Current:** No mechanism exists to adjust formant amplitudes based on f1/f0 ratio.

**File:** Not implemented anywhere.

**Source:** Rothenberg 1981.

**Category:** LIMITED. Rothenberg showed f1/f0 near integer values produces stronger high-frequency excitation (sharper closure) while half-integer values produce weaker excitation. This affects ALL formant amplitudes. For adult male speech (F0=80-150 Hz, F1=250-800 Hz), f1/f0 ranges from ~2 to ~10, usually > 3. The effect is small for most speech. It becomes significant for: (a) high F0 voices (female, child); (b) low vowels where F1 is high relative to F0.

**Replacement:** For a first approximation, apply a gain correction to voiceGain based on whether a harmonic of F0 falls near F1: correction_dB = 3 * cos(2*pi*F1/F0) (peaks at integer f1/f0, troughs at half-integer). This is an engineering estimate pending proper calibration. Citation: Rothenberg 1981, Fant 1986. Priority: low for adult male, medium for female/child voice synthesis.

## Open Questions

1. **Perceptual significance of HPC variation.** Laine (1988) showed +/-20 dB variation at 5 kHz. Is this audible in formant-synthesized speech? No perceptual study exists.

2. **Optimal dynamic ndbScale computation cost.** Lin (1995) method requires evaluating the cascade transfer function at each formant frequency per frame. Is this feasible in real-time WebAudio? Need to profile.

3. **Vowel-dependent Rd values.** Rothenberg (1981) demonstrated the physical mechanism (pharyngeal inertance). No study has measured the actual Rd variation across vowels in connected speech to provide calibration data.

4. **Subglottal resonance effects.** Stevens 1998 documents subglottal resonances at ~600, ~1400, ~2100 Hz. These couple through the glottis during the open phase and affect the spectrum near F1. Klatt approximates this by widening B1 to 300 Hz for aspiration, but no systematic model exists in the Qlatt system.

5. **Cross-mode effects above 4 kHz.** Both Laine (1988) and McGowan & Howe (2007) note that plane-wave propagation breaks down above ~4 kHz in the vocal tract. Holmes (1983) explicitly flags this. The cascade model's validity in the F5-F10 range is uncertain.

6. **Missing paper: Flanagan (1972).** Multiple papers cite this textbook for radiation impedance and transmission line models. It is not in the collection. This is the primary source for the radiation model Klatt uses.
