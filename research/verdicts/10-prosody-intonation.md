# Verdict 10: Prosody & Intonation

## Scope

Are Qlatt's F0 contour rules, prosodic structure, and intonation model consistent with the research literature? Should the ToBI-based AM framework be retained? Is the current point-target-plus-interpolation approach adequate for synthesis?

## Papers Reviewed

| Paper | Key Contribution to Verdict |
|-------|----------------------------|
| Pierrehumbert 1980 | AM theory foundation: H/L tones, finite-state grammar, downstep k~0.6, baseline+range model |
| Ladd 2008 | Definitive AM exposition: 5 MAE-ToBI accents, segmental anchoring, sagging transitions, three-layer pitch scaling |
| O'Shaughnessy 1976 | Two-level HLS+LLS architecture, 16-level accent priority, declination ~3%/100ms |
| Fujisaki (undated) | Command-response superpositional model: phrase (Gp) + accent (Ga) components, alpha~2-3, beta~20 |
| Taylor 2000 | Tilt model: continuous amplitude/duration/tilt parameters, ~79% of accents are H* |
| Ladd 2021 | ToBI critique: categorical distinctions (L+H* vs H*) may be gradient, not categorical |
| Ladd 1985 | Three independent affect channels: contour type, F0 range (R formula), voice quality |
| Ladd 2014 | Historical priority of Pike for four-level intonation analysis |
| Beckman 2022 | Complete MAE-ToBI specification, AM+ five-level extension |
| Silverman 1992 | Original ToBI standard, 80%+ inter-labeler reliability |
| Pitrelli 1994 | ToBI reliability: 81.4% overall tonal agreement, downstep is 33.5% of disagreements |
| Breen (in press) | ToBI/RaP reliability: kappa 0.54 for fine-grained accents, RaP matches/exceeds ToBI |
| Goldsmith 1976 | Autosegmental phonology: multi-tier representation, well-formedness condition |
| Jun 2005 | Cross-linguistic prosodic typology: 13 languages, 8 generalizations |
| Sluijter 1996 | Spectral balance (not overall intensity) is second-strongest stress cue after duration |
| Wightman 1992 | Pre-boundary lengthening in rhyme only; four distinct levels by break index |
| Beckman 1990 | Phrase-final lengthening (30-50%) vs word-final lengthening (10-20%), independent effects |
| White 2014 | Four lengthening effects, lengthening-only principle, polysyllabic shortening reinterpreted |
| Edwards 1988 | Phrase-final lengthening is non-uniform (closing phase lengthens more than opening) |
| van Santen 1997 | Sums-of-products duration model, directional invariance, critique of CART |
| Price 1991 | 7-level break index precursor to ToBI, 84% syntactic disambiguation accuracy |
| Strom 2002 | EM bootstrapping for prosody without hand-labeled ToBI, 65% listener preference |
| Ohala 1984 | Frequency code: biological basis for F0-meaning associations (high=small/submissive, low=large/dominant) |
| Hombert 1979 | F0 perturbation ~8% after voiceless stops (not 20%), persists >100ms in English |
| Roach 1994 | SEC-to-ToBI conversion; non-final fall-rise is a gap in ToBI |
| De Tournemire 1998 | Prosodic alphabet, syllable elasticity k, 4-point F0 stylization |
| Ronanki 2013 | Syllable-level HMMs better for F0, phone-level for spectra |
| Hellbernd 2016 | Six speech acts have distinct prosodic profiles; pitch contour is most discriminating |
| Trott 2022 | Indirect requests vs literal statements/questions disambiguated by prosody |
| Goupil 2021 | Confidence = LHL%, uncertainty = HLH%, loudness = accuracy, duration = confidence |
| Jiang 2017 | Graded confidence levels with distinct F0, intensity, duration, voice quality profiles |
| Vaughan-Johnston 2024 | Falling intonation signals confidence, +/-35 Hz shifts perceptible, 50%+ sentences needed |
| Rosenberg 2009 | Charisma: higher mean F0, more H* accents, fewer L* and rising boundaries |

