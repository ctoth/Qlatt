# The Sound of Im/Politeness

**Authors:** Jonathan A. Caballero, Nikos Vergis, Xiaoming Jiang, Marc D. Pell
**Year:** 2018
**Venue:** Speech Communication 102 (2018) 39-53
**DOI:** https://doi.org/10.1016/j.specom.2018.06.004

## One-Sentence Summary

This paper provides quantitative acoustic correlates (F0, duration, HNR, contour shape) that distinguish polite from rude speech in English requests, essential for implementing prosodic variation in TTS systems.

## Problem Addressed

Prior politeness research focused almost exclusively on linguistic strategies (word choice, indirectness) while neglecting how prosody and acoustic cues communicate politeness. This paper systematically defines acoustic cues that mark polite vs. impolite attitudes in English requests.

## Key Contributions

1. Identified consistent acoustic profile distinguishing polite from rude utterances across three linguistic structures (direct, please-type, indirect)
2. Showed that pragmatic imposition level independently affects prosodic encoding from utterance onset
3. Demonstrated both categorical (contour shape) and graded (degree of pitch movement) contrasts contribute to politeness perception
4. Provided constituent-level analysis showing local acoustic adjustments on semantic elements (linguistic hedge, imposition word)

## Methodology

- **Stimuli:** 38 request items x 3 structures (Direct, Please, Indirect) x 2 imposition levels x 2 prosodies (polite/rude) = 456 utterances per speaker
- **Speakers:** 4 native Canadian English speakers (2M, 2F)
- **Perceptual validation:** 48 listeners rated politeness on 5-point scale
- **Analysis:** Only utterances in top/bottom third of politeness ratings analyzed (n=1142)
- **Acoustic measures:** F0 (mean, range, contour/elevation index), duration, HNR

## Key Equations

### F0 Normalization

$$
f0_{norm} = \frac{f0_{recording} - f0_{mean(all)}}{f0_{mean(all)}}
$$

Where: speaker-normalized F0 expressed as proportional distance from mean.

### Elevation Index (Contour Shape)

$$
EI = \overline{Last5_{f0}} - \overline{First5_{f0}}
$$

Where:
- Positive EI = rising contour
- Negative EI = falling contour
- Magnitude indicates steepness

### Speech Rate

$$
SR = \frac{N_{syllables}}{Duration_{seconds}}
$$

## Parameters

| Parameter | Polite vs Rude | Units | Effect Size | Notes |
|-----------|----------------|-------|-------------|-------|
| Mean F0 | Polite > Rude | Hz (normalized) | ηp² = 0.25-0.38 | Consistent across all structures |
| F0 Range | Polite > Rude | Hz (normalized) | ηp² = 0.02-0.21 | Direct and Indirect only |
| Elevation Index | Polite > Rude (more rising) | - | ηp² = 0.09-0.60 | Strongest effect |
| Speech Rate | Polite > Rude (faster) | syl/sec | ηp² = 0.08-0.17 | Rude = slower |
| HNR | Polite > Rude (clearer) | dB | ηp² = 0.06-0.29 | Direct and Please only |

### Acoustic Values by Structure (Table 3 summary)

| Structure | Politeness | Mean F0 (norm) | F0 Range (norm) | Elevation Index | HNR (dB) | Speech Rate |
|-----------|------------|----------------|-----------------|-----------------|----------|-------------|
| Direct | Rude | -0.06 | 0.81 | -0.40 | 7.77 | 4.33 |
| Direct | Polite | 0.10 | 0.92 | 0.63 | 10.95 | 5.22 |
| Please | Rude | -0.11 | 0.83 | -0.43 | 8.94 | 3.70 |
| Please | Polite | 0.02 | 0.87 | -0.18 | 10.27 | 4.52 |
| Indirect | Rude | -0.06 | 0.69 | 0.05 | 10.56 | 4.60 |
| Indirect | Polite | 0.15 | 0.97 | 0.40 | 11.19 | 5.50 |

## Implementation Details

### Prosodic Profile of POLITE Speech
1. **Higher mean F0** - raise overall pitch register
2. **Wider F0 range** - more pitch variation (especially Direct/Indirect)
3. **Rising or less-falling contour** - positive Elevation Index
4. **Faster speech rate** - avoid slow deliberate delivery
5. **Clearer voice quality** - higher HNR (less harsh)

