# The Acoustic Correlates of Valence Depend on Emotion Family

**Authors:** Michel Belyk and Steven Brown
**Year:** 2014
**Venue:** Journal of Voice (Article in Press)
**DOI/URL:** http://dx.doi.org/10.1016/j.jvoice.2013.12.007

## One-Sentence Summary
Provides empirically grounded "rules of expression" mapping emotion families (motivational, moral, aesthetic) to distinct pitch × loudness profiles, showing that a single valence→F0 rule is inadequate for expressive synthesis.

## Problem Addressed
Prior literature on vocal expression of emotion found inconsistent acoustic correlates of valence (positive vs negative). Some studies found positive emotions higher in pitch, others found the opposite, and many found no effect. This paper argues the inconsistency arises because valence interacts with *emotion family* — different categories of emotion encode valence through different pitch/amplitude patterns.

## Key Contributions
- Demonstrates that the acoustic valence-code is NOT universal but depends on emotion family (motivational, moral, aesthetic) as defined by the OCC (Ortony, Clore, Collins) model
- Proposes a 2×2 Pitch × Loudness framework yielding four "rules of expression" for vocal prosody
- Provides the first acoustic description of "numinous" emotions (awe and terror)
- Shows that collapsing across emotion families yields a weak valence effect because opposing family-specific effects partially cancel

## Methodology
- 30 English-speaking undergraduates (22 female)
- Viewed emotionally valenced scenarios (text + picture), then produced cued exclamation words (e.g., "Yay!", "Damn!", "Mmmm!", "Ewww!")
- Control condition: same words produced neutrally (to subtract segmental/phonemic pitch effects)
- Acoustic measures: mean F0 (in cents relative to habitual pitch) and mean amplitude (dB)
- Linear mixed models with affective intensity as covariate
- 12 emotions organized into 3 families × 2 valences

## Key Equations

No formal equations. The core analytical framework is statistical (linear mixed models via R/lme4). The key quantitative results are effect sizes.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Pitch (relative) | F0_rel | cents | 0 (habitual) | ~-100 to +500 | Measured relative to subject's habitual F0 from rainbow passage; 100 cents = 1 semitone |
| Amplitude | A | dB | — | ~35–50 | Mean amplitude of voiced segment |
| Affective intensity | I | 1–9 scale | — | 1–9 | Subject self-report, used as covariate |

### Acoustic profiles by emotion family (from Figures 2–3, approximate values)

| Family | Valence | Pitch (cents) | Amplitude (dB) |
|--------|---------|---------------|-----------------|
| Motivational | Positive (joy) | ~400 | ~48 |
| Motivational | Negative (distress) | ~200 | ~40 |
| Moral | Positive (gratitude) | ~350 | ~38 |
| Moral | Negative (anger) | ~100 | ~42 |
| Aesthetic | Positive (pleasure) | ~-50 | ~37 |
| Aesthetic | Negative (disgust) | ~100 | ~45 |
| Numinous | Positive (awe) | ~100 | ~38 |
| Numinous | Negative (terror) | ~100 | ~43 |

### Emotion–exclamation mapping (Table 2)

| Family | Valence | Emotion | Exclamation |
|--------|---------|---------|-------------|
| Motivational | + | Joy | Yay!, Cool! |
| Motivational | − | Distress | Damn!, No! |
| Motivational | + | Gloating | Ha! |
| Motivational | − | Resentment | Damn! |
| Moral | + | Appreciation | Good! |
| Moral | − | Reproach | Bad! |
| Moral | + | Gratitude | Thanks! |
| Moral | − | Anger | Jerk! |
| Aesthetic | + | Pleasure | Oooh!, Mmmm! |
| Aesthetic | − | Disgust | Ewww!, Yuck! |
| Aesthetic | + | Awe | Wow! |
| Aesthetic | − | Terror | Whoa! |

## Implementation Details

### The Four Expression Rules (Figure 4)

The core implementable framework is a 2×2 matrix of Pitch × Loudness:

| | High Pitch | Low Pitch |
|---|---|---|
| **Loud** | Cell 1: **"High-Loud"** — Motivational (positive: "Yay!") | Cell 4: **"Low-Loud"** — Coping Potential (positive: "Yes!") |
| **Soft** | Cell 2: **"High-Soft"** — Moral (positive: "Thanks!") | Cell 3: **"Low-Soft"** — Aesthetic (positive: "Mmmm!") |

