# Winter & Grawunder (2012) - Phonetic Profile of Korean Formal/Informal Speech

**Citation:** Winter B, Grawunder S (2012) The phonetic profile of Korean formal and informal speech registers. Journal of Phonetics 40, 808-815. doi:10.1016/j.wocn.2012.08.006

## Design
- 16 Korean speakers (9F, 7M), age 21-31
- Mailbox Task + Discourse Completion Task
- Formal (contaymal) vs informal (panmal) registers
- Recorded in sound-attenuated booth, AKG C420, 48kHz/16bit

## Key Acoustic Shifts: Formal vs Informal (Table 1)

| Parameter | Formal Change | SE | p-value | Gender Interaction |
|---|---|---|---|---|
| **F0 mean** | **-17.2 Hz** | 5.4 | p<0.005 | No |
| **F0 SD** | **-0.42 Hz** | 0.13 | p<0.001 | No |
| **F0 range** | **-1.43 semitones** | 0.56 | p<0.006 | No |
| Intensity mean | -0.25 dB | 0.36 | n.s. | No |
| Intensity SD | -0.72 dB | 0.15 | N/A | p<0.007 (females drive) |
| Intensity range | -2.55 dB | 0.54 | N/A | p<0.005 (females drive) |
| **Local jitter** | **-0.0011** | 0.0004 | p<0.015 | No |
| Local shimmer | -0.0079 | 0.0014 | N/A | p<0.007 |
| **HNR** | **+1.51 dB** | 0.19 | ~0.053 | Males less (+0.92 dB) |
| **H1*-H2*** | **-0.66 dB** | 0.28 | N/A | p<0.03 (opposite for males: +0.34 dB) |
| **Articulation rate** | **-0.38 syl/s** | 0.18 | p<0.04 | No |
| Silent pauses | -0.58 count | 0.14 | N/A | p<0.001 (females drive) |
| Oral fillers (ah, oh) | +0.36 count | 0.097 | p<0.0002 | No |
| Nasal fillers (mh) | +0.52 count | 0.58 | N/A | p<0.008 |
| Regular breaths | no effect | - | n.s. | No |
| **Noisy breath intakes** | **+0.3 count** | 0.3 | N/A | p<0.03 (males 4.1x more in formal) |

## Summary of Formal Speech Profile

Formal Korean speech is characterized by:
1. **Lower F0** (-17 Hz) - contradicts Frequency Code prediction (politeness = high pitch)
2. **Reduced F0 variability** (SD, range both decreased)
3. **Less perturbation** (lower jitter, shimmer) - smoother voice
4. **Higher HNR** - cleaner signal
5. **Lower H1*-H2*** (for females) - slightly more constricted phonation
6. **Slower speech rate** (-0.38 syllables/second)
7. **More oral fillers** (ah, oh)
8. **More noisy breath intakes** ("hissing" ingressive sounds, especially males)

## Frequency Code Exception
Korean formal speech LOWERS F0 (both males and females), contradicting the cross-linguistic hypothesis that politeness/subordination = raised pitch (Ohala 1984). This matches Shin (2005)'s earlier claim for Korean.

## Gender Interactions
- F0 changes: consistent across genders (both lower in formal)
- Intensity variability: females show more reduction
- H1*-H2*: females decrease (less breathy), males slightly increase
- Noisy breaths: males increase much more (4.1x vs 1.63x)

## Statistical Methods
- Generalized linear mixed effects models (GLMMs)
- Fixed effects: Speech Register (formal/informal), Gender (male/female)
- Random effects: Subject

## Implementation Relevance
- For synthesizing formal speech register:
  - Lower F0 by ~17 Hz
  - Narrow F0 range by ~1.4 semitones
  - Reduce jitter/shimmer
  - Increase HNR by ~1.5 dB
  - Slow speaking rate by ~0.4 syl/s
- These are global "expressive envelope" changes affecting all segments
