# Master Synthesis: What Did We Get Wrong About Speech?

## Executive Summary

Qlatt's foundation is substantially sound. The core architectural decisions -- LF source model parameterized by Rd, cascade/parallel formant synthesis, AM/ToBI prosody framework, DAC-based coarticulation -- are all validated by the literature as correct choices. The glottal source implementation (LFLM via Perrotin 2021), the fricative spectral envelopes, and the nasal pole-zero topology are all well-grounded. Of the 12 topic areas reviewed, 5 are on solid ground or need only calibration, and none require complete replacement.

What the literature review exposed are two categories of problems. First, **wrong numbers**: 11 of 12 vowel formant targets are based on Peterson & Barney 1952 instead of the superior Hillenbrand 1995 data, with discrepancies up to 369 Hz (18%) on individual formants. The /k/ VOT ordering violates the universal labial < alveolar < velar hierarchy. Several stop closure durations are too short. Second, **missing coupling**: aspiration noise does not covary with Rd (breathiness), stress lacks a spectral tilt dimension, the duration system has no incompressibility floor, and the parallel branch uses fixed ndbScale offsets that become inaccurate when formants shift. The single most impactful finding is that updating vowel formant targets to Hillenbrand 1995 would improve every utterance the synthesizer produces.

The biggest architectural gap is the absence of any speaker profile system. Qlatt has exactly one voice -- an adult male with Peterson & Barney 1952 formants and Fant 1997 Rd=0.7. The literature provides complete data for female voice synthesis (Hillenbrand 1995 female formants, Hanson 1995 source quality continuum), but no infrastructure exists to use it.

## Cross-Topic Interactions

### Reinforcing Interactions

**Source quality and breathiness (Verdicts 02, 11, 12).** Verdict 02 identified that AH (aspiration noise) is not coupled to Rd. Verdict 11 independently confirmed AH is the single most important breathiness cue (Klatt 1990: rated 2.88/5 alone). Verdict 12 showed female voices have systematically higher aspiration (AH 35-48 dB across the Hanson G1-G6 continuum). These three findings converge: implementing AH-Rd coupling is essential for voice quality, emotional expression, AND female voice synthesis simultaneously.

**Vowel targets and gender (Verdicts 03, 12).** Verdict 03 established Hillenbrand 1995 supersedes Peterson & Barney 1952. Verdict 12 showed formant scaling between sexes is non-uniform -- female formants cannot be derived from male formants by a single multiplier (Fitch 1999 MRI data). Both verdicts point to the same solution: per-vowel, per-gender formant targets from Hillenbrand 1995, which provides both male and female tables.

**Duration and prosody (Verdicts 09, 10).** Verdict 09 found pre-boundary lengthening scope is too broad (applies to full word instead of rhyme-only per Wightman 1992). Verdict 10 independently confirmed that Wightman 1992's four-level rhyme-only model is the correct framework. Both also identified that phrase-final lengthening is non-uniform within the syllable (Edwards & Beckman 1988), with coda consonants lengthening proportionally more than nuclei.

**Spectral tilt for stress (Verdicts 10, 11).** Verdict 10 identified that Sluijter 1996 established spectral balance as the second-strongest stress cue (76% variance) after duration, yet Qlatt has no spectral tilt rules for stress. Verdict 11 confirmed that voice quality (controlled by Rd/TL) is a parallel channel for communicating affect and emphasis. Both point to the same implementation: stressed vowels need reduced TL (spectral tilt) by ~6 dB.

**Source-filter interaction and ndbScale (Verdicts 01, 04).** Verdict 01 found Klatt's fixed ndbScale values are WRONG per Lin 1995 -- they become inaccurate when formants shift from default positions. Verdict 04 found that bandwidth data is inherently sparse and uncertain. These interact: dynamic ndbScale computation would correctly track formant movements, partially compensating for bandwidth uncertainty in the parallel branch.

