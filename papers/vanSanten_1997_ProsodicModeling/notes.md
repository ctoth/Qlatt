# Prosodic Modeling in Text-to-Speech Synthesis

**Authors:** Jan P. H. van Santen
**Year:** 1997
**Venue:** EUROSPEECH '97, 5th European Conference on Speech Communication and Technology, Rhodes, Greece
**DOI:** 10.21437/Eurospeech.1997-3
**Affiliation:** Lucent Technologies - Bell Labs

## One-Sentence Summary
A comprehensive analysis of obstacles to improving TTS prosody: synthesis component limits, combinatorial/statistical constraints requiring content-specific models, and neglected research issues in timing and intonation.

## Problem Addressed
Why does TTS speech sound unnatural despite good intelligibility? Listeners detect synthetic speech within 500ms. The paper identifies three broad obstacles to prosodic quality improvement.

## Key Contributions
1. Analysis of how synthesis components (concatenative vs rule-based) limit prosodic quality via the "concatenative assumption"
2. Argument for "content-specific" models over general statistical methods (CART) for prosodic modeling
3. Identification of under-researched timing and intonation issues critical for TTS

## Methodology

### TTS Architecture
Standard TTS: NLP components → Acoustic-prosodic components → Synthesis

- **NLP**: Outputs symbolic entities (phoneme sequences, prosodic markers)
- **Acoustic-prosodic**: Computes timing and pitch contour (the "prosodic model")
- **Synthesis**: Generates digital speech (concatenative or rule-based)

## Key Equations

### Multiplicative Duration Model (Eq. 1)
$$
\text{Duration}(\mathbf{d}) = \prod_i S_i(d_i)
$$

Where:
- $\mathbf{d}$ = descriptor vector (e.g., `</ɛ/, unstressed, word-initial syllable, ...>`)
- $d_i$ = i-th element of descriptor vector
- $S_i(d_i)$ = numerical value mapped from factor level

**Example:** $S_2(\text{unstressed}) = 0.75$ means unstressed syllables get 75% duration multiplier.

### Sums-of-Products Duration Model (Eq. 2)
$$
\text{DUR}(\mathbf{d}) = \sum_{i \in K} \prod_{j \in I_i} S_{i,j}(d_j)
$$

Where:
- $K$ = set of indices for product terms
- $I_i$ = set of factor indices in i-th product term

### Klatt Duration Model (Eq. 3)
$$
\text{DUR}(v, c, p) = S_{1,1}(v) \cdot S_{1,2}(c) \cdot S_{1,3}(p) + S_{2,1}(v)
$$

Where:
- $v$ = vowel identity
- $c$ = postvocalic consonant class (voiced/voiceless)
- $p$ = phrasal position (medial/final)
- $S_{2,1}(v)$ = minimum duration of vowel $v$
- $S_{1,1}(v)$ = net duration (inherent - minimum)
- $S_{1,2}(c) = K_c$ = postvocalic consonant constant
- $S_{1,3}(p) = K_p$ = phrasal position constant

**Structure:** Two product terms: $I_1 = \{1,2,3\}$, $I_2 = \{1\}$; $K = \{1,2\}$

## Parameters

| Name | Symbol | Units | Description | Notes |
|------|--------|-------|-------------|-------|
| Descriptor vector | **d** | - | Feature vector for segment | Contains phoneme identity, stress, position, etc. |
| Factor level value | $S_i(d_i)$ | ratio | Multiplier for factor level | E.g., 0.75 for unstressed |
| Minimum duration | $S_{2,1}(v)$ | ms | Incompressible vowel duration | Per-vowel constant |
| Net duration | $S_{1,1}(v)$ | ms | Compressible portion | Inherent - minimum |
| Coverage index | - | probability | P(all units in sentence covered by training) | Critical metric |

### Key Findings from van Santen's Corpus Studies

| Unit Class | Coverage Issue |
|------------|----------------|
| Diphones | ~2,000 in English - easily covered |
| Triphones | ~70,000 distinct - difficult to cover |
| Vocabulary | Low-frequency types add to near-certainty of gaps |
| Prosodic descriptors | Very large space - low coverage indices |

