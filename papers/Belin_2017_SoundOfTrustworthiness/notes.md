# The Sound of Trustworthiness: Acoustic-based Modulation of Perceived Voice Personality

**Authors:** Pascal Belin, Bibi Boehme, Phil McAleer
**Year:** 2017 (Correction published January 2019)
**Venue:** PLoS ONE 12(10): e0185651
**DOI:** https://doi.org/10.1371/journal.pone.0185651
**Correction DOI:** https://doi.org/10.1371/journal.pone.0211282

> **Note:** A correction was published January 17, 2019 stating that an incorrect version of S1 Data (raw participant ratings) was originally published. The article was republished January 10, 2019 with the corrected data file. The findings and conclusions are unchanged.

## One-Sentence Summary
Demonstrates that perceived trustworthiness in voice can be parametrically controlled through acoustic manipulation, with f0 contour (intonation) being the key parameter—high trustworthiness requires high starting f0, marked mid-utterance drop, and strong final rise.

## Problem Addressed
Previous studies showed correlations between voice acoustics and personality perception but couldn't specify exactly *how* to manipulate voice parameters to achieve desired personality impressions. The question: "How exactly should one say 'hello' to be perceived as trustworthy?"

## Key Contributions
- Demonstrated r=0.99 correlation between acoustic continuum position and trustworthiness ratings
- Identified specific f0 contour pattern for trustworthiness perception
- Showed caricaturing effect: exaggerating acoustic differences amplifies personality impressions
- Gender-independent effect (works for both male and female listeners)

## Methodology
1. Collected 32 male voices saying "hello" with trustworthiness ratings from prior study
2. Generated low/high trustworthiness prototypes by averaging bottom/top 25% rated voices using STRAIGHT analysis/resynthesis
3. Created 9-stimulus continuum via morphing (inter- and extrapolation)
4. 500 online participants rated stimuli on trustworthiness scale
5. Ratings z-scored within participant before analysis

## Key Equations

No formal equations, but the morphing weights for the 9-stimulus continuum:

| Stimulus | Low-Trust Weight | High-Trust Weight |
|----------|------------------|-------------------|
| S1 (low caricature) | 150% | -50% |
| S2 | 125% | -25% |
| S3 (low prototype) | 100% | 0% |
| S4 | 75% | 25% |
| S5 (average) | 50% | 50% |
| S6 | 25% | 75% |
| S7 (high prototype) | 0% | 100% |
| S8 | -25% | 125% |
| S9 (high caricature) | -50% | 150% |

## Parameters

| Name | Symbol | Units | Value/Range | Notes |
|------|--------|-------|-------------|-------|
| Fundamental frequency (start) | f0_start | Hz | ~95-165 | Low trust: ~95-105 Hz; High trust: ~150-165 Hz |
| Fundamental frequency (mid) | f0_mid | Hz | ~105-115 | Roughly similar across all stimuli |
| Fundamental frequency (end) | f0_end | Hz | ~100-125 | Low trust: flat/slight rise; High trust: strong rise |
| Utterance duration | - | ms | ~400-450 | "hello" duration |

## Implementation Details

### F0 Contour for Trustworthiness

**Low trustworthiness pattern:**
- Start with relatively low f0 (~95-105 Hz for male voices)
- Flat or slightly rising contour throughout
- Minimal pitch movement

**High trustworthiness pattern:**
- Start with HIGH f0 (~150-165 Hz for male voices)
- Marked DECREASE at mid-utterance (to ~105-115 Hz)
- Strong RISE at end (to ~120-125 Hz)

### STRAIGHT Voice Morphing Parameters
Voice decomposed into 5 manipulable parameters:
1. f0 (fundamental frequency)
2. Frequency (formant structure)
3. Time (temporal alignment)
4. Spectro-temporal density
5. Aperiodicity

Time-frequency landmarks for morphing: first 3 formant frequencies at onset/offset of phonation and formant transitions.

