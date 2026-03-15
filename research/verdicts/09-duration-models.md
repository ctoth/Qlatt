# Verdict 09: Duration Models

## Papers Reviewed

| Paper | Read | Status |
|-------|------|--------|
| Klatt 1976 (SegmentalDuration) | Yes | Foundational |
| van Santen 1993 (SegmentalDuration) | Yes | Supersedes Klatt 1976 |
| van Santen 1994 (SegmentalDurationTTS) | Yes | Full journal version of 1993 |
| Crystal & House 1982 (SegmentalDurationsConnectedSpeech) | Yes | Empirical baseline |
| Crystal & House 1988 (StopConsonantDuration) | Yes | Stop-specific data |
| Campbell & Isard 1991 (SegmentDurationsSyllable) | Yes | Complementary framework |
| Umeda 1975 (VowelDurationAmericanEnglish) | Yes | Connected-speech vowel data |
| Peterson & Lehiste 1960 (DurationSyllableNuclei) | Yes | Foundational vowel durations |
| Klatt 1973 (DurationStopConsonantClusters) | Yes | Cluster shortening rules |
| Port 1979 (ClosureDurationVoicingPlace) | Yes | Stop closure data |
| Oller 1973 (EffectPositionUtteranceDuration) | Yes | Positional lengthening |
| Bartkova & Sorin 1987 (ModelSegmentalDurationFrench) | Yes | Cross-language comparison |
| Wightman et al. 1992 (SegmentalDurationsProsodic) | Yes | Prosodic boundary lengthening |
| Beckman & Edwards 1990 (LengtheningsShorteningsProsodic) | Yes | Boundary vs stress distinction |
| Edwards & Beckman 1988 (ArticulatoryTimingProsodicInterpretation) | Yes | Non-uniform lengthening |
| Byrd & Saltzman 2003 (ElasticPhraseBoundaryLengthening) | NOT IN COLLECTION | Cannot review |
| White 2014 (ProsodicTimingFunction) | Yes | Functional timing framework |
| Hertz & Huffman 1992 (NucleusBasedTiming) | Yes | Nucleus-based timing alternative |
| Jongman 1989 (FricativeDuration) | Yes | Fricative perceptual thresholds |
| Schotz 2006 (F0DurationSpeakerAge) | Yes | Age-related duration (peripheral) |

## Evidence Hierarchy Applied

1. Connected-speech corpus data (Crystal & House 1982/1988, van Santen 1994) > isolated word data (Peterson & Lehiste 1960, Oller 1973)
2. Sums-of-products with perceptual validation (van Santen 1994: r=0.93, 73% listener preference) > pure multiplicative (Klatt 1976: r=0.97 on 56 conditions but lab data)
3. Modern prosodic-boundary models (Wightman 1992: 4 distinct lengthening levels, rhyme-only scope) > fixed boundary factors
4. Articulatory timing evidence (Edwards & Beckman 1988) informs how lengthening should be implemented, not just how much

---

## Paper-by-Paper Verdicts

### Klatt 1976 — SUPERSEDED (partially)

**Verdict: SUPERSEDED by van Santen 1994 for the overall duration model architecture; individual rule factors remain usable as engineering approximations where van Santen's full parameter set is unavailable.**

Evidence:
- Van Santen 1994 demonstrates Klatt's multiplicative model is a special case of sums-of-products (Eq. 2-3 vs Eq. 5)
- Van Santen achieves 73% listener preference over Klatt-style rules (60% of sentences significantly preferred)
- Key limitation: Klatt's model does not capture interaction between pitch accent and syllabic stress (amplificatory, not multiplicative)
- Klatt's incompressibility formula (D_min = ~0.42-0.45 * D_inherent) remains valid and is not addressed by van Santen

**What survives:**
- Incompressibility principle (Eq. 1): D_f = K * (D_i - D_min) + D_min
- Perceptual relevance hierarchy (effects > 25 ms JND matter most)
- Individual factor magnitudes (K=0.7 for non-word-initial, K=0.8 for unstressed consonants) are reasonable single-speaker approximations
- Table I factor catalog remains the most comprehensive single-source list of what affects duration