**Coarticulation and transitions (Verdicts 06, 08).** Verdict 06 noted velar burst frequency is highly vowel-dependent. Verdict 08 found the fixed 30ms transition is too short (literature: 40-80ms) and lacks consonant-class variation. Both point to the need for longer, context-sensitive transitions -- particularly for velars (60ms) and liquids (70ms per Dalston 1975).

### Compounding Interactions

**Female voice requires changes from FOUR verdicts.** A convincing female voice needs: updated formant targets (Verdict 03), higher Rd and B1 (Verdict 02/12), aspiration-Rd coupling (Verdict 02/11), and a speaker profile system (Verdict 12). No single verdict's recommendations are sufficient alone.

**Voice quality presets require changes from THREE verdicts.** Implementing emotional speech needs: DI parameter in the source (Verdict 02/11), AH-Rd coupling (Verdict 02/11), and spectral tilt rules for stress (Verdict 10). The Burkhardt 2009 rate-based formulas and Gobl 2003 parameter trajectories provide the targets, but the parameter infrastructure is partially missing.

### Contradictions

**No direct contradictions between verdicts were found.** The 12 verdicts are mutually consistent. The closest case to a tension is between Verdict 09's reliance on Klatt 1976 multiplicative duration rules and Verdict 09's own acknowledgment that van Santen 1994's sums-of-products model supersedes Klatt's architecture (r=0.93, 73% listener preference). However, van Santen's full parameter set is not published, making Klatt-style rules the best implementable option -- this is a limitation, not a contradiction.

**Port 1979 vs Crystal & House 1988 on closure duration.** Verdict 06 and Verdict 09 both address this. Port found voiced-voiceless closure differences in controlled materials; Crystal & House found none in connected speech. The verdicts agree: Crystal & House 1988 is preferred for connected-speech synthesis, consistent with the evidence hierarchy (larger sample, connected speech).

## What Was Wrong (Consolidated)

### Severity: High (directly produces incorrect output)

**W1. Peterson & Barney 1952 vowel formant targets.** 11 of 12 vowels need updating; worst discrepancy is EY1 F2 off by 369 Hz (18%). Hillenbrand 1995 (N=139, digital recording, LPC) supersedes P&B (N=76, spectrograph) on every dimension. *Verdict 03, Synthesizer Audit.*

**W2. Klatt 1980 fixed ndbScale offsets.** Lin et al. 1995 showed these fixed values (A1=-58, A2=-65, A3=-75, etc.) become inaccurate when formant frequencies shift from default positions. The correct approach is dynamic computation via partial fraction expansion. *Verdict 01, Finding WRONG #2, Audit item 2.*

**W3. /k/ VOT ordering violation.** Qlatt's /k/ total VOT (63 ms) is shorter than /t/ (71 ms), violating the universal labial < alveolar < velar ordering confirmed by Lisker & Abramson 1964, Zue 1976, and Cho & Ladefoged 1999. *Verdict 06, Aspiration Duration audit.*

**W4. Uniform vocal tract scaling between male and female voices.** Non-uniform scaling is required -- F1 shows smaller male-female differences than F2-F4 (Simpson 2009), and male pharyngeal elongation is disproportionate (Fitch 1999). *Verdict 12, Finding W1.*

### Severity: Medium (affects naturalness or specific contexts)

**W5. H1-H2 (uncorrected) as reliable OQ indicator.** Henrich 2001 proved H1*-H2* depends on BOTH Oq and alpha_m. Doval 2006 confirmed. H1*-A3* (corrected) is the proper measure. *Verdict 02, Finding WRONG #1.*

**W6. Jitter/shimmer as primary voice quality correlates.** Kreiman & Gerratt 2010 showed listeners are "quite insensitive" to jitter/shimmer. Kreiman 2021's four-piece source model does not include them. For synthesis, flutter (FL) is sufficient; separate shimmer is unnecessary. *Verdict 11, Finding WRONG #1.*

**W7. Voice quality maps one-to-one to discrete emotions.** The mapping is many-to-many. Voice quality primarily signals activation level, not valence. *Verdict 11, Finding WRONG #3.*