For each cell, the rule describes the **positive** member of a valence-pair. The negative member has the opposite profile.

### Rule application logic for synthesis

Given an emotion tag on an utterance/exclamation:

1. **Motivational emotions** (joy, distress, gloating, resentment):
   - Positive → raise F0, raise amplitude
   - Negative → lower F0, lower amplitude
   - Effect sizes: pitch d=0.54, amplitude d=0.78

2. **Moral emotions** (appreciation, reproach, gratitude, anger):
   - Positive → raise F0, *lower* amplitude
   - Negative → lower F0, *raise* amplitude
   - Effect sizes: pitch d=0.99, amplitude d=0.19

3. **Aesthetic emotions** (pleasure, disgust):
   - Positive → *lower* F0, *lower* amplitude
   - Negative → *raise* F0, *raise* amplitude
   - Effect sizes: pitch d=0.64, amplitude d=0.65

4. **Coping potential** (hypothesized, not tested):
   - Positive (confidence) → lower F0, raise amplitude
   - Negative (nervousness) → raise F0, lower amplitude

5. **Numinous** (awe, terror) — did NOT follow any clean pattern:
   - No pitch difference
   - Awe lower amplitude than terror (d=0.44)

### Additional rules

- **Intensity rule** ("intense-high-loud"): Both pitch and amplitude increase with affective intensity, regardless of valence
- **High-loud coupling**: In general, pitch and amplitude are positively correlated (high→loud, low→soft)
- **Gustatory vs nongustatory pleasure**: No pitch difference, but nongustatory ("Oooh!") significantly louder than gustatory ("Mmmm!"), d=1.02

### Methodological notes for implementation

- Pitch measured in **semitones/cents** (log scale), not Hz — this is perceptually more accurate and normalizes for sex differences
- Segmental (phonemic) pitch effects subtracted via neutral control — important if implementing emotion on specific words
- Affective intensity used as covariate — the valence effects above are *after* controlling for intensity

## Figures of Interest
- **Fig 1 (page 3):** Sample trial structure showing scenario → picture → exclamation paradigm with waveform, pitch, and amplitude contours for each family
- **Fig 2 (page 6):** Bar charts of pitch (cents) and amplitude (dB) for motivational/moral/aesthetic families × valence — the key result figure
- **Fig 3 (page 6):** Aesthetic emotions broken into pleasure/disgust vs awe/terror — shows numinous emotions behave differently
- **Fig 4 (page 8):** The 2×2 Pitch × Loudness expression rules framework with schematic sonograms — the implementable framework

## Results Summary

### Main effects
- Valence → pitch: F(1,353)=13.5, p<.05 (positive = higher pitch, but weak)
- Valence → amplitude: F(1,353)=12.2, p<.05 (positive = louder, but weak)
- Family → pitch: F(2,353)=24.2, p<.05
- Family → amplitude: F(2,353)=10.6, p<.05
- **Valence × Family interaction → pitch: F(2,353)=14.2, p<.05**
- **Valence × Family interaction → amplitude: F(2,353)=12.4, p<.05**

The interaction is the key finding — it means you cannot interpret valence effects without knowing the emotion family.

### Family-specific contrasts (all p<.05)

| Family | Pitch contrast | d | Amplitude contrast | d |
|--------|---------------|---|-------------------|---|
| Motivational | Positive > Negative | 0.54 | Positive > Negative | 0.78 |
| Moral | Positive > Negative | 0.99 | Positive < Negative | 0.19 |
| Aesthetic | Positive < Negative | 0.38 | Positive < Negative | 0.32 |

## Limitations
- (1) The 2×2 scheme assumes opposing valences have opposing acoustics — not all emotion theories support this
- (2) Numinous emotions (awe/terror) did not fit any of the four rules
- (3) Emotion families are not homogeneous — subtypes may conflict (e.g., "Cute!" is high-pitch positive aesthetic, unlike "Mmmm!")
- (4) Fear (motivational negative) is predicted low-soft but actually high-loud — explainable by high intensity; anxiety fits the predicted pattern better
- (5) Untrained speakers (undergraduates), not actors — may be more variable
- Only exclamations studied, not continuous speech prosody
- 22/30 subjects female — sex effects not analyzed separately