### van Santen 1993 / 1994 — CURRENT BEST for segment-level duration modeling

**Verdict: CURRENT BEST. The sums-of-products framework with category tree is the state of the art for rule-based segmental duration.**

Key findings:
- 42 separate models, 619 parameters, r=0.93 overall
- Category tree: vowels (32 params), intervocalic consonants (196 params), consonants in clusters (391 params)
- Critical interactions: pitch accent x stress (amplificatory), postvocalic consonant x phrasal position
- Log-domain computation recommended
- Speaking rate applies as uniform multiplier with category-specific ratios

**Limitation for Qlatt:** Full parameter values are not published. The model structure is implementable but would require training data to calibrate. Qlatt's current Klatt-style rules are a reasonable approximation until such data is available.

### Crystal & House 1982 — LIMITED (superseded by 1988 and van Santen)

**Verdict: LIMITED. Valuable as connected-speech baseline statistics but superseded by later work for specific duration predictions.**

What remains useful:
- Gamma distribution parameters for duration variability modeling
- Category-level statistics (fast/slow groups) for speaking rate calibration
- Finding that <50% of connected-speech stops are complete (have release bursts)
- Pre-voicing lengthening is context-dependent and may not apply uniformly

### Crystal & House 1988 — CURRENT for stop consonant duration specifics

**Verdict: CURRENT for connected-speech stop duration data. Key findings contradict lab-based generalizations.**

Critical findings for Qlatt:
- Hold duration does NOT distinguish voicing in connected speech (voiced ~54 ms, voiceless ~53 ms)
- Release duration DOES distinguish voicing (voiced ~18 ms, voiceless ~39 ms)
- Release duration distinguishes place (labial ~20 ms, alveolar ~30 ms, velar ~44 ms)
- Only 59% of stops in connected speech are complete
- Word-initial: 85% complete; word-final: 33% complete

### Campbell & Isard 1991 — COMPLEMENTARY (not superseding, not superseded)

**Verdict: INCOMPARABLE. Addresses a different level of timing (syllable) than Klatt/van Santen (segment). The two are complementary.**

Key framework elements:
- z-score normalization for segment durations within syllables
- Elasticity hypothesis: all segments in a syllable compress/expand by constant factor k
- Final lengthening concentrated in rhyme (peak + coda), not onset: 0.75^(n-i) weighting
- Syllable duration predicted first, segments accommodated within

**Relevance to Qlatt:** Currently Qlatt has no syllable-level timing layer. Adding one would be an architectural enhancement, not a rule correction. Campbell & Isard's 0.75^(n-i) formula for final-syllable lengthening distribution is directly implementable.

### Umeda 1975 — LIMITED (superseded by van Santen for model, data remains useful)

**Verdict: SUPERSEDED for the model architecture; LIMITED for the data tables.**

- Model: T = T_0 + S(K_1 + K_2 * C) — multiplicative S and C factors
- Van Santen's sums-of-products captures the same phenomena more accurately
- Umeda's C-factor ordering (voiceless stops < nasals < voiceless fricatives < voiced stops < voiced fricatives) remains valid and is confirmed by Peterson & Lehiste 1960

### Peterson & Lehiste 1960 — LIMITED (foundational but superseded)

**Verdict: LIMITED. Foundational intrinsic duration data from isolated CNC words. Superseded by connected-speech data for absolute values, but the voicing ratio (~2:3 for voiceless:voiced) and manner ordering remain confirmed.**

### Klatt 1973 — CURRENT for cluster duration rules

**Verdict: CURRENT. The five cluster shortening rules remain the most specific available data for English onset clusters.**

Rules:
1. General shortening: C1=-12%, C2=-22% (2-element); C1=-15%, C2=-25%, C3=-30% (3-element)
2. Sonorant lengthening after aspirated voiceless stop: +28%
3. Ballistic shortening before stops: -8% (additional -8% before voiceless)
4. Labial incompressibility: +6% (adjacent: -6%)
5. Retroflection after dental: /r/ +13%, dental -13%