**W8. D_CL = 35 ms too short.** Crystal & House 1988 found voiced/voiceless closures are approximately equal at ~53 ms in connected speech. D_CL should be 45-50 ms. *Verdict 06, Closure Duration audit.*

**W9. F0 alone determines perceived gender.** While F0 is the strongest single cue (43.5%, Chen 2022), source spectral tilt shows a 9.6 dB gender gap (Hanson 1997 vs 1999), and listeners identify sex from whispered speech. *Verdict 12, Finding W2.*

## What Was Superseded (Consolidated)

**SS1. Peterson & Barney 1952 formant targets superseded by Hillenbrand 1995.** Larger sample (139 vs 76), digital recording, LPC analysis, adds F4 + duration + 2 vowels (/e/, /o/). *Verdict 03.*

**SS2. Fant 1960 two-pole source model superseded by LF model (1985), then by Rd unification (1997).** Qlatt correctly uses LF/LFLM. Historical interest only. *Verdicts 01, 02.*

**SS3. Flanagan 1972 one-term radiation impedance superseded by Chalker & Mackerras 1985 two-term model.** 13.4 ohms reactance error at 5 kHz for open vowels; two-term reduces to 1.22 ohms. *Verdict 01, Audit item 4.*

**SS4. Klatt 1980 impulse source superseded by KLGLOTT88 (1990), then by LF/LFLM.** Qlatt correctly uses LFLM. *Verdict 02, Finding SUPERSEDED #4.*

**SS5. Fant 1985 original LF parameterization superseded by Fant 1997 Rd.** Single parameter predicts Ra, Rk, Rg defaults. Qlatt correctly uses Rd. *Verdict 02, Finding SUPERSEDED #5.*

**SS6. O'Shaughnessy 1976 F0 rule system superseded by AM/ToBI framework.** The two-level architecture concept survives; specific rules replaced by Pierrehumbert 1980 + Ladd 2008. Qlatt correctly uses AM/ToBI. *Verdict 10.*

**SS7. Port 1979 closure durations superseded by Crystal & House 1988 for connected speech.** Key finding: hold duration does NOT distinguish voicing in connected speech (~53 ms for both). *Verdicts 06, 09.*

**SS8. Klatt 1976 multiplicative duration model partially superseded by van Santen 1994 sums-of-products.** van Santen achieves r=0.93 and 73% listener preference. However, full parameters are not published; Klatt-style rules remain the best implementable approximation. *Verdict 09.*

**SS9. Oller 1973 boundary lengthening superseded by Wightman 1992 and Beckman & Edwards 1990.** Wightman provides break-index-scaled lengthening with four distinct levels and rhyme-only scope. *Verdict 09.*

**SS10. Murray 1993 qualitative emotion mappings superseded by Banse & Scherer 1996 quantitative profiles** and Burkhardt 2009 rate-based synthesis formulas. *Verdict 11.*

**SS11. Klatt 1990 constant aspiration noise superseded by pulsatile noise (Fraj 2011, Childers & Lee 1991).** Noise modulated by glottal flow waveform sounds more natural. *Verdict 11, Finding SUPERSEDED #4.*

## Priority-Ordered Implementation Plan

### Tier 1: Incorrect Values (change a number, immediate improvement)