## Implementation Details

### Duration Model Selection Criteria
1. **Multiplicative model**: Few parameters (~sum of factor levels), requires low coverage
2. **CART**: General-purpose but poor generalization to "very new" data
3. **Sums-of-products**: Best generalization - reaches asymptote with few hundred data points

### Directional Invariance Property
**Critical insight:** Sums-of-products models with positive parameters enforce *directional invariance*:
- Holding all else constant, factor effects always have same direction
- Example: /iː/ always longer than /ɛ/ regardless of context
- Word stress always lengthens
- Postvocalic voicing always lengthens preceding vowel

**CART lacks this property** - explains worse generalization.

### Intra-word Position Encoding
**Wrong encoding:** Syllable number + word length
- (1,3), (2,3), (3,3) for 3-syllable word
- NOT directionally invariant: 2nd syllable longer in 2-syl words (final), shorter in 3-syl words

**Correct encoding:** Word-initiality + word-finality
- (0,1), (1,1), (1,0) for 3-syllable word
- Directionally invariant: finality lengthens, initiality lengthens

## Concatenative Synthesis Analysis

### Three System Types (Figure 2)

| System | Units | Alterations | Prosodic Modules |
|--------|-------|-------------|------------------|
| Basic Diphone | ~1,000 | Highly intrusive F0/timing | Required |
| Sophisticated N-phone | 2,000-10,000 | Intrusive | Required |
| Corpus-based | >>10,000 | None | None (symbolic only) |
| Rule-based | 0 | All spectral | Required |

### The Concatenative Assumption
> "The range of contexts in which a given acoustic unit can occur in the target domain only alters the acoustic unit's temporal structure, pitch, and amplitude."

**This assumption is likely wrong** because:
1. Long-range coarticulation has spectral effects (anticipatory lip rounding affects schwa 1-2 syllables back)
2. Prosodic factors affect spectral tilt (stress) and glottal waveform (boundaries)
3. ~150 Hz F2 difference between /ɪ/ in "six" vs "million" due to following consonant

### Corpus-based Synthesis Critique
- 10-hour corpus = 36,000 100ms phones = 648 million potential units
- Still "infinitesimal" compared to language's combinatorial possibilities
- Coverage analyses suggest prosodic constraints cannot be satisfied for unrestricted domains

## Figures of Interest

- **Figure 1 (page 4):** F1×F2 scatter plot showing /ɪ/ formants at midpoint in "six" (open circles) vs "million" (closed circles). Dramatic F2 difference (~250 Hz) demonstrates coarticulation extends beyond diphone boundaries.

- **Figure 2 (page 5):** Rules × Units space diagram showing where different synthesis approaches fall. X-axis: speech units (0 to >>10,000). Y-axis: synthesis rules (none to spectral coarticulation).

## Open Research Issues

### 6.1 Concatenation
- Spectral discrepancy metrics ignore perception entirely
- Cepstral distance and formant-based measures lack perceptual validation
- Need psychophysical studies of auditory processing

### 6.2 Timing

**Sub-segmental timing:**
- Time-warping study: "melt" vs "meld" travel same formant path, different timing
- Non-uniform stretching: latter half of /ɛ/ and /l/ stretched more than first half and /m/
- Implication: segmental duration control is inadequate; need time-warp approach

**Supra-segmental timing:**
- Isochrony/syllable-timing hypotheses lack evidence as *time intervals*
- Syllable duration predictable from constituent segment intrinsic durations
- Example: "sitting" 1st syllable 65ms longer than "knitting" - matches /s/-/n/ difference (61ms)
- No stress-foot length effects on segmental duration after controlling word boundaries

### 6.3 Intonation

**Pitch accent alignment:**
- 100ms peak shifts alter intentional meaning (Kohler 1990)
- Same meaning, different syllables → 150ms peak shifts
- "Now I know Sheila" vs "Now I know Mitch" - peaks differ by 150ms
- Need alignment model describing how curves vary with syllable structure

**Bell Labs model:** Non-linearly time-warped accent curve templates in superpositional framework