These stack additively. No later work provides more specific cluster duration rules for English.

### Port 1979 — CURRENT for stop closure voicing cue data

**Verdict: CURRENT. Provides the tempo-relative framework for closure duration as a voicing cue.**

Key data: voiced/voiceless closure ratio ~0.65-0.75 across tempos. Apical stops ~10-15 ms shorter closure than labials. Perceptual boundary shifts ~10 ms between fast and slow speech.

### Oller 1973 — SUPERSEDED (by Wightman 1992 and Beckman & Edwards 1990)

**Verdict: SUPERSEDED for boundary lengthening magnitudes and scope. Wightman 1992 provides break-index-scaled lengthening; Beckman & Edwards 1990 separate boundary from stress effects.**

What survives: confirmation that final lengthening occurs across all intonation types and at word-final, not just utterance-final.

### Bartkova & Sorin 1987 — INCOMPARABLE (French)

**Verdict: INCOMPARABLE. French duration model, useful for cross-language validation of multiplicative framework but not directly applicable to English Qlatt rules.**

Notable: uses multiplicative coefficients (all < 1.0 for connected speech), confirming that connected-speech durations are always shorter than intrinsic durations.

### Wightman et al. 1992 — CURRENT BEST for prosodic boundary lengthening

**Verdict: CURRENT BEST. Provides the quantitative data for break-index-scaled pre-boundary lengthening.**

Key findings:
- Lengthening confined to RHYME of final syllable (onset: correlation -0.001 with break index)
- Four distinct lengthening levels: {0,1}, {2}, {3}, {4,5,6}
- Suggested multipliers (from z-score data): bi0-1 = no change; bi2 = +0.3*sigma; bi3 = +0.7*sigma; bi4+ = +1.3*sigma
- Lengthening and pausing are ADDITIVE (not compensatory)
- No significant post-boundary lengthening

### Beckman & Edwards 1990 — CURRENT for boundary vs stress distinction

**Verdict: CURRENT. Experimental demonstration that phrase-final lengthening and stress-timed shortening are independent effects at different prosodic levels.**

Key for Qlatt: separate duration rules for boundary lengthening vs stress lengthening are correct (not the same operation).

### Edwards & Beckman 1988 — CURRENT for implementation guidance

**Verdict: CURRENT. Shows phrase-final lengthening is NON-UNIFORM (concentrated in closing phase of vowel), while stress lengthening is more uniform.**

Implementation implication: a simple duration multiplier is adequate for stress but inadequate for phrase-final lengthening. The closing portion of the vowel and following sonorant should be lengthened more. Qlatt currently uses uniform multipliers for both.

### White 2014 — CURRENT for functional framework

**Verdict: CURRENT. Proposes that only four localized lengthening effects are needed: word-initial (onset), phrase-final (word-rhyme), lexical stress (stressed syllable), phrasal accent (accented word).**

Key claims:
- Polysyllabic shortening is reinterpreted as distributed lengthening, not compression
- No compensatory effects needed
- Each effect has a distinct locus (enabling disambiguation by listeners)

### Hertz & Huffman 1992 — INCOMPARABLE (different architectural approach)

**Verdict: INCOMPARABLE. The acoustic-nucleus timing model is an alternative architecture to segment-level rules. Not directly comparable to Qlatt's current approach.**

Key insight: trading relationship within acoustic nuclei (longer transitions = shorter vowel) cannot be captured by segment-level rules. This is an architectural limitation of Qlatt's current design.

### Jongman 1989 — CURRENT for fricative perceptual thresholds

**Verdict: CURRENT. Establishes minimum frication durations for perceptual identification.**

Thresholds: sibilants [sh, z] ~30 ms; labiodentals [f, v] ~50 ms; dentals [th, dh] need full duration (~100+ ms). Below 20 ms, fricatives perceived as stops.

### Schotz 2006 — INCOMPARABLE (speaker age, Swedish)

**Verdict: INCOMPARABLE. Peripheral to Qlatt's duration model. Confirms F0 and duration are most robust age cues. Not relevant to segmental duration rules.**

