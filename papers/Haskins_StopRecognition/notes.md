# Stop-Consonant Recognition: Release Bursts and Formant Transitions as Functionally Equivalent, Context-Dependent Cues

**Authors:** M. F. Dorman, M. Studdert-Kennedy, L. J. Raphael
**Year:** 1977
**Venue:** Perception & Psychophysics, Vol. 22(2), pp. 109-122
**Affiliations:** Arizona State University, Queens College CUNY, Haskins Laboratories

## One-Sentence Summary

Release bursts and formant transitions are functionally equivalent, context-dependent cues for stop place of articulation - where one is strong the other is weak, with burst effectiveness tied to spectral continuity with the following vowel's front cavity resonance.

## Problem Addressed

Whether release bursts are functionally invariant cues for stop place (as Cole & Scott 1974 claimed) or whether they, like transitions, are context-dependent with varying perceptual weight across vowel environments.

## Key Contributions

1. **Trading relation**: Bursts and transitions are reciprocally weighted - where one is strong, the other is weak
2. **Front cavity resonance hypothesis**: Burst effectiveness depends on spectral continuity with the vowel's front cavity (F2 or F3) resonance
3. **Functional invariance**: Bursts are largely invariant within each place class when transposed across vowels (W = .79 for labials, .72 for apicals)
4. **No single sufficient cue**: Neither burst nor transition alone maintains original syllable performance across all contexts

## Key Findings

### Acoustic Segments in Stop-CV Syllables
1. **Occlusion**: Usually silent, occasionally voiced
2. **Burst**: Transient explosion <20 ms, produced by shock excitation at release
3. **Frication**: Very brief (0-10 ms), as articulators separate
4. **Aspiration**: 2-20 ms of noise-excited formant transitions (devoiced)
5. **Voiced transitions**: Final stage, laryngeal vibration begins

### Burst Characteristics by Place

| Place | Burst Spectrum | Duration | Key Feature |
|-------|---------------|----------|-------------|
| Labial | Broad, peaks <2000 Hz | Short (~4.3 ms) | Low-frequency, weak |
| Apical | Broad, peaks >2000 Hz | Medium (~6.3 ms) | High-frequency, compact |
| Velar | Narrow, peak near F2/F3 | Long (~11.7 ms) | Mid-frequency, variable |

### Voice Onset Time (Table 1)

| Vowel | /b/ VOT | /d/ VOT | /g/ VOT |
|-------|---------|---------|---------|
| /i/ | 9 ms | 8 ms | 25 ms |
| /ɛ/ | 10 ms | 12 ms | 15 ms |
| /æ/ | 5 ms | 13 ms | 12 ms |
| /a/ | 7 ms | 14 ms | 13 ms |
| /ɔ/ | 9 ms | 12 ms | 8 ms |
| /u/ | 6 ms | 6 ms | 7 ms |
| Mean | ~7.7 ms | ~11.7 ms | ~21.0 ms |

VOT increases from labial → apical → velar

### Perceptual Weight by Context