## Testable Properties

- **Family × Valence interaction**: Collapsing pitch/amplitude across emotion families should yield weaker valence effects than within-family analyses
- **Motivational positive > negative**: For motivational emotions, positive valence should produce higher F0 and higher amplitude
- **Moral reversal**: For moral emotions, positive valence should produce higher F0 but *lower* amplitude than negative
- **Aesthetic reversal**: For aesthetic emotions, positive valence should produce *lower* F0 and *lower* amplitude than negative
- **Intensity monotonicity**: Regardless of valence or family, increasing affective intensity should increase both F0 and amplitude
- **Semitone normalization**: Pitch effects should be more consistent across speakers when measured in cents/semitones than in Hz
- **Numinous exception**: Awe and terror should NOT show significant pitch differences

## Relevance to Project

This paper is directly relevant for implementing **emotion-dependent prosody rules** in the Qlatt TTS frontend. Currently the prosody system handles F0 contours based on linguistic structure (stress, boundaries, declination). If/when emotional speech is added:

1. The four expression rules (high-loud, high-soft, low-soft, low-loud) could be encoded as prosody rule sets keyed to emotion tags
2. The rules would modify both F0 (pitch) and AV/amplitude parameters
3. The family-specific patterns mean a single "happy=high, sad=low" rule is wrong — the system would need emotion-family tags
4. The intensity dimension is separate from valence and should be a separate multiplier
5. Exclamation-specific patterns (Table 2) could inform interjection synthesis

## Open Questions
- [ ] How do these exclamation-based findings generalize to continuous speech prosody?
- [ ] What are the quantitative magnitudes in Hz/dB rather than relative measures?
- [ ] How does voice quality (breathy, creaky) interact with the pitch/amplitude rules?
- [ ] Is the "coping potential" cell (low-loud) empirically validated anywhere?
- [ ] How do these rules interact with linguistic prosody (stress, focus, boundaries)?

## Related Work Worth Reading
- Scherer 1986 — Component process model of vocal affect (reference [50]) — the foundational theory for emotion-specific vocal predictions
- Banse & Scherer 1996 — Acoustic profiles of 14 emotions in voice (reference [5]) — large-scale acoustic data
- Gobl & Chasaide 2003 — Voice quality in emotion communication (reference [17]) — already in our collection
- Juslin & Laukka 2003 — Communication of emotion in voice and music (reference [1]) — comprehensive review
- Belin et al 2008 — Montreal Affective Voices corpus (reference [8]) — validated nonverbal affect bursts
- Ohala 1984 — Ethological perspective on F0 in voice (reference [45]) — frequency code hypothesis

## Collection Cross-References

### Already in Collection
- [[Banse_1996_VocalEmotionAcousticProfiles]] — cited as ref [5]; provides detailed acoustic profiles for 14 emotions including the four positive emotions discussed in this paper
- [[Gobl_2003_VoiceQualityEmotion]] — cited as ref [17]; complements this paper's pitch/amplitude focus with voice quality (spectral tilt, breathiness) data for emotional expression
- [[Scherer_2001_VocalEmotionCrossCultural]] — related to refs [28, 50]; cross-cultural emotion recognition data that contextualizes these family-specific findings

### New Leads (Not Yet in Collection)
- Juslin & Laukka (2003) — "Communication of emotions in vocal expression and music performance" — comprehensive review of emotion coding in voice and music
- Ohala (1984) — "An ethological perspective on common cross-language utilization of F0 of voice" — the frequency code hypothesis underlying the motivational/moral expression rules
- Scherer (1986) — "Vocal affect expression: a review and a model for future research" — the component process model; foundational for emotion-specific vocal predictions
- Belin et al (2008) — "The Montreal Affective Voices" — validated nonverbal affect burst corpus; potential evaluation data

### Supersedes or Recontextualizes
- [[Banse_1996_VocalEmotionAcousticProfiles]] — Belyk & Brown 2014 recontextualizes the Banse & Scherer data by showing that emotion-family grouping explains why their 14-emotion acoustic profiles showed inconsistent valence effects (only elation showed high-loud among positive emotions, because the others belonged to different families)