## Figures of Interest
- **Fig 1 (page 3):** Generation of voice trustworthiness continuum with spectrograms
- **Fig 2 (page 4):** Linear relationship between acoustic continuum position and trustworthiness ratings (r=0.99)
- **Fig 3 (page 5):** F0 contours for all 9 stimuli showing the distinctive intonation patterns

## Results Summary
- Low vs high prototype: z=-0.39 vs z=0.40 (t(499)=14.2, p=1.38e-38)
- Caricature effect: S9 rated higher than S7 (z=0.80 vs z=0.40, p=5.93e-13)
- Near-perfect linear relationship: r=0.99 (p=5.03e-8)
- Control continuum (random female voices) showed no such effect
- Effects identical for male and female listeners

## Limitations
- Only tested on single word "hello"
- Unclear generalization to other words or longer utterances
- 8-voice averages may be crude approximation of internal representations
- Male voices only for experimental condition (female for control)
- Did not isolate individual acoustic parameters (f0 vs formants vs timing)

## Relevance to Project

**Prosody generation:** The f0 contour pattern for trustworthiness could inform a "friendly/trustworthy" speaking style:
- Higher initial f0
- Mid-utterance f0 drop
- Rising terminal contour

**Voice quality parameters:** The finding that personality impressions map quasi-linearly to acoustic space suggests that expressive speech synthesis can achieve predictable perceptual effects through principled parameter manipulation.

**Limitations for Qlatt:** The study uses STRAIGHT (concatenative/analysis-synthesis) rather than formant synthesis. The specific parameter values may not directly transfer to Klatt parameters, but the f0 contour patterns are directly applicable.

## Open Questions
- [ ] What are the exact formant differences between low/high trustworthiness? (S1 Table not included in PDF)
- [ ] How does this interact with other personality dimensions (dominance)?
- [ ] Does the pattern hold for longer utterances or only greetings?
- [ ] What is the role of voice quality (breathiness, creakiness) vs just f0?

## Related Work Worth Reading
- McAleer et al. (2014) - Prior study with original trustworthiness ratings
- Scherer (1972, 1978) - Foundational work on voice and personality
- Kawahara & Matsui (2003) - STRAIGHT analysis/resynthesis method
- Todorov et al. (2015) - Face-based social attributions (parallel to voice findings)

---

## Collection Cross-References

### Already in Collection
- [[Feinberg_2008_FemininityAveragenessVoicePitch]] [ref 5] — cited for pitch–attractiveness relationship; now provides full linear model details and PSOLA manipulation parameters

### New Leads (Not Yet in Collection)
- **McAleer et al. (2014) [ref 4]** - The prior study that generated the original trustworthiness ratings for the 32 voices. Essential for understanding the full methodology and seeing the original "social voice space" dimensions.
- **Scherer (1972, 1978) [refs 2, 6]** - Foundational work on voice-personality relationships. Important for understanding the broader context of what acoustic parameters correlate with which personality dimensions.
- **Feinberg et al. (2005) [ref 11]** - Original F0+formant manipulation study; not yet in collection
- **Kawahara & Matsui (2003) [ref 16]** - The STRAIGHT analysis/resynthesis method used for voice morphing. Important if implementing similar voice manipulation techniques.
- **Shue et al. (2011) [ref 21]** - VoiceSauce voice analysis software. Useful tool reference for extracting acoustic parameters from voice recordings.

### Now in Collection (previously listed as leads)
- [[Feinberg_2011_IntegratingF0FormantPreferences]] [ref 17] — Demonstrates F0 × formant frequency interaction in voice attractiveness: low pitch amplifies preference for large vocal tracts and vice versa (cue amplification model). Manipulation method: ±0.5 ERB pitch shift, ±15% formant shift via resampling. Directly relevant to understanding how pitch and formant cues combine in social voice perception.

### Conceptual Links (not citation-based)
- [[Beckers_2021_TTSGenderTrustworthiness]] — Belin establishes acoustic dimensions of trustworthiness in natural voices; Beckers extends the trustworthiness construct to TTS voices and finds male TTS voices rated more trustworthy for news content