**Labial /b/**:
- Burst: Strong cue before rounded back vowels /ɔ,u,ɜ/
- Burst: Weak cue before front vowels /i,ɪ,æ/
- Transitions: Strong before front vowels
- Explanation: Labial burst has low-frequency energy near F2 of back vowels

**Apical /d/**:
- Burst: Strong cue before front vowels /ɪ,i/ and /ɜ/
- Burst: Weak cue before back vowels /a,ɔ,u/
- Transitions: Strong before back vowels
- Explanation: Apical burst has high-frequency energy near F3 of front vowels

**Velar /g/**:
- Burst: Strong cue before back vowels /a,ɔ,u,ɜ/
- Burst: Weak cue before front vowels /i,ɪ,æ/
- Two groups: Front vowels vs back vowels show different patterns
- Explanation: Velar burst is near F2 which varies with vowel

### Experiment 3: Burst Transposition Results

Bursts from each CVC transposed across all 9 vowels:

**Labial bursts**: Kendall's W = .79 (p < .0001)
- Nine curves highly concordant
- Functional invariance: bursts interchangeable within labial class
- Best before /ɔ,u,ɜ/, weakest before /i,ɪ,æ/

**Apical bursts**: Kendall's W = .72 (p < .0001)
- High concordance among transposed curves
- Functional invariance demonstrated
- Best before /ɪ,i/, weakest before back vowels

**Velar bursts**: Two distinct groups
- Front vowel bursts: W = .69 (p < .05)
- Back vowel bursts: W = .66 (p = .01)
- Asymmetry: Front bursts don't work before back vowels and vice versa

## Implementation Details

### Front Cavity Resonance Hypothesis

The burst's perceptual effectiveness depends on spectral proximity to the following vowel's front cavity resonance:

```
Labial: Low-frequency burst → integrates with F2 of back vowels
        Weak affiliation with front vowels (F2 too high)

Apical: High-frequency burst → integrates with F3 of front vowels
        Less integration with back vowels (F3 lower)

Velar:  Mid-frequency burst near F2 → depends on vowel F2
        Works when burst frequency matches vowel F2
```

### Synthesis Implications

1. **Burst-vowel continuity matters**: Burst spectrum should be continuous with vowel formants
2. **Trading relations**: When transition is strong, burst can be weak (and vice versa)
3. **VOT affects transition weight**: Longer VOT → more devoiced transition → less transition effectiveness
4. **No single invariant cue**: Both burst and transition contribute; their weights vary

### Cue Effectiveness by Vowel Type

| Consonant | Front Vowels /i,ɪ,æ/ | Central /a,ʌ/ | Back /ɔ,u,ɜ/ |
|-----------|---------------------|---------------|--------------|
| /b/ | Burst weak, trans strong | Mixed | Burst strong |
| /d/ | Burst strong | Mixed | Trans strong |
| /g/ | Burst weak | Burst moderate | Burst strong |

## Figures of Interest

- **Figure 1 (p.110)**: Spectrogram and oscillogram of /gʌd/ showing burst (a-b), aspiration (b-c), voicing onset (c)
- **Figure 2 (p.111)**: Burst spectra for /b,d,g/ before 9 vowels - shows spectral invariance of labial/apical, variability of velar
- **Figure 3 (p.114)**: Experiment 1 results - percent correct by cue combination and vowel
- **Figure 4 (p.115)**: Experiment 2 results - Speaker 2 with longer bursts
- **Figure 5 (p.117)**: Experiment 3 - Burst transposition results showing functional invariance

## Key Quotes

> "Bursts were largely invariant in their effect, but carried significant perceptual weight in only one syllable out of 27 for Speaker 1, in only 13 syllables out of 27 for Speaker 2."

> "Where the perceptual weight of one increased, the weight of the other declined. They were thus shown to be functionally equivalent, context-dependent cues."

> "The results are interpreted as pointing to the possible role of the front-cavity resonance in signaling place of articulation."

> "Bursts and transitions are acoustically and functionally (that is, perceptually) equivalent: both provide a spectrally continuous change from the consonantal release into the following vowel."

## Relevance to Qlatt

1. **Burst spectrum design**: Should match front cavity resonance of following vowel for natural integration
2. **Cue redundancy**: Both burst and transitions contribute - weakening one can be compensated by strengthening the other
3. **VOT affects cue balance**: Longer VOT (voiceless stops) reduces transition effectiveness, increases burst importance
4. **Context-dependent burst energy**:
   - Labial: emphasize low frequencies before back vowels
   - Apical: emphasize high frequencies before front vowels
   - Velar: match burst peak to vowel F2

### Practical Guidelines

```
For labial stops (/b,p/):
  - Burst: flat/falling spectrum, peaks <2000 Hz
  - Short duration (~4-5 ms)
  - Stronger cue before /ɔ,u,ʌ/, weaker before /i,ɪ/

For apical stops (/d,t/):
  - Burst: rising spectrum, peaks >2000 Hz
  - Medium duration (~6-7 ms)
  - Stronger cue before /i,ɪ,ɛ/, weaker before /ɔ,u/

For velar stops (/g,k/):
  - Burst: compact spectrum near vowel F2
  - Longer duration (~10-12 ms)
  - Burst frequency varies with vowel (higher before front, lower before back)
```

## Limitations

1. Only two speakers studied in detail
2. No direct measurement of burst intensity (energy)
3. No correlation between burst duration and performance
4. Results may differ across speaking rates and styles

## Open Questions

- [ ] How to model burst-vowel spectral continuity in synthesis?
- [ ] Exact trading relation weights between burst and transitions?
- [ ] Does front cavity resonance hypothesis explain velar burst variability?

## Related Work

- Cole & Scott (1974) - Claimed burst invariance
- Fischer-Jørgensen (1954, 1972) - Danish stop consonant studies
- Zue (1976) - Acoustic characteristics of stops (PhD thesis)
- Stevens (1975) - Front cavity resonance theory
- Kuhn (1975) - Front cavity resonance in speech perception