### Prosodic Profile of RUDE Speech
1. **Lower mean F0** - drop overall pitch
2. **Narrower F0 range** - compressed pitch variation
3. **Falling contour** - negative Elevation Index
4. **Slower speech rate** - deliberate pacing (floor-holding)
5. **Harsher voice quality** - lower HNR

### Constituent-Level Patterns

**Linguistic Hedge ("Please" / "Can you"):**
- Polite: higher F0, shorter duration
- Politeness marking begins at utterance onset

**Verb Phrase:**
- Direct: polite = more rising, shorter duration
- Please/Indirect: polite = more falling (after hedge raised pitch)

**Imposition Word (final noun):**
- ALL structures: polite = higher F0 + rising contour
- Terminal rise is key politeness marker

### High vs Low Imposition Effects
- High imposition requests encoded differently from onset
- Effects independent of politeness (no interaction)
- Speakers signal awareness of face-threat prosodically

## Figures of Interest

- **Fig 1 (p.46):** Box plots showing mean F0 and F0 range for polite/rude by structure
- **Fig 2 (p.48):** Pitch contours across constituents for all structures - shows trajectory differences
- **Fig 3 (p.49):** Proportional duration by constituent - shows temporal redistribution

## Results Summary

| Finding | Direct | Please | Indirect |
|---------|--------|--------|----------|
| Polite = higher F0 | ✓ | ✓ | ✓ |
| Polite = wider range | ✓ | - | ✓ |
| Polite = more rising | ✓ | less falling | ✓ |
| Polite = higher HNR | ✓ | ✓ | - |
| Polite = faster rate | ✓ | ✓ | ✓ |

## Limitations

1. Laboratory speech (acted) - may not fully capture naturalistic variation
2. Canadian English only - patterns may vary cross-linguistically
3. Only request speech act examined
4. 4 speakers - individual variation not fully characterized
5. Intensity not analyzed (normalized out)

## Relevance to Project

**High relevance for Qlatt TTS:**

1. **Direct parameter targets:** The acoustic profiles provide specific targets for implementing politeness variation:
   - F0 adjustments (mean, range, contour)
   - Duration/rate modifications
   - Voice quality (HNR relates to spectral tilt/breathiness)

2. **Prosody rule implementation:** Elevation Index formula directly implementable for F0 contour shaping

3. **Speech act sensitivity:** Different patterns for different structures means prosody rules should be context-aware

4. **Pragmatic layer design:** Supports adding "politeness" or "attitude" parameter that modulates multiple acoustic dimensions

## Open Questions

- [ ] How to map HNR to Klatt synthesizer parameters? (Relates to AV, TL, spectral tilt)
- [ ] What F0 contour shapes map to "rising" vs "falling" in continuous synthesis?
- [ ] How to implement imposition-awareness in TTS (requires semantic analysis)?
- [ ] Cross-linguistic validity - would same patterns work for other languages?

## Related Work Worth Reading

- Scherer et al. (1984) - Vocal cues to speaker affect: covariance vs configuration models
- Gussenhoven (2002, 2004) - Biological codes theory (frequency code, effort code)
- Arndt & Janney (1985, 1987) - Emotive communication framework
- Wichmann (2004) - Intonation of please-requests (corpus study)
- Brown & Levinson (1987) - Politeness theory (face, imposition)
- Hellbernd & Sammler (2016) - Prosody conveys speaker intentions (speech act perception)

---

## Collection Cross-References

### Already in Collection
- **Banse_1996_VocalEmotionAcousticProfiles**
- **Fish_2017_SoundOfInsincerity**
- **Hellbernd_2016_ProsodySpeechActIntention**
- **Jiang_2017_SoundOfConfidenceDoubt**
- **Scherer_2001_VocalEmotionCrossCultural**

### New Leads (Not Yet in Collection)
- **Scherer, K.R., Ladd, D.R., Silverman, K.E., 1984** - "Vocal cues to speaker affect: testing two models" - Foundational paper on covariance vs configuration models for how acoustic cues encode affect. Critical for understanding categorical vs graded prosodic distinctions.
- **Gussenhoven, C., 2004** - "Paralinguistics: Three Biological Codes" - Theoretical framework (frequency code, effort code) explaining why higher pitch signals politeness cross-linguistically.