---

## Synthesizer Audit

### Rule-by-Rule Analysis

#### 1. `non_word_initial_consonant_shortening` (K=0.7)
- **Citation claims:** Klatt 1976 Table III (non-word-initial consonant K=0.7)
- **Citation correct:** Yes. Klatt 1976 Rule 1 for consonants: non-word-initial K=0.7
- **Better data available:** van Santen 1994 provides category-specific consonant duration models with more parameters. However, K=0.7 is a reasonable single-factor approximation.
- **Issue:** This is a pure multiplicative rule. Klatt 1976 uses the incompressibility formula: D = K*(D-D_min)+D_min. Qlatt applies K directly to duration without an incompressibility floor. This means short consonants can be compressed to unreasonably small values.
- **Verdict:** CITATION CORRECT. IMPLEMENTATION ISSUE: missing incompressibility floor.

#### 2. `word_medial_consonant_shortening` (K=0.85)
- **Citation claims:** Klatt 1976 Table III (word-medial consonant K=0.7)
- **Citation correct:** Partially. Klatt 1976 gives K=0.7 for word-medial, but Qlatt uses 0.85.
- **Issue:** The rule stacks with `non_word_initial_consonant_shortening` (both fire for word-medial consonants). Combined: 0.7 * 0.85 = 0.595. Klatt 1976 Table III gives word-medial consonants the SAME K=0.7 as non-word-initial. The intended total shortening for word-medial consonants is approximately K=0.7 applied to the incompressible portion, not 0.595x the full duration.
- **Better data:** van Santen 1994 models within-word position as a separate factor with interactions.
- **Verdict:** CITATION PARTIALLY CORRECT (cites K=0.7 but uses 0.85). IMPLEMENTATION ISSUE: stacking creates excessive shortening without incompressibility floor.

#### 3. `unstressed_consonant_shortening` (K=0.8)
- **Citation claims:** Klatt 1976 Table III (unstressed consonant K=0.8)
- **Citation correct:** Yes. Klatt 1976 Rule 2 for consonants: unstressed K=0.8.
- **Better data:** van Santen 1994 models stress as a factor interacting with consonant identity and position.
- **Verdict:** CITATION CORRECT. Reasonable approximation.

#### 4. `word_initial_lengthening` (K=1.2)
- **Citation claims:** White 2014 (localized word-initial lengthening +20-30% on onset consonants)
- **Citation correct:** Yes. White 2014 Table states word-initial onset consonants are 20-30% longer than medial. Oller 1973 also reports ~20-30 ms word-initial increment.
- **Issue:** White 2014 specifies this affects ONSET CONSONANTS ONLY, not the vocalic nucleus. The rule currently applies to all consonant types at word boundaries, which is correct.
- **Verdict:** CITATION CORRECT. Implementation matches the literature.

#### 5. `stress_duration` (primary=1.3, unstressed=0.8)
- **Citation claims:** Klatt 1976 section III.B
- **Citation correct:** Partially. Klatt 1976 gives unstressed vowel K=0.4-0.55 (applied with incompressibility), not a flat 0.8x multiplier. For primary stress, Klatt does not give a lengthening factor because stressed is the default; the other conditions shorten.
- **Better data:** van Santen 1994 models stress with pitch accent interaction (amplificatory). Campbell & Isard 1991 report z-score-based stress effects within syllable frame.
- **Issue:** The 1.3 primary stress multiplier is an engineering estimate not directly from Klatt 1976. The 0.8 unstressed multiplier underestimates the shortening that Klatt 1976 reports (K=0.4-0.55 with incompressibility, resulting in ~35-60% shortening of the compressible portion).
- **Verdict:** CITATION PARTIALLY CORRECT. The unstressed multiplier is too gentle; Klatt's data suggests much more shortening.

