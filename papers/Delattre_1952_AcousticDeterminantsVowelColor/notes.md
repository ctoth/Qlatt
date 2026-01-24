# An Experimental Study of the Acoustic Determinants of Vowel Color; Observations on One- and Two-Formant Vowels Synthesized from Spectrographic Patterns

**Authors:** Pierre Delattre, Alvin M. Liberman, Franklin S. Cooper, Louis J. Gerstman
**Year:** 1952
**Venue:** WORD, Volume 8, Number 3 (December 1952)
**Institution:** Haskins Laboratories

## One-Sentence Summary

Provides empirically-determined F1/F2 formant frequency targets for all 16 IPA cardinal vowels synthesized with only two formants, plus evidence that back vowels can be approximated with a single formant due to perceptual "averaging."

## Problem Addressed

Determining the minimal acoustic features (formant positions) needed to synthesize identifiable vowels, and understanding how many formants are perceptually necessary for different vowel categories.

## Key Contributions

1. **Two-formant vowel synthesis**: Demonstrated that all 16 cardinal vowels can be synthesized with only F1 and F2
2. **Formant frequency targets**: Provided precise F1/F2 values for 16 IPA cardinal vowels
3. **Perceptual averaging**: Discovered that the ear "averages" closely-spaced formants, explaining why back vowels can be single-formant
4. **Front vs back vowel asymmetry**: Front vowels require two formants; back vowels can be approximated with one

## Methodology

- Used "pattern playback" instrument to convert hand-painted spectrograms to sound
- 235 two-formant patterns tested with systematic F1/F2 variations
- F0 = 120 Hz (male voice)
- Formant width: 2-4 harmonics (240-480 Hz bandwidth)
- Intensity equalization: -9 dB/octave above 1500 Hz
- Perceptual testing with phonetics students

## Key Equations

No mathematical equations provided - this is an empirical perceptual study.

## Parameters

### Two-Formant Vowel Targets (F0 = 120 Hz)

| Vowel | IPA | F1 (Hz) | F2 (Hz) | Category |
|-------|-----|---------|---------|----------|
| i | /i/ | 250 | 2900 | Close front unrounded |
| y | /y/ | 250 | 1900 | Close front rounded |
| ɯ | /ɯ/ | 250 | 1050 | Close back unrounded |
| u | /u/ | 250 | 700 | Close back rounded |
| e | /e/ | 360 | 2400 | Mid-close front unrounded |
| ø | /ø/ | 360 | 1650 | Mid-close front rounded |
| ɤ | /ɤ/ | 360 | 1100 | Mid-close back unrounded |
| o | /o/ | 360 | 800 | Mid-close back rounded |
| ɛ | /ɛ/ | 510 | 2000 | Mid-open front unrounded |
| œ | /œ/ | 510 | 1450 | Mid-open front rounded |
| ʌ | /ʌ/ | 510 | 1150 | Mid-open back unrounded |
| ɔ | /ɔ/ | 510 | 950 | Mid-open back rounded |
| æ | /æ/ | 750 | 1650 | Open front unrounded |
| a | /a/ | 750 | 1300 | Open central |
| ɒ | /ɒ/ | 750 | 1200 | Open back rounded |
| ɑ | /ɑ/ | 750 | 1100 | Open back unrounded |

### One-Formant Vowel Equivalents

| Vowel | Single Formant (Hz) | Quality |
|-------|---------------------|---------|
| /u/ | 240 | Good |
| /o/ | 480 | Good |
| /ɔ/ | 720 | Good |
| /a/ | 1200 | Good |
| /ɛ/ | 2160 | Fair |
| /e/ | 2520 | Fair |
| /i/ | 3000 | Good |

### French Vowel Comparison (Spoken vs Synthetic)

The synthetic F2 values are higher than spoken French vowels, especially for front vowels:
- /i/: Synthetic F2 = 2900 Hz vs French F2 ≈ 2500 Hz (1.3 tones higher)
- /e/: Synthetic F2 higher by ~¾ tone
- /ɛ y ø œ/: Synthetic F2 higher by ~¼ tone

**Explanation**: The synthetic F2 represents a perceptual "average" of natural F2 and F3.

## Implementation Details

### Synthesis Parameters
- **Fundamental frequency**: 120 Hz
- **Harmonic spacing**: 120 Hz
- **Formant width**: 2½ harmonics (~300 Hz)
- **Frequency resolution**: Can achieve ~10-30 Hz by unbalancing harmonic amplitudes within formant
- **Intensity slope**: -9 dB/octave above 1500 Hz (equalization)