## Synthesizer Files Audited

- `public/rules/frontends/qlatt-english/phases/prosody.yaml` -- F0 contour rules (20 rules)
- `public/rules/frontends/qlatt-english/frontend.yaml` -- pipeline config, F0 and duration parameters

---

## Question 1: Is the Autosegmental-Metrical / ToBI framework the right choice for Qlatt?

**Verdict: LIMITED -- correct theoretical foundation but implementation must acknowledge ToBI's known weaknesses.**

### Evidence

The AM framework (Pierrehumbert 1980, Ladd 2008) is the dominant intonation theory and has clear advantages for rule-based synthesis:

1. **Discrete tonal targets map directly to synthesis rules.** Each pitch accent, phrase accent, and boundary tone corresponds to a point target in F0 space. This is exactly what Qlatt's point-insertion model does.

2. **ToBI reliability is acceptable but not high.** Pitrelli 1994 reports 81.4% overall tonal agreement, but kappa for fine-grained accent types is only ~0.54 (Breen). Downstep (!H*) accounts for 33.5% of disagreements (Pitrelli 1994).

3. **Ladd 2021 argues key ToBI distinctions may be gradient, not categorical.** The L+H* vs H* distinction -- which Qlatt implements as separate rules -- may be a continuum of alignment timing rather than a binary phonological contrast. This matters because implementing them as categorically different rules may over-specify what is actually a continuous parameter.

4. **Taylor 2000 found ~79% of all ToBI accents in his corpus are H*.** This suggests the practical accent inventory is simpler than the theoretical one, and getting H* right matters far more than modeling rare accent types.

5. **Cross-linguistic evidence supports AM.** Jun 2005 shows the basic H/L tone framework works across 13 languages. The framework itself is not English-specific.

### Assessment of Qlatt's Implementation

Qlatt's prosody.yaml implements 7 accent types: H*, H*+L, L+H*, H+!H*, H*+H, H+L*, L*. The current MAE-ToBI standard (Beckman 2022) defines only 5: H*, L*, L+H*, L*+H, H+!H*. Qlatt includes two non-standard types (H*+L, H*+H) while missing L*+H.

**Recommendation:** Retain the AM/ToBI framework. It maps naturally to Qlatt's point-insertion architecture. However:
- Consolidate accent inventory to match the standard 5 MAE-ToBI accents
- Add L*+H (rising accent with low star)
- Consider removing H*+L and H*+H or re-labeling them as allophonic variants of H* with different phrase-accent contexts
- Accept that !H* (downstep) reliability is low and may need graceful degradation

---

## Question 2: Pierrehumbert point-target model vs. Fujisaki command-response model for synthesis?

**Verdict: Pierrehumbert is the better choice for Qlatt's architecture. Fujisaki is LIMITED to superpositional F0 but not suitable for a rule-based frontend.**

### Evidence

**Pierrehumbert 1980:**
- F0 is computed by left-to-right traversal of tonal targets with interpolation
- Downstep is modeled as exponential decay: H_n = V * k^n, k ~= 0.6
- Final lowering applies a multiplicative factor to the last accent
- Transitions between tones use simple interpolation (linear or sagging)
- Maps directly onto Qlatt's point-insertion rules with CEL expressions

**Fujisaki model:**
- F0 = baseline + sum(phrase_commands * Gp) + sum(accent_commands * Ga)
- Phrase command: impulse response with alpha ~= 2-3 rad/s (slow, ~2-3 second time constant)
- Accent command: step response with beta ~= 20 rad/s (fast, ~50ms rise time)
- Parameters are continuous and optimizable; works well for 14+ languages
- Requires a global optimization step to set command amplitudes and timings

**Why Pierrehumbert wins for Qlatt:**

1. **Architectural fit.** Qlatt's rule engine processes tokens left-to-right and inserts F0 point targets. Pierrehumbert's model is inherently left-to-right. Fujisaki requires computing a superposition of overlapping command responses, which would need a different processing architecture.