| # | Action | File | Source | Expected Impact | Verdict |
|---|--------|------|--------|-----------------|---------|
| 1 | Update 11 vowel formant targets to Hillenbrand 1995 | `inventory.yaml` (vowel entries) | Hillenbrand 1995 Table V | Improved vowel quality for every utterance; up to 369 Hz correction | 03, Replacement Values Table |
| 2 | Increase K_ASP from 48 to 58 ms | `inventory.yaml` K_ASP entry | Zue 1976, Lisker & Abramson 1964 | Correct /k/ VOT to 73 ms; restore labial < alveolar < velar | 06, Recommendation 1 |
| 3 | Increase D_CL from 35 to 45-50 ms | `inventory.yaml` D_CL entry | Crystal & House 1988 | More natural connected-speech stop timing | 06, Recommendation 2 |
| 4 | Increase default transition_ms from 30 to 50 ms | `frontend.yaml` line 829 | Hertz 1991, Stevens & House 1956 | Smoother, more natural formant transitions | 08, Recommendation 1 |
| 5 | Fix OW1 B3 from 70 to 100 Hz | `inventory.yaml` OW1 B3 entry | Kent & Vorperian 2018 (minimum) | Correct sub-literature bandwidth | 04, Recommendation 1 |
| 6 | Reduce voiceless_onset_raise from 1.10 to 1.08 | `prosody.yaml` voiceless_onset_raise rule | Hombert 1979 (~8% measured) | More accurate microprosody | 10, Action item 5 |
| 7 | Reduce bi1 pre-boundary lengthening from 1.05 to 1.0 | `frontend.yaml` bi1 value | Wightman 1992 (break 0 and 1 indistinguishable) | Remove unsupported lengthening | 10, Action item 6 |
| 8 | Increase K_REL from 15 to 25 ms for /k/ | `inventory.yaml` K_REL entry | Zue 1976, Stevens 1993 | More accurate velar burst duration | 06, Recommendation 6 |
| 9 | Equalize T_CL to ~50 ms (from 40) | `inventory.yaml` T_CL entry | Crystal & House 1988 | Consistent with connected speech data | 06, Recommendation 8 |

### Tier 2: Missing Coupling/Rules (add new rules or connections)

| # | Action | File | Source | Expected Impact | Verdict |
|---|--------|------|--------|-----------------|---------|
| 10 | Add AH-Rd coupling rule | `semantics.yaml` | Klatt 1990, Hanson 1995 Table 5.2 | Breathiness produces aspiration automatically; essential for voice quality | 02 A1, 11 A3 |
| 11 | Add Klatt 1976 incompressibility floor | `duration.yaml` | Klatt 1976 Eq. 1: D_min ~0.42*D_inh | Prevent stacking below physiological minimum | 09, Architectural Issue 1 |
| 12 | Restrict pre-boundary lengthening to rhyme | `duration.yaml` pre_boundary_lengthening rule | Wightman 1992 (onset correlation = -0.001) | Stop incorrectly lengthening onset consonants | 09, Architectural Issue 2 |
| 13 | Add spectral tilt rules for stress | `prosody.yaml` or new rule phase | Sluijter 1996: TL -6 dB for stressed | Second most important stress cue after duration | 10, Action item 2 |
| 14 | Add connected-speech VOT reduction rule | `duration.yaml` | Klatt 1975 Appendix: x0.7-0.9 non-prestressed | More natural stop timing in connected speech | 06, Recommendation 3 |
| 15 | Add cluster shortening rules | `duration.yaml` | Klatt 1973: C1=-12%, C2=-22% (2-element) | Prevent over-long cluster consonants | 09, Missing Rule 8 |
| 16 | Add vowel voicing-effect position conditioning | `duration.yaml` vowel_shortening rule | Klatt 1976, van Santen 1994 | Stop over-lengthening phrase-medial vowels before voiced fricatives | 09, Rule Value Issue 3 |
| 17 | Implement sagging F0 transitions | `prosody.yaml` | Ladd 2008; parameters already in frontend.yaml | More natural contours between H tones | 10, Action item 1 |
| 18 | Add polysyllabic shortening / distributed lengthening | `duration.yaml` | Klatt 1976 Rule 4 (K=0.78), White 2014 | More natural polysyllabic word timing | 09, Missing Rule 9 |
| 19 | Add per-class transition duration overrides | `frontend.yaml` or formant phase | Hertz 1991, Dalston 1975 | Velars 60ms, liquids 70ms, glides 50ms, alveolars 40ms | 08, Recommendation 2 |
| 20 | Add vowel-height VOT conditioning | `duration.yaml` | Klatt 1975 Table 2: +15% before high vowels | More accurate VOT variation | 06, Recommendation 5 |

### Tier 3: Architectural Additions (new parameters or subsystems)