#### 6. `vowel_shortening` (postvocalic context)
- **Citation claims:** Klatt 1976, Allen et al. 1987 Ch.9
- **Values:** end=1.2, voiced_fricative=1.6, voiced_stop=1.2, nasal=0.85, voiceless_stop=0.7
- **Citation correct:** The general pattern follows Peterson & Lehiste 1960 and Umeda 1975: voiced fricatives cause most lengthening, voiceless stops cause most shortening. The specific multiplier values appear to be from Allen et al. 1987 (MITalk system).
- **Better data:** van Santen 1994 models postvocalic consonant effect with interaction with phrasal position (the voicing effect is large phrase-finally but small phrase-medially, per Klatt 1976). Qlatt's rule does not condition on phrasal position.
- **Issue:** The voiced fricative multiplier of 1.6 is very large and applies uniformly regardless of phrasal position. Klatt 1976 notes the voicing effect on vowel duration is only ~10-20 ms in non-phrase-final positions (below JND), but 50-100 ms phrase-finally. Applying 1.6 everywhere will over-lengthen phrase-medial vowels.
- **Verdict:** CITATION CORRECT in pattern. VALUES NEED POSITION CONDITIONING per van Santen 1994 and Klatt 1976.

#### 7. `accent_vowel_lengthening`
- **Citation claims:** van Santen 1994 (pitch accent x stress), White 2014 (phrasal accent), Turk & Shattuck-Hufnagel 2007
- **Values:** nuclear=1.25, stressed=1.15, unstressed=1.05
- **Citation correct:** Yes, qualitatively. Van Santen 1994 demonstrates accent x stress amplificatory interaction. White 2014 confirms accent lengthening distributes across the accented word.
- **Issue:** The specific multiplier values are engineering estimates (acknowledged in the policy citations). Van Santen does not publish specific scale factors.
- **Verdict:** CITATIONS CORRECT. VALUES ARE ENGINEERING ESTIMATES (acknowledged).

#### 8. `pre_boundary_lengthening`
- **Citation claims:** Wightman et al. 1992, Klatt 1976 section III.A, Crystal & House 1988
- **Values:** bi4=1.5 (sonorant) / 1.2 (obstruent), bi3=1.3/1.1, bi2=1.15, bi1=1.05
- **Citation correct:** Yes. Wightman 1992 provides break-index-scaled lengthening. The sonorant/obstruent distinction follows Crystal & House 1988 (sonorants lengthen more at boundaries). The four-level distinction matches Wightman's finding of four significant levels.
- **Issue 1:** Wightman 1992 shows lengthening is confined to the RHYME of the final syllable (onset correlation = -0.001). Qlatt applies the multiplier to ALL non-SIL segments near the boundary, not just the rhyme. This will incorrectly lengthen onset consonants.
- **Issue 2:** Edwards & Beckman 1988 show phrase-final lengthening is non-uniform within the vowel (concentrated in closing phase). Qlatt uses a uniform multiplier.
- **Issue 3:** The rule scans ahead for SIL within the same word, meaning it can apply to segments far from the boundary. Wightman's data shows lengthening in the IMMEDIATELY pre-boundary syllable only.
- **Verdict:** CITATIONS CORRECT. IMPLEMENTATION ISSUES: (a) scope too broad (should be rhyme-only), (b) uniform multiplier (should be non-uniform per Edwards & Beckman 1988), (c) scan distance may over-apply.

#### 9. `fricative_minimum_duration`
- **Citation claims:** Jongman 1989
- **Values:** sibilant=30 ms, labiodental=50 ms, dental=60 ms, glottal=40 ms
- **Citation correct:** Yes. Jongman 1989: sibilants [sh, z] identifiable at ~30 ms; [f, v, s] at ~50 ms; dentals [th, dh] poorly identified even at full duration.
- **Issue:** Jongman's data shows dentals need the LONGEST durations, not 60 ms. The 60 ms value is conservative but may be insufficient for [th] and [dh] identification. Jongman reports they are poorly identified even at 70 ms (65% of mean duration).
- **Verdict:** CITATION CORRECT. Dental minimum could be higher (~80-100 ms).

#### 10. `lock_stop_release_duration`
- **Citation claims:** Allen et al. 1987 Table C-1
- **Citation correct:** Yes. Stop releases have fixed durations set in the inventory.
- **Verdict:** CITATION CORRECT. Appropriate implementation.

