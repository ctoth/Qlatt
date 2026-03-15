# Wightman, Shattuck-Hufnagel, Ostendorf & Price 1992 — Implementation Notes

## Reference
Wightman, C. W., Shattuck-Hufnagel, S., Ostendorf, M., & Price, P. J. (1992). Segmental durations in the vicinity of prosodic phrase boundaries. *Journal of the Acoustical Society of America*, 91(3), 1707–1717. DOI: 10.1121/1.402450

## Core Finding
Pre-boundary lengthening is **restricted to the rhyme of the syllable immediately preceding the boundary**. It does not extend over a larger region. Using a normalized duration measure and compensating for speaking rate, at least **four distinct levels of prosodic boundaries** can be distinguished by their lengthening patterns.

## Prosodic Hierarchy Used (7 levels, break indices 0–6)

| Break Index | Description | Example |
|---|---|---|
| 0 | Clitic boundary (no orthographic word boundary) | within cliticized groups |
| 1 | Normal word boundary | between content words |
| 2 | Boundary with clear phrasal disjuncture but no tonal marks | groupings within larger phrases |
| 3 | Intermediate phrase boundary (ip) | minor prosodic phrase |
| 4 | Intonational phrase boundary (IP) | major prosodic phrase |
| 5 | Sentence boundary / utterance boundary | end of sentence |
| 6 | Paragraph boundary | paragraph-final |

Note: Break indices 0 and 1 are defined only in cases where the vowel in the word-final syllable is stressed.

## Normalized Duration Measure

### Definition
For each segment, the **normalized duration** d(t) is:

```
d(t) = (t - mu_p) / sigma_p
```

Where:
- t = observed duration of the segment
- mu_p = mean duration for that phone class (across all occurrences by that speaker)
- sigma_p = standard deviation for that phone class (across all occurrences by that speaker)

**Interpretation**: Positive values = longer than average; negative = shorter than average. This is a z-score normalization per phone identity per speaker.

### Key property
The distribution of phone durations follows a **gamma distribution**, not normal. However, a gamma distribution can be **linearly related** to a normal distribution:
```
mu = a * sigma + b
```
where a and b are constants. This means scaling both mu and sigma by the same factor preserves the normalized measure.

## Speaking Rate Compensation

### Observation
Phone durations scale with speaking rate as a simple factor:
```
mu_r = alpha * mu_s    (mean scales linearly)
sigma_r = alpha * sigma_s    (std dev scales linearly)
```
where alpha is a rate-dependent constant. This means the normalized duration d(t) is **invariant to speaking rate** — no separate rate compensation needed if per-speaker statistics are used.

### Rate estimation (when pooling speakers)
When computing from a corpus with multiple speakers, they model speaking rate variation by fitting a gamma distribution parameterized by (alpha, tau):
```
p(d_i | alpha, tau) = Gamma with mean alpha * mu_p, variance alpha^2 * tau
```
The ML estimate (from Wightman 1991) is:
```
alpha = (mu_p / mu_i)^2 * (d_i / tau_p)   [approximate]
```
In practice, they compute statistics separately for each speaker.

## Scope of Lengthening — Key Result

### Where lengthening occurs
The pre-boundary lengthening is concentrated in:
1. **Final syllable coda consonant(s)** — strong correlation with break index
2. **Final syllable vowel (nucleus)** — strong correlation with break index
3. **Last vowel before boundary** — correlation 0.55 with break index
4. **Foot-initial stressed vowel** — very weak/no correlation

### Where lengthening does NOT occur
- Onset of the final syllable: correlation with break index was **-0.001** (essentially zero)
- Segments before the final syllable rhyme: no significant lengthening
- Segments AFTER the boundary: no significant lengthening (correlation ~ 0)

### Correlation with break index (Table I in paper)
- **Foot duration vs. break index**: r = 0.55
- **Perceived boundary size vs. break index**: strong positive
- The lengthening is **significantly correlated** with the perceived size of the boundary

### Four-part decomposition of the foot
Segments from foot start to boundary, divided into:
1. (a) Coda consonants of any word (break index 1)
2. (b) Final syllable vowel/nucleus
3. (c) Segments between foot-initial vowel and last vowel before boundary
4. (d) Foot-initial stressed vowel

Correlation with break index:
- Parts (c) and (d): essentially zero (defined only when vowel in word-final syllable is stressed)
- Parts (a) and (b): strong positive correlation — **lengthening is in the rhyme only**

## Distinguishing Boundary Levels by Lengthening

### Normalized duration of word-final vowel by break index
From Figure 4 (approximate mean normalized durations):

| Break Index | Mean Normalized Duration |
|---|---|
| 0 | ~ -0.2 |
| 1 | ~ 0.0 |
| 2 | ~ 0.3 |
| 3 | ~ 0.7 |
| 4 | ~ 1.3 |
| 5 | ~ 1.5 |
| 6 | ~ 1.5 |

### Statistical distinctions
Using Duncan's test (F_{1,150}, p < 0.01):
- Break indices **0 vs 1**: **NOT** significantly different
- Break indices **1 vs 2**: statistically significant
- Break indices **2 vs 3**: statistically significant
- Break indices **3 vs 4**: statistically significant
- Break indices **4, 5, 6**: **NOT** significantly different from each other

**Result: Four distinct lengthening levels**: {0,1}, {2}, {3}, {4,5,6}

## Multilevel Lengthening Summary

