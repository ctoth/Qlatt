# Verdict 12: Gender & Speaker Differences

## Scope

This verdict evaluates what the literature says about male/female/speaker differences and what parameters Qlatt would need for multi-speaker or multi-gender synthesis. Qlatt currently has a single male voice. Twenty-five papers were read (Lucero 2009 not in collection); two synthesizer files and the existing speaker-characteristics summary were audited.

## Papers Reviewed

| Paper | Key Contribution | Evidence Quality |
|-------|-----------------|-----------------|
| Titze 1989 | Two physiological scale factors: alpha=1.2 (larynx size), beta=1.6 (membranous VF length); F0=1700/L_m formula | High (theoretical + anatomical data) |
| Zhang 2021 | 216,000 simulations: VF length dominates F0 (eta^2=0.306), thickness dominates CQ and H1-H2 | High (massive parametric sweep, controlled) |
| Simpson 2009 | Non-uniform formant scaling; sociophonetic component; 11% male duration shortening; female longer VOT | Moderate (review article, draws on multiple sources) |
| Hanson 1995 | KLSYN88 parameter sets G1-G6 for female voice quality continuum (OQ 57-70%, TL 0-25 dB, B1 60-200 Hz, AH 35-48 dB) | High (PhD thesis, synthesis-perception validated) |
| Hanson 1997 | Glottal chink area effects on B1, spectral tilt; female B1 mean 165 Hz; H1*-A3* mean 22.8 dB; two-group classification (modal vs breathy) | High (JASA, 20 speakers, corrected measures) |
| Hanson 1999 | Male glottal data: H1*-H2* mean 0.0 dB, H1*-A3* mean 13.8 dB, B1 mean 126 Hz; 9.6 dB gender gap in H1*-A3* | High (JASA, companion to Hanson 1997) |
| Holmberg 1995 | 20 female speakers: H1-H2 comfortable=6.6 dB, loud=2.4 dB; adduction quotient r=-0.69 with H1-H2 | High (controlled, normative data) |
| Iseli 2007 | 335 speakers ages 8-39; correction formulae for H1*-H2*, H1*-A3*; males drop 4 dB in H1*-H2* and 10 dB in H1*-A3* from childhood to adulthood | High (large N, age+sex+vowel) |
| Fitch 1999 | N=129 MRI: VTL vs height r=0.926; male pharyngeal elongation at puberty; adult male VTL ~155 mm, female ~139-146 mm | High (large MRI study, direct measurement) |
| Hao 2002 | 120 speakers, 3 races: F1-F3 for 9 vowels; tract dimensions explain only 18% of F1 variance | Moderate (cross-racial, but limited tract measurement) |
| Xue 2000 | 84 elderly speakers: NO race effect on any of 15 MDVP parameters; significant sex effects on F0, jitter, SPI | High (controlled, 15 parameters tested) |
| Xue 2006 | 120 speakers: male VTL ~17 cm, female ~15.5 cm; Chinese speakers larger oral volume; no length differences by race | High (cross-racial tract dimensions) |
| Stathopoulos 2011 | 192 speakers ages 4-93: male F0 U-shape (min ~115 Hz age 50); female F0 gradual decline to ~200 Hz; SPL increases to ~30 then stable | High (largest lifespan study, 8 age groups) |
| Schotz 2006 | F0 and duration as best age cues; GLOVE-to-Klatt parameter mapping; creaky voice = F0/2 + diplophonia | Moderate (perceptual study, single language) |
| Keating 2016 | F0, SHR, F3, F4, CPP top discriminators among 50 female voices; H1*-H2* NOT important for between-speaker discrimination | High (50 speakers, systematic) |
| Nygren 2016 | 50 trans men: F0 continuously declines ~192 Hz to ~125 Hz over 12 months on testosterone | High (longitudinal, N=50) |
| Cartei 2014 | Testosterone -> F0 -> masculinity perception (full mediation); F0 rho=-.53, deltaF rho=-.33; F0 and deltaF independent | High (mediation analysis, endocrine + acoustic) |
| Chen 2022 | F0 mean = 43.5% importance for male masculinity, 23.8% for female femininity; F3/F4/VTL second at ~13-16% | High (random forests, feature importance) |
| Meek 2018 | 15 participants: no significant ethnic acoustic differences; posterior glottal chink in all non-Caucasian males | Low (N=15, underpowered) |
| Walton 1994 | 100 speakers: 60% race ID from sustained /a/; shimmer and H/N ratio discriminate, NOT F0 or formants | Moderate (large N but limited acoustic analysis) |
| Kachel 2017 | 108 women: no acoustic differences by sexual orientation; gender-role self-concept correlates with F0 | Moderate (N=108, single study) |
| Zhang 2016a (Physiology) | 3D phonation model: cover AP stiffness controls F0; medial surface thickness controls voice quality | High (computational, controlled) |
| Zhang 2016b (Mechanics) | Comprehensive review: body-cover theory; eigenmode synchronization mechanism | High (review of field) |
| Titze 1979 | 3D viscoelastic VF model: body-cover layer properties; nominal male configuration; F0 = (1/2L)(mu'/rho)^0.5 | High (foundational model) |
| Koenig (Laryngeal Factors) | VOT gender differences: men 87% fully voiced /h/; women variable; children highly variable | Moderate (focused on /h/) |
| Starr 2015 | Sweet voice = head register (H1-H2 +3.4 dB, HNR +2 dB, 2k-4k -1.1 dB), NOT high pitch | Moderate (Japanese, single study) |

**Not in collection:** Lucero 2009 (male-female vocal fold simulation).

## Evidence Hierarchy Applied

1. Direct physiological measurement (Fitch 1999 MRI, Xue 2006 acoustic pharyngometry) > acoustic inference
2. Large population studies (Iseli 2007 N=335, Stathopoulos 2011 N=192, Hillenbrand 1995 N=139) > small samples (Meek 2018 N=15)
3. Controlled simulation (Zhang 2021 N=216,000 conditions) > naturalistic observation
4. Synthesis-perception validated parameters (Hanson 1995 G1-G6) > acoustic-only measurements
5. Cross-cultural replications (Xue 2000+2006, Hao 2002) > single-population studies

---

## Findings by Category

### WRONG

**W1. Uniform vocal tract scaling between male and female voices**

The "uniform scaling" model — that female formants are simply male formants multiplied by a single factor — is wrong. Evidence:

- Simpson 2009 documents non-uniform scaling: F1 shows smaller male-female differences than F2-F4
- Fitch 1999 MRI data shows male pharyngeal elongation is disproportionate (not just overall length)
- Hao 2002: tract dimensions explain only 18% of F1 variance, meaning vowel-specific and speaker-specific factors dominate at low formants
- Hillenbrand 1995 data (from Verdict 03): male-to-female scaling ratios vary by vowel and formant number

The correct model requires per-vowel, per-formant targets — not a single multiplier.

**W2. F0 alone determines perceived gender**

While F0 is the single strongest cue (Chen 2022: 43.5% importance for male masculinity), it is not sufficient:
- Cartei 2014: F0 and formant spacing (deltaF) are independent predictors
- Simpson 2009: listeners can identify speaker sex even from whispered speech (no F0)
- Source spectral tilt (H1*-A3*) shows a 9.6 dB gender gap (Hanson 1997 vs 1999)
- A synthesizer changing only F0 will produce an unconvincing female voice

### SUPERSEDED

**S1. Peterson & Barney 1952 as formant reference (for either sex)**

Already established in Verdict 03: Hillenbrand 1995 (N=139, modern recording) supersedes P&B 1952 for both male and female formant targets. Qlatt's inventory.yaml still cites P&B as primary source.

**S2. Simple open quotient (OQ) as sole source quality control**

Hanson 1995/1997 demonstrate that female voice quality requires at minimum: OQ, tilt (TL), first-formant bandwidth (B1), and aspiration noise (AH). A single OQ parameter is insufficient. The Rd parameterization (used by Qlatt via LF model) captures some of this, but not B1 adjustment or independent aspiration noise control.

### LIMITED

**L1. Racial/ethnic acoustic differences**

The evidence for intrinsic racial voice differences is weak to nonexistent:
- Xue 2000: NO race effect on any of 15 MDVP parameters (elderly speakers)
- Xue 2006: No VTL differences by race; Chinese speakers had larger oral volume but same length
- Hao 2002: Cross-racial formant differences exist but are small relative to sex differences
- Meek 2018: No significant ethnic acoustic differences (but N=15, underpowered)
- Walton 1994: 60% race identification from sustained /a/, but discriminating features were shimmer and H/N ratio — voice quality, not formant structure

**Assessment:** What has been called "racial voice differences" appears to be a combination of: (1) dialect/accent effects on articulation (sociophonetic), (2) individual variation in voice quality (shimmer, noise), and (3) possible minor VTL shape differences. These do not warrant separate racial parameter sets. Individual speaker variation within any racial group exceeds between-group differences.

**L2. Lifespan F0 trajectories as simple linear models**

Stathopoulos 2011 shows complex nonlinear trajectories:
- Male F0: U-shaped (high in childhood ~260 Hz, drops to ~115 Hz by age 50, rises to ~135 Hz by age 80+)
- Female F0: gradual decline (~260 Hz childhood to ~200 Hz elderly)
- Children: sex differences emerge around age 10-12 (pre-pubertal voices are similar)

A synthesizer age parameter would need at least a piecewise function, not a linear scale.

**L3. Cross-linguistic generalizability of voice quality norms**

Starr 2015 shows that "feminine voice quality" in Japanese involves head register (breathier, less high-frequency energy) rather than simply higher F0. Kachel 2017 finds no acoustic correlates of sexual orientation in German women. These suggest that perceived gender in voice has a cultural/performative component that acoustic parameters alone cannot fully capture.

### INCOMPARABLE

**I1. Vocal fold simulation models vs acoustic measurements**

Zhang 2021's 216,000-condition simulation provides causal understanding (VF length drives F0, thickness drives voice quality) but operates in a different parameter space from Klatt synthesis parameters. The mapping from physiological variables (VF length, thickness, stiffness) to synthesis parameters (F0, Rd, OQ, TL) requires Titze 1989's scale factors as an intermediate step. These are complementary, not competing evidence.

**I2. Perceptual importance (Chen 2022) vs acoustic reality (Hanson 1997)**

Chen 2022's random forest analysis measures perceptual salience. Hanson 1997 measures acoustic differences. A parameter can have a large acoustic gender difference (like H1*-A3*, 9.6 dB gap) but low perceptual weight for gender identification if listeners don't attend to it. For synthesis, both matter: acoustic accuracy requires matching the measured values, but perceptual priority should guide implementation order.

---

## What Subsumes What

1. **Hillenbrand 1995** (Verdict 03) subsumes Peterson & Barney 1952 for formant targets (both sexes)
2. **Hanson 1995 + 1997 + 1999** together subsume earlier single-parameter female voice characterizations; the three-paper set provides a complete source quality framework for both sexes
3. **Fitch 1999 + Xue 2006** together subsume simple uniform-scaling models of male/female vocal tracts
4. **Iseli 2007** subsumes earlier age-sex voice source studies by providing correction formulae and large-N developmental trajectories
5. **Zhang 2021** subsumes earlier single-parameter simulation studies by providing comprehensive interaction effects

---

## Genuinely Uncertain

1. **Optimal Rd values for female voice.** Hanson 1995 gives KLSYN88 parameters (OQ, TL) but not Rd directly. The mapping from Hanson's G1-G6 parameter sets to Rd requires validation. Verdict 02 flagged this as audit item A3 ("missing female Rd defaults").

2. **B1 adjustment mechanism.** Hanson 1997 shows female B1 mean = 165 Hz (vs male 126 Hz from Hanson 1999), attributed to incomplete glottal closure. Whether this should be implemented as a static offset, a function of Rd, or a separate parameter is unresolved. Verdict 04 (formant bandwidths) may address this.

3. **Aspiration noise (AH) coupling with voice quality.** Hanson 1995 shows AH ranges from 35-48 dB across the G1-G6 continuum. Whether AH should be derived from Rd/OQ or independently controlled for female voices needs synthesis-perception testing.

4. **Formant bandwidth scaling.** Beyond B1, whether B2-B5 differ systematically between male and female speakers is not well established. Some evidence suggests wider bandwidths in female speech generally (possibly from greater source-tract interaction with breathier phonation), but the data is sparse.

5. **F0 variance and perturbation.** Female voices show higher F0 variability (Stathopoulos 2011) and different jitter/shimmer patterns (Xue 2000). Whether these should be explicit synthesis parameters or emerge from the source model is unclear.

---

## Best Current Understanding: Male vs Female Synthesis Parameters

### Tier 1: Essential (perceptually dominant, well-established values)

| Parameter | Male Default | Female Default | Source | Notes |
|-----------|-------------|---------------|--------|-------|
| F0 mean (Hz) | 120 | 210 | Hillenbrand 1995, Stathopoulos 2011 | Chen 2022: 43.5% importance for masculinity perception |
| F0 SD (Hz) | 20-25 | 25-35 | Stathopoulos 2011 | Female greater variability |
| VTL scale | 1.0 (ref) | 0.87-0.92 | Fitch 1999, Xue 2006 | Male VTL ~17 cm, female ~15.5 cm; ratio ~0.91 |
| Formant targets | Hillenbrand 1995 male | Hillenbrand 1995 female | Verdict 03 | Per-vowel, per-formant; NOT uniform scaling |

### Tier 2: Important (significant acoustic gender gap, affects naturalness)

| Parameter | Male Default | Female Default | Source | Notes |
|-----------|-------------|---------------|--------|-------|
| Rd | 0.7 (modal) | 1.0-1.5 (modal-breathy) | Fant 1997, cf. Hanson 1995 OQ mapping | Female default breathier; needs validation |
| H1*-H2* (dB) | 0.0 | 3.5-7.7 | Hanson 1999, Hanson 1997, Holmberg 1995 | Large gender gap; maps to OQ/Rd |
| H1*-A3* (dB) | 13.8 | 22.8 | Hanson 1999, Hanson 1997 | 9.6 dB gap; maps to TL/spectral tilt |
| B1 (Hz) | 100-126 | 140-200 | Hanson 1999 (126), Hanson 1997 (165), Verdict 04 | Due to incomplete glottal closure |
| AH (dB) | 30-35 | 35-48 | Hanson 1995 G1-G6 | Higher aspiration in female voice |
| TL (dB) | 0-5 | 5-25 | Hanson 1995 G1-G6 | Spectral tilt; most perceptually salient per Hanson 1995 |

### Tier 3: Refinement (smaller effects, enhance realism)

| Parameter | Male Default | Female Default | Source | Notes |
|-----------|-------------|---------------|--------|-------|
| Duration scale | 1.0 (ref) | 1.05-1.12 | Simpson 2009 (11% male shortening) | Female slightly longer segments |
| VOT (voiceless stops) | shorter | longer | Simpson 2009, Koenig | Female ~5-10 ms longer |
| F0 declination | steeper | shallower | Stathopoulos 2011 | Tendency, not firmly established |
| /h/ voicing | 87% fully voiced | variable | Koenig | Gender difference in laryngeal timing |
| F3 (Hz) | per vowel | per vowel + ~100-200 Hz | Keating 2016, Hillenbrand 1995 | F3/F4 important for speaker discrimination |

### Hanson 1995 Female Voice Quality Continuum (G1-G6)

These KLSYN88 parameter sets define a validated continuum from pressed to breathy female voice:

| Parameter | G1 (pressed) | G2 | G3 (modal) | G4 | G5 | G6 (breathy) |
|-----------|-------------|-----|------------|-----|-----|-------------|
| OQ (%) | 57 | 57 | 60 | 60 | 67 | 70 |
| TL (dB) | 0 | 5 | 10 | 15 | 20 | 25 |
| B1 (Hz) | 60 | 80 | 100 | 140 | 180 | 200 |
| AH (dB) | 35 | 38 | 40 | 43 | 45 | 48 |

**G3 (OQ=60%, TL=10, B1=100, AH=40) is the recommended female modal default.** It represents the center of Hanson's perceptually validated continuum.

### Minimum Viable Female Voice

Based on the evidence, the minimum parameter changes for a perceptually convincing female voice (in priority order):

1. **F0 = 210 Hz** (Chen 2022: single most important cue)
2. **Female formant targets from Hillenbrand 1995** (non-uniform scaling; Verdict 03 has full tables)
3. **TL = 10 dB** (Hanson 1995: most perceptually important source quality parameter)
4. **B1 = 140-165 Hz** (Hanson 1997: incomplete closure effect)
5. **AH = 40 dB** (aspiration noise increase)

Items 1-2 are essential. Items 3-5 add naturalness. Without items 3-5, the voice sounds like a male voice pitch-shifted up.

---

## Synthesizer Audit

### File: `public/rules/frontends/qlatt-english/inventory.yaml`

| Issue | Description | Severity |
|-------|------------|----------|
| **A1: Male-only formant targets** | All vowel formants cite Peterson & Barney 1952 (male only). No female targets exist. | HIGH |
| **A2: Male-only Rd default** | Rd=0.7 is male modal voice (Fant 1997). No female default (Rd~1.0-1.5). | HIGH |
| **A3: Male-only B1 default** | B1=100 Hz matches male norm. Female B1 should be 140-200 Hz (Hanson 1997). | MEDIUM |
| **A4: No speaker profile system** | No mechanism to switch between male/female/speaker parameter sets. No persona or profile configuration files exist (only a test stub). | HIGH |
| **A5: P&B citation** | Inventory cites Peterson & Barney 1952 as primary source; should cite Hillenbrand 1995 per Verdict 03. | MEDIUM |

### File: `public/experiments/klatt80-baseline/semantics.yaml`

| Issue | Description | Severity |
|-------|------------|----------|
| **A6: No speaker-dependent logic** | Parameter derivation rules have no concept of speaker type. All defaults are fixed (male). | HIGH |
| **A7: F0 range [0, 500]** | Range accommodates both sexes but default and scaling assume male. | LOW |

### Missing Infrastructure

| Issue | Description | Severity |
|-------|------------|----------|
| **A8: No speaker profile files** | Grep for "female", "male", "gender", "sex", "speaker" in rules/config found no speaker profile system. Only `test/speaker-profiles.test.ts` exists (test stub). | HIGH |
| **A9: No formant target switching** | The inventory has one set of formant targets per phoneme. Multi-speaker synthesis requires either multiple inventories or a parameterized lookup. | HIGH |

---

## Implementation Recommendations

### Phase 1: Speaker Profile System
1. Create a `speaker-profile.yaml` schema with fields: `f0_mean`, `f0_sd`, `formant_set` (reference to inventory), `rd_default`, `b1_offset`, `tl_default`, `ah_default`, `vtl_scale`
2. Add female formant targets to inventory (from Hillenbrand 1995, Verdict 03)
3. Wire profile into the semantics evaluation pipeline

### Phase 2: Source Quality Parameters
1. Map Hanson G1-G6 to Rd values (requires synthesis-perception validation)
2. Implement B1 adjustment as function of speaker profile (not just static offset — should interact with Rd)
3. Add TL as an independent parameter if not already derivable from Rd

### Phase 3: Refinements
1. Duration scaling per speaker type (Simpson 2009)
2. VOT adjustment (Koenig)
3. F0 contour shape differences (declination, variability)

---

## Open Questions for Future Verdicts

1. How does B1 adjustment interact with the bandwidth model from Verdict 04?
2. What is the correct Rd-to-OQ mapping for the Hanson G1-G6 continuum?
3. Should lifespan aging be a separate verdict (child voice, elderly voice)?
4. Are dialect-specific formant targets needed, or does individual variation dominate?
5. How should F0 perturbation (jitter, shimmer) be parameterized for different speaker types?