| # | Action | File | Source | Expected Impact | Verdict |
|---|--------|------|--------|-----------------|---------|
| 21 | Implement dynamic ndbScale computation | `builtin-functions.ts`, `semantics.yaml` | Lin 1995 partial fraction expansion | Correct parallel branch amplitudes for all formant configurations | 01, Audit item 2 |
| 22 | Add speaker profile system | New `speaker-profile.yaml` + pipeline wiring | Hillenbrand 1995, Hanson 1995, Fitch 1999 | Enable multi-gender, multi-speaker synthesis | 12, A4/A8/A9 |
| 23 | Add female formant targets + source parameters | `inventory.yaml` + speaker profiles | Hillenbrand 1995 female tables, Hanson 1995 G3 | Minimum viable female voice (F0=210, TL=10, B1=140-165, AH=40) | 03, 12 |
| 24 | Add DI (diplophonia) parameter to LF source | `crates/lf-source/src/lib.rs` | Klatt 1990, Gobl 2003, Burkhardt 2009 | Enable creaky/harsh voice quality for phrase-final positions and emotion | 02 A7, 11 A2 |
| 25 | Add voice quality presets | New rule phase or parameter layer | Burkhardt 2009 rate formulas, Gobl 2003 | Breathy/tense/whispery/creaky voice types with emotion expression | 11, A1 |
| 26 | Add emotion prosody rules | New rule phase | Mozziconacci 1998, Rutledge 1995 Table 3 | F0 level/range/rate scaling per emotion preset | 11, A5 |
| 27 | Consolidate accent inventory to 5 MAE-ToBI types | `prosody.yaml` | Beckman 2022; add L*+H, evaluate H*+L and H*+H | Standard-compliant prosodic specification | 10, Action item 4 |
| 28 | Implement Ladd 1985 R-formula for pitch range | `prosody.yaml` or frontend | Ladd 1985: F0_new = Fr * [F0/Fr]^R | Expressive range control (confident=wider, uncertain=narrower) | 10, Action item 3 |
| 29 | Set /ng/ nasalPlaceNgFnzHz to 0 or >5000 Hz | `inventory.yaml` base_params | Stevens 1998 (all-pole characterization) | Remove incorrect spectral notch for /ng/ | 07, Recommendation 2 |

### Tier 4: Future Work (significant new infrastructure)

| # | Action | Source | Expected Impact | Verdict |
|---|--------|--------|-----------------|---------|
| 30 | Implement Chalker 1985 two-term radiation filter | Chalker & Mackerras 1985 | Improved F3-F5 accuracy for open vowels; perceptual benefit uncertain | 01, Audit item 4 |
| 31 | Add tracheal pole-zero pair | Klatt 1990 Table VII, Burkhardt 2009 | Refinement for breathy voice spectral dip; low priority | 02 A4, 11 A4 |
| 32 | Implement pulsatile aspiration noise | Fraj 2011, Childers & Lee 1991 | More natural breathiness perception | 11, Finding SUPERSEDED #4 |
| 33 | Add vowel-dependent HPC scaling | Laine 1988, Story 1996 | Correct +/-20 dB variation at 5 kHz; perceptual benefit uncertain | 01, Audit item 3 |
| 34 | Add syllable-level timing layer | Campbell & Isard 1991, Hertz 1992 | Segment durations accommodated within syllable frame | 09, Architectural Issue 4 |
| 35 | Implement non-uniform phrase-final lengthening | Edwards & Beckman 1988 | Coda lengthens more than nucleus at boundaries | 09, Architectural Issue 5; 10, Action item 7 |
| 36 | Add formant-specific transition durations | Hertz 1991, Dalston 1975 | F2/F3 can transition at different rates (especially for /r/, /l/) | 08, Recommendation 6 |
| 37 | Add vowel-dependent Rd adjustment | Rothenberg 1981, Fant 1986 | Back vowels: Rd ~0.1 lower; front vowels: Rd ~0.1 higher | 01, Audit item 1 |
| 38 | Implement Gobl 2021 alias-free LF for high-F0 voices | Gobl 2021 | Eliminates aliasing for female/child voices at F0 > 300 Hz | 02, Open Question 6 |
| 39 | Add lifespan F0 trajectories | Stathopoulos 2011 | Age-appropriate voice (child, elderly) | 12, Finding L2 |
| 40 | Implement van Santen 1994 sums-of-products duration | van Santen 1994 | r=0.93 duration prediction; requires training data | 09, Paper verdict |