2. **Explainability.** Each Pierrehumbert target can be traced to a specific rule with a specific citation. A Fujisaki command's contribution to F0 at any moment is the integral of multiple overlapping responses -- harder to trace provenance.

3. **Linguistic grounding.** Pierrehumbert's tones are phonological objects with direct linguistic interpretation. Fujisaki's commands are signal-processing abstractions. For a synthesizer that values explainability (CLAUDE.md Principle 1), phonological objects are preferable.

4. **Fujisaki's strength -- smooth contours -- can be achieved with interpolation.** Sagging transitions (Ladd 2008) and quadratic spline interpolation (Ladd 1985 uses Hirst 1983) give smooth F0 without the command-response machinery.

**No change to Qlatt's fundamental architecture needed.** The point-target model is correct.

---

## Question 3: Is O'Shaughnessy 1976's rule-based F0 model still adequate?

**Verdict: SUPERSEDED -- O'Shaughnessy 1976 is historically important but the specific rules have been replaced by the AM/ToBI framework.**

### Evidence

O'Shaughnessy 1976 introduced a two-level architecture:
- **HLS (High-Level Synthesizer):** 16-level accent priority list with break/CR system for prosodic phrasing
- **LLS (Low-Level Synthesizer):** Phonetic F0 generation with declination (~3%/100ms fall)

The HLS accent priority system has been superseded by ToBI's pitch accent inventory. O'Shaughnessy's 16 accent levels conflate things that are now modeled separately (accent type, phrase position, stress level, focus).

The LLS declination model (3%/100ms linear fall) has been superseded by Pierrehumbert's downstep mechanism. Declination in the AM framework emerges from sequential downstep of H tones, not from a global linear trend imposed on all F0 targets.

**What O'Shaughnessy got right:**
- Two-level architecture (symbolic prosody -> phonetic F0) is now standard
- Sub-contour approach (computing F0 for each accent unit then concatenating) prefigures Pierrehumbert's local computation
- The observation that F0 perturbation from voiceless consonants raises pitch -- confirmed by Hombert 1979, though O'Shaughnessy overestimated at ~20% vs Hombert's measured ~8%

**What Qlatt currently does:**
- Qlatt's prosody.yaml already uses the AM/ToBI model, not O'Shaughnessy's system
- Declination is modeled via unaccented_declination rule (0.98 falloff between accents) and downstep (k=0.6)
- The O'Shaughnessy citations in frontend.yaml are appropriate as historical references but his specific rules should not be implemented

**Qlatt's microprosodic perturbation uses 1.1 (10%) for voiceless onset raising.** Hombert 1979 measured ~8% (10 Hz on 130 Hz baseline). O'Shaughnessy suggested ~20%. The current 10% is a reasonable engineering compromise. A more accurate value would be 1.08 based on Hombert's data.

---

## Question 4: What is stress, acoustically? Does Qlatt model it correctly?

**Verdict: LIMITED -- Qlatt models stress via F0 and duration but is missing the spectral tilt dimension.**

### Evidence

Sluijter 1996 (perceptual study, Dutch) established the hierarchy of stress cues:
1. **Duration**: 68-93% of variance (depending on conditions)
2. **Spectral balance (spectral tilt)**: 76% of variance when separated from overall intensity
3. **Overall intensity**: ~1% of variance (marginal cue at best)

This is a critical finding: overall amplitude (AV in Klatt terms) is nearly irrelevant for stress perception. What matters is the spectral tilt -- stressed vowels have more energy above 500 Hz, producing a flatter spectrum.

**What Qlatt currently does for stress:**
- F0: Pitch accents (H*, L+H*, etc.) mark stressed syllables with F0 targets -- CORRECT
- Duration: Pre-boundary lengthening multipliers in frontend.yaml (bi4=1.5, bi3=1.3, bi2=1.15, bi1=1.05) -- CORRECT per Wightman 1992
- Spectral tilt: NOT IMPLEMENTED for stress contrast