#### 11. `stop_unreleasing`
- **Citation claims:** Miller 1998, Crystal & House 1988
- **Citation correct:** Yes. Crystal & House 1988 reports only 59% of stops complete in connected speech, with word-final drops to 33%. Miller 1998 addresses unreleased stops.
- **Verdict:** CITATION CORRECT. Good implementation.

#### 12. `s_cluster_aspiration_reduction`
- **Citation claims:** Lisker & Abramson 1964, Zue 1976
- **Citation correct:** Yes. VOT in s-clusters is near zero.
- **Verdict:** CITATION CORRECT.

#### 13. `speech_rate_scaling`
- **Citation claims:** Klatt 1976 section III, Allen et al. 1987 Ch.9
- **Implementation:** Uniform 1/rate_scale multiplier to all non-SIL segments.
- **Issue:** Crystal & House 1982 and van Santen 1994 show that speaking rate affects different segment categories differently. Stop closures have larger rate ratios than bursts. Vowels show larger phrase-final than phrase-medial rate effects. A uniform multiplier is an approximation.
- **Verdict:** CITATION CORRECT. IMPLEMENTATION SIMPLIFIED (uniform vs. category-specific).

#### 14. `duration_cap` (max 2.0x inherent)
- **Citation claims:** Klatt 1976 (incompressibility implies bounded expansion)
- **Citation correct:** This is an inference. Klatt 1976 establishes a floor (~0.42x) but does not explicitly state a ceiling. The 2.0x cap is an engineering estimate to prevent rule stacking.
- **Verdict:** ENGINEERING ESTIMATE (acknowledged).

### Inventory Base Durations

The inventory `dur` values serve as the baseline before rules apply. Selected comparisons:

| Phoneme | Qlatt dur (ms) | Klatt 1976 D_inh | Crystal & House 1982 (FAST) | Peterson & Lehiste 1960 (mean) |
|---------|---------------|------------------|---------------------------|-------------------------------|
| IY1 (stressed) | 150 | ~160 (implied) | — | 240 (5-speaker, /i/) |
| IH1 (stressed) | 100 | 160 | — | 180 (5-speaker, /I/) |
| AE1 (stressed) | 170 | 240 | — | 330 (5-speaker, /ae/) |
| AH0 (unstressed) | 50 | ~70 (implied) | — | — |
| S | 100 | ~152 (Klatt 1973) | 94.5 (vcl fric FAST) | — |
| N | 70 | ~92 (Klatt 1973) | 70.6 (nasal FAST) | — |
| P_CL | 50 | ~100 (Klatt 1973) | 49.4 (stop hold FAST) | — |

Observations:
- Qlatt's vowel inherent durations are shorter than Klatt 1976 and Peterson & Lehiste 1960. This is reasonable since those sources measure citation-form or controlled-sentence speech, while Qlatt aims for connected speech.
- Qlatt's consonant durations align well with Crystal & House 1982 FAST-group data.
- Qlatt's stop closure durations (P_CL=50, T_CL=40, K_CL=60) match Crystal & House 1988 hold durations (~50-55 ms) reasonably well.

---

## Key Findings and Recommendations

### Architectural Issues

1. **No incompressibility floor.** Klatt 1976's key insight is that multiple shortening rules should not compress below D_min (~0.42-0.45 * D_inherent). Qlatt stacks multiplicative rules without this floor, meaning a word-medial unstressed consonant gets 0.7 * 0.85 * 0.8 = 0.476x its inherent duration, which can produce durations below any physiological minimum. **Priority: HIGH.**

2. **Pre-boundary lengthening scope is too broad.** Wightman 1992 clearly shows lengthening is confined to the rhyme (nucleus + coda) of the immediately pre-boundary syllable. Qlatt's rule applies to all segments within the word that precede a SIL. This incorrectly lengthens onset consonants (correlation with break index: -0.001 per Wightman). **Priority: HIGH.**