## Confidence Map

| Topic | Verdict | Status | Assessment |
|-------|---------|--------|------------|
| 01 Source-Filter Interaction | Needs calibration | Independence assumption is valid; ndbScale needs dynamic computation; radiation filter adequate below 3 kHz | Right approach, several wrong numbers (ndbScale, HPC) |
| 02 Glottal Source Models | Solid ground | LF+Rd+LFLM is consensus best practice; correctly implemented; AH coupling is the main gap | Core is correct; missing coupling rules |
| 03 Vowel Formants | Needs calibration | Right approach (inventory targets), wrong numbers (P&B instead of Hillenbrand); 11/12 vowels need updating | Immediate number changes needed |
| 04 Formant Bandwidths | Solid ground | Engineering approach is the best available given sparse data; one outlier (OW1 B3=70); adjustment system is correct | Minor fixes only |
| 05 Fricative Acoustics | Solid ground | No parameters wrong or superseded; AF hierarchy, A-param spectral shapes, and duration thresholds all consistent with literature | No changes required |
| 06 Stop Consonants & VOT | Needs calibration | Architecture is sound; /k/ VOT ordering wrong; D_CL too short; several missing contextual rules | Number fixes + missing rules |
| 07 Nasal Acoustics | Solid ground | Antiformant frequencies, pole topology, coupling parameterization all correct; minor /ng/ zero issue | Minor refinements only |
| 08 Coarticulation | Needs calibration | DAC framework correct; dark /l/ and /r/ F3 correct; transition_ms too short; no per-class variation | Right approach, parameter adjustments needed |
| 09 Duration Models | Needs repair | Citations generally correct but missing incompressibility floor allows sub-physiological durations; pre-boundary scope too broad; several missing rules | Structural fixes needed |
| 10 Prosody & Intonation | Needs calibration | AM/ToBI framework correct; parameter values well-sourced; missing spectral tilt for stress and sagging transitions | Right approach, missing dimensions |
| 11 Voice Quality & Emotion | Needs architecture | No voice quality presets, no DI parameter, no AH-Rd coupling, no emotion rules; parameter infrastructure partially absent | Missing entire subsystem |
| 12 Gender & Speaker Differences | Needs architecture | No speaker profile system; male-only formants, Rd, B1; no mechanism for multi-speaker synthesis | Missing entire subsystem |

**Summary:** 4 solid ground, 4 needs calibration, 1 needs repair, 1 needs calibration (borderline repair), 2 need architecture.

## Papers the Collection Still Needs

### Would Change Verdicts If Acquired

**Byrd & Saltzman 2003** (Elastic Phrase Boundary Lengthening) -- Referenced in Verdict 09 and White 2014. Proposes the p-gesture framework for modeling boundary-adjacent lengthening dynamics. Would inform how phrase-final lengthening should be implemented dynamically rather than as a static multiplier. *Impact: Verdict 09, Tier 2 item 12.*

**Flanagan 1972** (Speech Analysis, Synthesis, and Perception) -- The primary source for the radiation model Klatt uses. Multiple papers in Verdicts 01 and 02 cite this textbook for transmission line models and radiation impedance. *Impact: Verdict 01, Audit item 4.*

**Lucero 2009** (Male-female vocal fold simulation) -- Referenced in Verdict 12 but not in collection. Would provide physiological basis for sex-differentiated source parameters. *Impact: Verdict 12, speaker profile design.*

### Would Strengthen Existing Verdicts

**Van Santen 1994 full parameter tables** -- The sums-of-products model achieves r=0.93 and 73% listener preference but specific parameter values are not published in the paper. Training data or a more complete report would enable implementation. *Impact: Verdict 09, Tier 4 item 40.*