## Limitations
- Paper is position/review paper, not presenting new empirical data
- Some claims are speculative (author's acknowledgment)
- Focused on English; cross-linguistic issues mentioned but not addressed
- NLP components (symbolic prosody) explicitly excluded from scope

## Relevance to Qlatt Project

### Direct Applications
1. **Duration modeling**: Implement sums-of-products model instead of simple multiplicative
   - Current `tts-frontend-rules.js` likely uses multiplicative model
   - Add minimum duration term per Klatt model (Eq. 3)

2. **Directional invariance check**: Verify duration rules maintain consistent factor directions

3. **Position encoding**: Use word-initiality/finality rather than syllable position numbers

### Architectural Insights
- Rule-based synthesis (Klatt) occupies unique position: zero stored units, maximum rule complexity
- Prosodic modeling is *required* for rule-based synthesis (cannot rely on corpus coverage)
- Spectral coarticulation rules needed for highest quality

### What NOT to Implement
- CART for duration prediction (poor generalization demonstrated)
- Pure corpus-based approaches (coverage issues)

## Open Questions
- [ ] How to combine per-factor time warps for multiple simultaneous factors?
- [ ] What perceptual metrics should guide concatenation quality?
- [ ] How to model pitch accent alignment with varying syllable structures?
- [ ] Does Qlatt's current duration model satisfy directional invariance?

## Related Work Worth Reading

### Duration Modeling
- Klatt 1973, 1975 - Vowel duration and voicing/boundary interactions
- van Santen 1992 - Contextual effects on vowel duration (Speech Communication 11:513-546)
- van Santen 1993 - Sums-of-products models (J Math Psychology 37:327-371) **[KEY]**
- Maghbouleh 1996 - CART vs sums-of-products comparison **[KEY]**

### Intonation
- Fujisaki 1983 - Fundamental frequency dynamics
- Möbius et al. 1993 - Fujisaki model for German F0
- Kohler 1990 - Macro/micro F0 and peak timing perception **[KEY]**
- van Santen & Möbius 1997 - Pitch accent curves

### Synthesis
- Allen, Hunnicutt & Klatt 1987 - MITalk system (Cambridge UP)
- Riley 1992 - Tree-based modeling for synthesis

### Coverage Analysis
- van Santen 1997 - "Combinatorial issues in TTS" (Eurospeech) **[KEY companion paper]**

---

## Collection Cross-References

### Already in Collection
- **Allen_1987_MITalk_TTS** — cited as the classic MITalk system description motivating design decisions (Ref 1)
- **Klatt_1987_TTS_Review** — foundational TTS review; directly relevant to Klatt-based synthesis (Ref 6)
- **vanSanten_1993_SegmentalDuration** — own prior work; the sums-of-products mathematical framework central to this paper's duration modeling arguments (Ref 16)
- **vanSanten_1994_SegmentalDurationTTS** — full TTS implementation of the duration models discussed here; extends the 1993 framework to speaker-independent prediction
- **Klatt_1976_SegmentalDuration** — the multiplicative duration rules (Eq. 3) that this paper critiques and shows sums-of-products models improve upon
- **Klatt_1980_CascadeParallelFormantSynthesizer** — rule-based synthesis system placed in Figure 2's rules-vs-units taxonomy

### New Leads (Not Yet in Collection)
- **Fujisaki 1983 (Ref 3)**: Seminal work on F0 contour modeling via the Fujisaki model; essential for understanding intonation generation discussed throughout this paper.
- **van Santen 1992 (Ref 15)**: "Contextual effects on vowel duration" (Speech Communication 11:513-546) — detailed corpus study of vowel duration factors; distinct from the 1993 mathematical framework paper.
- **Macchi 1989 (Ref 8)**: Dynamic time warping for duration rules; directly addresses the non-uniform temporal modification problem van Santen raises as an open issue.
- **Kohler 1990 (Ref 7)**: Macro and micro F0 in intonation synthesis; demonstrates 100ms peak shifts alter intentional meaning.
- **Maghbouleh 1996 (Ref 9)**: Empirical comparison of CART vs sums-of-products for vowel durations; key evidence for this paper's anti-CART argument.

### Cited By (in Collection)
- **vanSanten_1994_SegmentalDurationTTS** — lists this as a later paper discussing obstacles to prosodic quality including duration
- **Campbell_Isard_1991_SegmentDurationsSyllable** — cross-referenced as related work addressing same prosodic modeling problems (not directly cited; 1991 predates 1997)

### Conceptual Links (not citation-based)

**Duration modeling — competing/complementary approaches:**
- **Campbell_Isard_1991_SegmentDurationsSyllable** — proposes syllable-level timing frame as alternative to pure segment-level multiplication; both papers reject naive multiplicative rules but from different angles (van Santen: interaction terms via sums-of-products; Campbell & Isard: hierarchical syllable→segment decomposition with z-score elasticity)
- **White_2014_ProsodicTimingFunction** — quotes van Santen 1997 ("for temporal units, the smaller the better"); reinterprets polysyllabic shortening as attenuated lengthening, complementing van Santen's directional invariance argument by showing apparent shortening effects are actually the absence of lengthening
- **Anumanchipalli_KLATTSTAT** — uses CART for all Klatt parameters including duration; embodies the approach van Santen argues against, demonstrating the lopsided sparsity problem in practice

**Sub-segmental timing — the non-uniform stretching problem:**
- **Hertz_1991_StreamsPhonesTransitions** — directly instantiates the sub-segmental non-uniform stretching van Santen identifies as an open problem: CV transitions hold at ~65ms while steady-state vowel interiors stretch 1.5x before voiced obstruents; the multi-stream delta model is the implementation van Santen gestures toward
- **Hertz_1987_DeltaNonLinearPhonology** — precursor establishing formant transitions as durational units (40ms sonorant-obstruent, 90ms sonorant-sonorant), providing the temporal granularity van Santen argues is needed below the segment level
- **Crystal_House_1988_StopConsonantDuration** — empirical data showing stop hold vs. release durations behave independently in connected speech (only 59% of stops are "complete"), supporting van Santen's argument that sub-segmental timing cannot be captured by segment-level models
- **vanSon_1997_ConsonantReduction** — documents that F2 slope (coarticulation strength) decreases in spontaneous speech even as duration decreases proportionally, showing sub-segmental acoustic changes are not uniform scaling

**The concatenative assumption — spectral coarticulation beyond diphone boundaries:**
- **Ohman_1966_CoarticulationVCV** — provides the empirical evidence underlying van Santen's refutation: F2 varies ~280 Hz in stop consonants depending on both preceding and following vowels, meaning diphone boundaries cannot capture the full spectral context
- **Recasens_1997_LingualCoarticulationDAC** — quantifies how far coarticulation extends across segment boundaries via the DAC model; dorsals and dark /l/ produce coarticulation spanning multiple segments, exactly the effect the concatenative assumption ignores
- **Browman_Goldstein_1992_ArticulatoryPhonologyOverview** — provides theoretical grounding: coarticulation as gestural overlap with intrinsic duration means spectral effects propagate across arbitrary segment boundaries, not just adjacent ones; stiffness parameter directly links to why transitions don't scale with segment duration

**Intonation — pitch accent alignment and F0 modeling:**
- **Pierrehumbert_1980_EnglishIntonation** — provides the phonological framework (H/L tones, downstep, boundary tones) within which van Santen's alignment problem is defined; van Santen argues that the phonetic realization of these abstract targets needs explicit alignment models tied to syllable structure
- **Ladd_2008_IntonationalPhonology** — develops the "segmental anchoring hypothesis" for tonal alignment, providing theoretical machinery for the pitch-peak-to-syllable alignment problem van Santen identifies (100–150ms peak shifts altering meaning)
- **Taylor_2000_TiltModelIntonation** — offers continuous-parameter accent curve description (amplitude, duration, tilt) as alternative to van Santen's superpositional time-warped templates
- **OShaughnessy_1976_F0_Prosody** — the two-level F0 rule system that represents the baseline approach van Santen argues needs improvement with explicit alignment models