### Perceptual Averaging Rule
When two formants are close together (< ~1 octave apart), the ear perceives them as a single formant at an intermediate frequency weighted by their relative intensities.

**Implications for synthesis:**
- Back vowels (/u o ɔ/): F1 and F2 close → can use single formant near F1
- Front vowels (/i e ɛ/): F1 and F2 far apart → need both formants
- /i/ exception: Single high F2 (~3000 Hz) sufficient due to anchoring effect

### Intensity Variation Effects

**Reducing F1 intensity:**
- Front vowels (F1-F2 far apart): Loss of vowel color → non-vowel sound at F2 pitch
- Back vowels (F1-F2 close): Color shift to adjacent vowel (e.g., /u/ → close /ɔ/)
- /a ʌ ɔ ɑ/ with F1 -7dB: Slight nasalization

**Reducing F2 intensity:**
- Front vowels: Become "dull," then shift to back vowel sharing same F1
  - /i y ɯ/ → close vague /u/
  - /e ø ɤ/ → close vague /o/
  - /ɛ œ ʌ/ → close vague /ɔ/
- Back vowels: Shift toward closer back vowel
- /æ a ɒ ɑ/ with reduced F2 → open /ɔ/

## Figures of Interest

- **Fig. 1 (page 5)**: Synthetic spectrograms of 16 cardinal vowels showing formant composition
- **Fig. 2 (page 6)**: F1×F2 vowel space with logarithmic reversed axes (resembles articulatory quadrilateral)
- **Figs. 3-5 (pages 7-8)**: Identification accuracy percentages for Tests A, B, C
- **Fig. 6 (page 12)**: One-formant vowel identification results
- **Fig. 7 (page 13)**: Comparison of synthetic vs spoken French vowel formants

## Results Summary

### Identification Accuracy
- **Test C** (7 "outside" vowels /i e ɛ a ɔ o u/): High accuracy (75-100%)
- **Test B** (10 French vowels): Moderate accuracy
- **Test A** (all 16 cardinal): Lower accuracy due to unfamiliar vowels

### Key Findings
1. Two formants sufficient for all cardinal vowels
2. Back vowels can be approximated with one formant
3. /i/ identifiable with single high-frequency formant (~3000 Hz)
4. Front vowels lose color without F1; back vowels shift color
5. Synthetic F2 must be higher than natural F2 to compensate for missing F3

## Limitations

1. **F0 fixed at 120 Hz**: No investigation of formant shifts needed for other F0 values
2. **Male voice only**: Results may not generalize to female/child voices
3. **Steady-state only**: No investigation of dynamic vowel transitions
4. **No F3**: May explain why synthetic front vowels need elevated F2
5. **Limited subjects**: Mostly English-speaking phonetics students

## Relevance to Qlatt Project

### Direct Applications
1. **Vowel formant targets**: Table I provides validated F1/F2 values for synthesis
2. **Formant bandwidth**: ~2½ harmonics = ~300 Hz at 120 Hz F0
3. **Intensity balance**: -9 dB/octave slope above 1500 Hz for natural equalization
4. **Back vowel simplification**: Can potentially use single formant for /u o ɔ/

### Implementation Considerations
- Current Qlatt uses Peterson & Barney (1952) targets - compare with these
- The elevated F2 for front vowels suggests F3 contribution matters
- Perceptual averaging may explain tolerance for formant frequency errors in back vowels
- For whispered/unvoiced vowels, the averaging principle still applies

### Comparison with Peterson & Barney (1952)
Peterson & Barney measured natural speech; Delattre synthesized minimal vowels.
The synthetic F2 values are generally higher, compensating for missing F3.

## Open Questions

- [ ] How do these targets compare to Peterson & Barney values already in Qlatt?
- [ ] Should Qlatt implement F2 elevation for front vowels if F3 is weak?
- [ ] Can back vowel synthesis be simplified using single-formant approximation?
- [ ] How does perceptual averaging affect coarticulation modeling?

## Related Work Worth Reading

- Chiba & Kajiyama (1941) - *The Vowel: Its Nature and Structure*
- Dunn (1950) - "The Calculations of Vowel Resonances" JASA 22:740-53
- Peterson & Barney (1952) - "Control Methods Used in a Study of the Vowels" JASA 24:175-84
- Joos (1948) - *Acoustic Phonetics*, Language Monographs No. 23
- Fletcher (1929) - *Speech and Hearing* (early single-formant observations)