**Large-sample American English vowel-specific bandwidth study** -- Kent & Vorperian 2018 explicitly notes bandwidth data is "sparse." No American English equivalent of Peterson & Barney exists for bandwidths. *Impact: Verdict 04.*

**Systematic perceptual study of HPC variation** -- Laine 1988 showed +/-20 dB variation at 5 kHz across vowels, but no perceptual test establishes whether this is audible in formant-synthesized speech. *Impact: Verdict 01, Open Question 2.*

**Cross-linguistic Rd calibration data** -- Fant 1997's Rd defaults and covariation ratios are based on limited Swedish data. No independent large-sample replication across languages exists. *Impact: Verdict 02, Genuinely Uncertain items 1-4.*

**Hanson G1-G6 to Rd mapping validation** -- Hanson 1995 provides KLSYN88 parameters (OQ, TL); the conversion to Rd via Fant 1997 is approximate and untested perceptually. *Impact: Verdicts 02, 12.*

## The Big Picture

The Qlatt literature review spans 60+ years of speech science, from Fant 1960's source-filter theory to Kirkham 2025's data-driven articulatory dynamics. What held up, what fell, and what changed tells a story about how a field matures.

**What held up remarkably well.** The source-filter model (Fant 1960) remains the foundation. After six decades of challenges -- Rothenberg's interaction measurements, articulatory phonology, finite-element vocal fold models -- the basic decomposition into source and filter is still the right abstraction for synthesis. The interactions are real but second-order for perception, and the LF parametric model elegantly absorbs most of them. Lisker & Abramson's three VOT categories (1964) are confirmed by a 50-year retrospective. The AM/ToBI intonation framework (Pierrehumbert 1980) maps naturally to rule-based synthesis and has no serious competitor for this application. The Klatt cascade/parallel architecture (1980), while showing its age, has no replacement that is both implementable and demonstrably superior for rule-based TTS.

**What fell.** The specific numbers from early studies consistently lost to later ones. Peterson & Barney 1952's formant measurements were superseded by Hillenbrand 1995's more precise data. Klatt 1975's VOT values were refined by Zue 1976. Port 1979's closure durations were contradicted by Crystal & House 1988 in connected speech. The pattern is consistent: measurement methodology improved (digital recording, LPC analysis, larger samples) while the underlying phenomena stayed the same. The science was right; the instruments were crude.

**What changed most.** Three shifts stand out. First, the recognition that **voice quality is multidimensional** -- not a single parameter but a space defined by spectral tilt, aspiration noise, periodicity, and their interactions. Kreiman's work (2007-2021) systematically dismantled simplistic measures like uncorrected H1-H2, replacing them with a four-piece spectral model that can match 198 out of 200 natural voices. Second, the understanding that **stress is spectral, not just dynamic** -- Sluijter 1996 showed that overall intensity barely matters for stress perception while spectral tilt accounts for 76% of variance. This overturned decades of textbook descriptions. Third, the development of **prosodic hierarchy models** -- from Oller 1973's simple final lengthening through Wightman 1992's break-index scaling to White 2014's functional framework, each generation added precision about where and how much durational variation occurs.

**The persistent gap.** The most striking absence across all 12 verdicts is the lack of systematic, large-sample, American English data for several fundamental parameters. Bandwidths have no equivalent of Peterson & Barney for frequencies. Van Santen's duration model achieves r=0.93 but the parameters are proprietary. Rd defaults come from limited Swedish data. Voice quality emotion mappings are based on acted German speech. The field has excellent theories and models but often lacks the calibration data to turn them into engineering specifications. Qlatt's "engineering estimate" labels throughout its rule system are honest acknowledgments of this gap.

**What 60 years got right that one synthesizer got wrong.** The most impactful finding of this entire review is mundane: Qlatt's vowel formant targets are from 1952 instead of 1995. This is not a theoretical failing -- it is a citation update that would improve every utterance. The science moved on; the implementation did not. That pattern -- correct architecture, outdated calibration -- is the dominant theme across all 12 verdicts.