**What is missing:**
- Stressed vowels should have reduced TL (spectral tilt) by 3-9 dB (Sluijter 1996)
- Stressed vowels should have lower open quotient (OQ), producing more abrupt glottal closure
- These map to Klatt parameters: TL (spectral tilt) and OQ
- Currently, stressed and unstressed vowels differ only in F0 and duration, not in voice source characteristics

**Recommendation:** Add spectral tilt rules to the prosody or duration phase:
- Stressed vowels: reduce TL by ~6 dB (midpoint of Sluijter's 3-9 dB range)
- Unstressed vowels: default TL
- This is orthogonal to F0 and duration rules (Ladd 1985 confirms independence)

---

## Question 5: Are Qlatt's pre-boundary lengthening rules correct?

**Verdict: CORRECT in magnitude, LIMITED in scope distribution.**

### Evidence

Wightman 1992 established:
- Pre-boundary lengthening is restricted to the **rhyme** (nucleus + coda) of the final syllable
- Four statistically distinct lengthening levels: {break 0-1}, {break 2}, {break 3}, {break 4-6}
- Lengthening does NOT apply to onset consonants of the final syllable (correlation -0.001)
- Lengthening does NOT apply to segments after the boundary

**Qlatt's current values (frontend.yaml):**
- Break index 4+: 1.5x -- Wightman's data suggests ~1.3 sigma above mean, consistent
- Break index 3: 1.3x -- Wightman's data: ~0.7 sigma, consistent
- Break index 2: 1.15x -- Wightman's data: ~0.3 sigma, consistent
- Break index 1: 1.05x -- Wightman found 0-1 not significantly different, so 1.05 is slightly generous

Beckman 1990 additionally distinguishes:
- Intonational phrase-final lengthening: 30-50% increase (matches bi4=1.5)
- Word-final lengthening: 10-20% increase (smaller, less consistent)

Edwards 1988 found phrase-final lengthening is **non-uniform within the syllable**: the closing gesture (coda) lengthens proportionally more than the opening gesture (onset/nucleus). Qlatt currently applies a uniform multiplier to the entire pre-boundary segment.

White 2014 proposes a **lengthening-only principle**: all four documented effects (phrase-final, word-final, polysyllabic, accentual) are LENGTHENING at prosodic boundaries, with "shortening" being the absence of lengthening.

**Recommendations:**
- Multiplier magnitudes are well-calibrated. No change needed.
- Consider applying non-uniform lengthening: coda consonants get a larger share than the nucleus (Edwards 1988)
- The bi1=1.05 multiplier is not supported by Wightman's data (0 and 1 are statistically indistinguishable). Reducing to 1.0 would be more accurate.
- Ensure lengthening applies only to the final syllable rhyme, not onset consonants

---

## Question 6: Are Qlatt's F0 parameter values well-calibrated?

**Verdict: CORRECT -- parameter values are well-sourced and within literature ranges.**

### Evidence

| Parameter | Qlatt Value | Literature Source | Assessment |
|-----------|-------------|-------------------|------------|
| downstep_k | 0.6 | Pierrehumbert 1980: k ~= 0.6 | CORRECT |
| final_lowering_factor | 0.85 | Pierrehumbert 1980: 15-20% lowering of final H | CORRECT |
| h_star_height | 0.85 | 85% of range above base -- reasonable default | CORRECT |
| l_star_height | 0.15 | 15% of range above base -- reasonable default | CORRECT |
| upstep_factor | 0.2 | H% raises by 20% of range -- reasonable | CORRECT |
| voiceless_onset_raise | 1.1 (10%) | Hombert 1979: ~8%; O'Shaughnessy: ~20% | ACCEPTABLE (compromise) |
| voiced_onset_lower | 0.95 (-5%) | Hombert 1979: smaller effect for voiced | CORRECT |
| base_hz | 110 | Default male F0 | CORRECT |
| range_hz | 80 | 80 Hz range (110-190 Hz) | CORRECT |

The R-formula from Ladd 1985 for pitch range scaling (F0_new = Fr * [F0_old / Fr]^R) is not currently implemented. This would be valuable for expressiveness: R > 1 = wider range (more animated), R < 1 = narrower range (more monotone). The formula scales all targets logarithmically relative to the speaker floor.

---

## Question 7: What is missing from Qlatt's prosody model?

### Missing Features (ordered by impact)

1. **Sagging transitions.** Ladd 2008 describes the sag between H tones as a perceptually significant feature. Parameters exist in frontend.yaml (sag_depth_fraction: 0.15) but no rule in prosody.yaml implements them. This produces more natural-sounding contours between accents.

2. **Spectral tilt for stress.** Sluijter 1996 shows spectral balance is the second most important stress cue. Currently not implemented.

3. **Segmental anchoring.** Ladd 2008 shows tonal targets align with specific segmental landmarks (e.g., H* peaks align consistently ~15ms after the end of the accented syllable onset). Qlatt currently places targets at segment midpoints or boundaries without this fine-grained alignment.

4. **Pitch range scaling (R parameter).** Ladd 1985's formula for affect-driven range scaling. Would enable expressiveness control (confident = wider range, uncertain = narrower range).

5. **L*+H accent type.** Missing from the current 7-accent inventory despite being in the MAE-ToBI standard.

6. **Non-uniform phrase-final lengthening.** Edwards 1988 shows coda consonants lengthen proportionally more than nuclei at phrase boundaries.

7. **Epistemic prosody patterns.** Goupil 2021 and Jiang 2017 provide specific F0 contour shapes for confidence (LHL%) vs uncertainty (HLH%). These could be implemented as speaking-style presets.

---

## Summary Table

| Model/Claim | Verdict | Rationale |
|-------------|---------|-----------|
| AM/ToBI framework for synthesis | **LIMITED** | Correct foundation but accent inventory over-specified; some distinctions are gradient |
| Pierrehumbert point-target model | **CORRECT** | Best fit for Qlatt's rule-based architecture |
| Fujisaki command-response model | **INCOMPARABLE** | Different architecture; superior for statistical/neural F0 but wrong paradigm for rule-based synthesis |
| O'Shaughnessy 1976 F0 rules | **SUPERSEDED** | Replaced by AM/ToBI; historical importance only |
| ToBI accent inventory (5 types) | **LIMITED** | Reliability is moderate (kappa 0.54); L+H* vs H* may be gradient (Ladd 2021) |
| Downstep k=0.6 | **CORRECT** | Pierrehumbert 1980, confirmed by Ladd 2008 |
| Wightman 1992 boundary lengthening | **CORRECT** | Four distinct levels, rhyme-only scope, well-replicated |
| Sluijter 1996 spectral stress cues | **CORRECT** | Duration + spectral tilt, not overall intensity |
| Ohala 1984 frequency code | **CORRECT** | Biological basis for F0-meaning associations, cross-linguistic |
| Hombert 1979 microprosody | **CORRECT** | ~8% F0 perturbation from voiceless stops |
| Ladd 1985 three independent channels | **CORRECT** | Contour type, F0 range, voice quality are orthogonal |

## Qlatt Action Items

| Priority | Action | Source |
|----------|--------|--------|
| 1 | Implement sagging transitions between H tones | Ladd 2008; parameters already in frontend.yaml |
| 2 | Add spectral tilt (TL) rules for stress contrast | Sluijter 1996: -6 dB for stressed vowels |
| 3 | Implement Ladd 1985 R-formula for pitch range scaling | Ladd 1985: F0_new = Fr * [F0/Fr]^R |
| 4 | Consolidate accent inventory to 5 MAE-ToBI types | Beckman 2022; add L*+H, evaluate H*+L and H*+H |
| 5 | Reduce voiceless_onset_raise from 1.10 to 1.08 | Hombert 1979: measured ~8% |
| 6 | Reduce bi1 pre-boundary lengthening from 1.05 to 1.0 | Wightman 1992: break 0 and 1 not distinguishable |
| 7 | Add non-uniform lengthening (coda > nucleus) | Edwards 1988 |
| 8 | Add segmental anchoring for tonal alignment | Ladd 2008: H* peaks ~15ms after accented onset |