3. **No position conditioning on vowel voicing effect.** The voiced-fricative lengthening of 1.6x applies everywhere, but Klatt 1976 and van Santen 1994 show this effect is large phrase-finally and negligible (~10-20 ms, below JND) phrase-medially. **Priority: MEDIUM.**

4. **No syllable-level timing layer.** Campbell & Isard 1991 and Hertz 1992 both argue that segment durations should be accommodated within a syllable frame. Qlatt operates purely at the segment level. This is an architectural limitation, not a bug. **Priority: LOW (future enhancement).**

5. **Uniform phrase-final lengthening.** Edwards & Beckman 1988 demonstrate phrase-final lengthening is concentrated in the closing phase of the vowel and coda, not uniformly distributed. Qlatt applies a uniform multiplier. **Priority: LOW (refinement).**

### Rule Value Issues

6. **Unstressed vowel multiplier too gentle.** Qlatt uses 0.8x. Klatt 1976 reports K=0.4-0.55 applied with incompressibility (resulting in ~35-60% shortening of compressible portion, or roughly 0.55-0.7x total duration). The 0.8x value underestimates the contrast between stressed and unstressed vowels. **Priority: MEDIUM.**

7. **Dental fricative minimum may be too low.** Jongman 1989 shows [th] and [dh] are poorly identified even at full duration. The 60 ms minimum may be insufficient; 80-100 ms would better serve intelligibility. **Priority: LOW.**

### Missing Rules

8. **No cluster shortening rules.** Klatt 1973 provides five specific rules for consonant duration in onset clusters. Qlatt has no cluster shortening rule. Consonants in /sp/, /st/, /sk/, /str/ clusters will be too long. **Priority: MEDIUM.**

9. **No polysyllabic shortening / distributed lengthening.** Klatt 1976 Rule 4 shortens vowels in polysyllabic words (K=0.78). White 2014 reinterprets this as distributed lengthening. Either way, Qlatt does not model it. **Priority: MEDIUM.**

10. **No word-final lengthening distinct from phrase-final.** Beckman & Edwards 1990 demonstrate word-final lengthening (~10-20%) is a separate, smaller effect from phrase-final lengthening (~30-50%). Qlatt has phrase-final lengthening but no word-final lengthening rule. **Priority: LOW.**

### What Qlatt Gets Right

- **Break-index-scaled boundary lengthening** with four levels (bi1-bi4): matches Wightman 1992's four significant levels.
- **Sonorant vs. obstruent differential lengthening** at boundaries: correctly models Crystal & House 1988 finding.
- **Fricative minimum durations** from Jongman 1989: correctly implements perceptual thresholds.
- **Stop unreleasing** before other stops: correctly implements Crystal & House 1988 data.
- **Word-initial consonant lengthening**: correctly cites and implements White 2014.
- **Accent x stress interaction** (separate nuclear vs prenuclear multipliers): correctly follows van Santen 1994 finding.
- **Speech rate as global multiplier**: reasonable first approximation per Crystal & House 1982.

---

## Summary Verdict

Qlatt's duration system is a well-cited Klatt-1976-style multiplicative model with several modern prosodic extensions (break-index boundary lengthening, accent interaction, fricative minimums). The citations are generally correct. The two highest-priority issues are:

1. **Missing incompressibility floor** (Klatt 1976 Eq. 1) allowing rules to stack below physiological minimum
2. **Over-broad pre-boundary lengthening scope** (should be rhyme-only per Wightman 1992)

The system correctly implements the major effects (stress, boundary, postvocalic context) but does not yet capture the interaction patterns (accent x stress, voicing x position) that van Santen 1994 demonstrates are perceptually important. Upgrading to sums-of-products would require training data not currently available.

## Missing Paper

**Byrd & Saltzman 2003 (ElasticPhraseBoundaryLengthening)** is not in the paper collection. This paper proposes the p-gesture framework for modeling boundary-adjacent lengthening dynamics and is referenced in White 2014 as a new lead. It would be relevant to understanding how phrase-final lengthening should be implemented dynamically rather than as a static multiplier.