The preboundary lengthening appears to be confined to the **rhyme of the final syllable**. No significant lengthening in:
- Onset consonants of the final syllable
- Stressed vowels earlier in the foot
- Post-boundary segments

The amount of lengthening at levels 4 and 5 is similar, but the **presence or absence of stressed vowels** in the preceding word may be a distinguishing factor (noted for future study).

## Pause vs. Lengthening

- Boundaries with **pauses**: mean normalized duration of final vowel = **1.53**
- Boundaries **without pauses**: mean normalized duration of final vowel = **0.86**
- Break indices 4 and 5 frequently co-occur with pauses
- 23% of boundaries marked 4 contained unfilled pause; 67% of those marked 5 contained unfilled pause
- Mean pause durations: 192 ms (break 4), 246 ms (break 5)

This contradicts the suggestion by Lehiste (1979) and Scott (1982) that lengthening and pausing counterbalance each other.

## Corpus Details
- **Boston University Radio News Corpus**
- 35 speakers (male and female), professional FM radio news announcers
- Each read 7 phonetically balanced sentences
- Total: 2140 words, 7560 segments
- Hand-labeled with ToBI-style break indices by 3 independent labelers
- Correlation among labelers: 0.93

## Implementation Relevance for Klatt Synthesizer

### Duration rules
1. Apply **pre-boundary lengthening** to the **rhyme** (nucleus + coda) of the syllable immediately before a prosodic boundary
2. The lengthening factor should scale with boundary strength (4 distinct levels)
3. Do NOT lengthen onset consonants of the pre-boundary syllable
4. Do NOT lengthen segments after the boundary

### Suggested lengthening multipliers (derived from normalized duration data)
For a segment with baseline duration mu_p:
- **No boundary (break 0-1)**: duration ~ mu_p (no change)
- **Weak phrase boundary (break 2)**: duration ~ mu_p + 0.3 * sigma_p
- **Intermediate phrase (break 3)**: duration ~ mu_p + 0.7 * sigma_p
- **Intonational phrase (break 4-6)**: duration ~ mu_p + 1.3 * sigma_p

### Pause insertion
- Insert pause at break indices 4+ (optional at 3)
- Pause duration: ~190–250 ms at major boundaries
- Lengthening and pause are **additive**, not compensatory

### What to apply lengthening to
- Vowel nucleus of final syllable: YES (strong effect)
- Coda consonants of final syllable: YES (strong effect)
- Onset of final syllable: NO
- Earlier syllables in the foot: NO
- Post-boundary segments: NO

## Collection Cross-References

### Already in Collection

- `Crystal_1982_SegmentalDurationsConnectedSpeech` — Crystal & House 1982 provides baseline duration statistics and gamma distribution model used in this paper
- `Crystal_House_1988_StopConsonantDuration` — Crystal & House 1988 provides "current results" on connected-speech durations
- `Klatt_1976_SegmentalDuration` — Klatt 1976 foundational duration rules, predecessor to prosodic lengthening work
- `Pierrehumbert_1980_EnglishIntonation` — Theoretical framework for prosodic hierarchy used
- `Price_1991_ProsodySyntacticDisambiguation` — Companion paper using same corpus; prosody in syntactic disambiguation
- `Allen_1987_MITalk_TTS` — Allen, Hunnicutt & Klatt 1987 MITalk system cited for TTS context
- `Campbell_Isard_1991_SegmentDurationsSyllable` — Campbell 1991 syllable-based model cited

### Cited By (in Collection)

- `White_2014_ProsodicTimingFunction` — Cites Wightman et al. 1992 for prosodic boundary lengthening data
- `Jun_2005_ProsodicTypology` — References Wightman et al. for break index validation
- `Silverman_1992_ToBILabelingProsody` — Cites for ToBI break index system development
- `Beckman_2005_ToBISystemEvolution` — References for empirical validation of break indices
- `Breen_InPress_ToBIRaPReliability` — Cites for ToBI reliability context
- `Ladd_2021_TroubleWithToBI` — References for ToBI labeling conventions
- `Taylor_2000_TiltModelIntonation` — Cites for prosodic boundary data
- `Roach_1994_ProsodicTranscriptionConversion` — References for prosodic transcription
- `Larrouy-Maestri_2024_EmotionalProsody` — Cites for prosodic phrasing
- `Pitrelli_1994_ToBILabellingReliability` — Companion study on ToBI reliability

### Now in Collection
- **Beckman & Edwards (1990)** — [[Beckman_1990_LengtheningsShorteningsProsodic]] — Experimentally separates phrase-final lengthening from stress-timed shortening, establishing that these are independent prosodic effects operating at different constituency levels.

### New Leads (Not Yet in Collection)

- Nespor, M., & Vogel, I. (1986). *Prosodic Phonology*. Foris. — Prosodic hierarchy theory
- Selkirk, E. (1984). *Phonology and Syntax*. MIT. — Prosodic categories framework

### Conceptual Links (not citation-based)

- `Crystal_1982_SegmentalDurationsConnectedSpeech` — Both measure segmental durations in connected speech; Crystal & House provide baseline phone-level statistics, Wightman et al. show how these durations are modulated by prosodic boundary strength
- `Hertz_1992_NucleusBasedTiming` — Both address how suprasegmental structure conditions duration; Wightman focuses on prosodic boundaries, Hertz on syllabic nucleus organization
- `Price_1991_ProsodySyntacticDisambiguation` — Companion study from same research group and corpus; Price establishes prosody-syntax mapping, Wightman provides the durational details
