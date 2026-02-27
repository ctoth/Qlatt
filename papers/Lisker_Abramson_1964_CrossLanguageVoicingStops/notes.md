# A Cross-Language Study of Voicing in Initial Stops: Acoustical Measurements

**Authors:** Leigh Lisker, Arthur S. Abramson
**Year:** 1964
**Venue:** WORD, 20:3, 384-422
**DOI:** 10.1080/00437956.1964.11659830

## One-Sentence Summary

This paper introduces Voice Onset Time (VOT) as a single acoustic dimension that effectively separates stop consonant categories across 11 languages, establishing the foundational measurement framework used universally in phonetics and speech synthesis for specifying voicing distinctions.

## Problem Addressed

Traditional phonetic descriptions of stop consonants used multiple loosely-defined dimensions (voicing, aspiration, articulatory force/fortis-lenis) to distinguish stop categories, yet these terms were often ambiguous, had no clear acoustic correlates, and failed to generalize across languages. The authors sought a single, physically measurable acoustic parameter that could unify these distinctions.

## Key Contributions

- **Defined Voice Onset Time (VOT):** The time interval between stop release and the onset of periodic glottal pulsing, measured from wide-band spectrograms. Release = zero reference point; voicing before release = negative values (voicing lead); voicing after release = positive values (voicing lag).
- **Demonstrated cross-language universality:** VOT effectively separates stop categories across 11 typologically diverse languages grouped by number of stop categories: two-category (Dutch, Spanish, Hungarian, Tamil, Cantonese, English), three-category (Eastern Armenian, Thai, Korean), and four-category (Hindi, Marathi).
- **Identified three universal VOT ranges (modes):** All 11 languages draw their stop categories from approximately three regions on the VOT continuum:
  1. **Voicing lead:** approximately -125 to -75 msec (prevoiced)
  2. **Short voicing lag:** approximately 0 to +25 msec (unaspirated)
  3. **Long voicing lag:** approximately +60 to +100 msec (aspirated)
- **Showed VOT is sensitive to place of articulation:** Velars consistently show higher (longer) VOT values than labials and dentals/alveolars.
- **Provided extensive measurement data** (Tables 1-22) for isolated words and sentences across all 11 languages.

## Methodology

- 17 informants across 11 languages, all educated speakers of standard varieties.
- Each informant produced a set of words containing all initial prevocalic stops in their language, used in two sentences (initial and non-initial positions).
- Wide-band spectrograms (Sona-Graph, Kay Electric Company) at expanded time scale (7.5 in/sec).
- VOT measured to nearest 5 msec by marking the interval between: (a) release point (abrupt change in spectrum), and (b) onset of voicing (first regularly spaced vertical striations indicating glottal pulsing).
- Data presented as averages, ranges, and token counts for each stop phoneme.
- Frequency distribution histograms for all languages (Figs. 2-8).

## Key Equations

No formal equations. The core definition is:

$$\text{VOT} = t_{\text{voicing onset}} - t_{\text{release}}$$

- VOT < 0: voicing lead (voicing begins before release)
- VOT = 0: simultaneous voicing and release
- VOT > 0: voicing lag (voicing begins after release)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Voice Onset Time | VOT | msec | -- | -250 to +150 | Negative = lead, positive = lag |
| Voicing lead (prevoiced) | -- | msec | ~-100 | -250 to -50 | Mode center ~-100 msec |
| Short lag (unaspirated) | -- | msec | ~+10 | 0 to +25 | Mode center ~+10 msec |
| Long lag (aspirated) | -- | msec | ~+75 | +60 to +150 | Mode center ~+75 msec |

### VOT Values by Language (Isolated Words, Averages in msec)

**Two-category languages:**

| Language | /b/ | /p/ | /d/ | /t/ | /g/ | /k/ |
|----------|-----|-----|-----|-----|-----|-----|
| Dutch | -85 | 10 | -80 | 15 | -- | 25 |
| Spanish | -138 | 4 | -110 | 9 | -108 | 29 |
| Hungarian | -90 | 2 | -87 | 16 | -58 | 29 |
| Tamil | -74 | 12 | -78 | 8 | -62 | 24 |
| Cantonese (p/ph) | 9 | 77 | 14 | 75 | 34 | 87 |
| English (b/p) | 1/-101 | 58 | 5/-102 | 70 | 21/-88 | 80 |

Note: English /b d g/ shows two populations (lag for 3 speakers, lead for 1 speaker TR).

**Three-category languages:**

| Language | /b/ | /p/ | /ph/ | /d/ | /t/ | /th/ | /g/ | /k/ | /kh/ |
|----------|-----|-----|------|-----|-----|------|-----|-----|------|
| E. Armenian | -96 | 3 | 78 | -102 | 15 | 59 | -115 | 30 | 98 |
| Thai | -97 | 6 | 64 | -78 | 9 | 65 | -- | 25 | 100 |
| Korean | -- | 7 | 91 | -- | 11 | 94 | -- | 19 | 126 |

Note: Korean has no voicing lead category; its three categories are all on positive side.

**Four-category languages:**

| Language | /b/ | /bh/ | /p/ | /ph/ | /d/ | /dh/ | /t/ | /th/ |
|----------|-----|------|-----|------|-----|------|-----|------|
| Hindi | -85 | -61 | 13 | 70 | -87 | -87 | 15 | 67 |
| Marathi | -117 | -95 | 11 | 76 | -111 | -87 | 10 | 65 |

Hindi and Marathi also have retroflex series and velar series with comparable patterns.

### English VOT (4 speakers, isolated words, Table 6)

| | /b/ | /p/ | /d/ | /t/ | /g/ | /k/ |
|--|-----|-----|-----|-----|-----|-----|
| Av. | 1/-101 | 58 | 5/-102 | 70 | 21/-88 | 80 |
| Range | 0:5/-130:-20 | 20:120 | 0:25/-155:-40 | 30:105 | 0:35/-150:-60 | 50:135 |
| N | 51/17 | 102 | 63/13 | 116 | 53/13 | 84 |

### English VOT (4 speakers, sentences, Table 17)

| | /b/ | /p/ | /d/ | /t/ | /g/ | /k/ |
|--|-----|-----|-----|-----|-----|-----|
| Initial Av. | 7/-65 | 28 | 9/-56 | 39 | 17/-45 | 43 |
| Non-init Av. | 4/-63 | 34 | 7 | 37 | 16 | 49 |

## Implementation Details

### Measurement procedure
1. Produce wide-band spectrogram of utterance
2. Identify release point: abrupt onset of energy in formant frequency range
3. Identify voicing onset: first regularly spaced vertical striations (glottal pulses)
4. Measure time difference to nearest 5 msec
5. Convention: release = 0, before = negative (lead), after = positive (lag)

### Key observations for synthesis
- **English /b d g/ in initial position** can be produced with either voicing lead OR short voicing lag depending on speaker. Three of four speakers produced short lag; one speaker (TR) produced voicing lead. This is significant: English "voiced" stops need not have actual voicing during closure.
- **In sentences**, VOT values are compressed compared to isolated words: both lead and lag values tend to be somewhat smaller in magnitude.
- **Voicing lead in non-initial position** proceeds unbroken from preceding voiced environment (no interruption of glottal pulsing).
- **Place of articulation effect:** Velars consistently show longer VOT than labials and dentals. This is consistent across all 11 languages.
- **Aspiration noise** during voicing lag occupies the formant frequency range (F2, F3 region) with random noise energy.
- **"Edge vibrations"**: Faint, inaudible glottal striations sometimes observed near the bottom of spectrograms during what should be voiceless intervals. These are not true voicing and were excluded from measurements.

### For Klatt synthesis of English stops
- **Voiced stops /b d g/:** VOT = 0 to +10 msec (short lag, typical for most speakers); OR VOT = -65 to -100 msec (voicing lead, minority pattern)
- **Voiceless stops /p t k/:** VOT = +28 to +80 msec in sentences, +58 to +80 msec in isolated words
- **Place ordering:** labial < dental/alveolar < velar for VOT magnitude
- **AV parameter:** Should be active during voicing lead period (before release)
- **AH parameter:** Should be active during voicing lag period (aspiration interval after release, before voicing onset)
- **AF parameter:** Burst at release point

## Figures of Interest

- **Fig 1 (page 390/p7):** Three spectrograms showing the three VOT conditions: voicing lead (Thai /di/), short lag (Thai /ti/), long lag (Thai /thi/). The canonical illustration of VOT.
- **Figs 2-4 (pages 400-402/p17-19):** VOT frequency distributions for labial, dental, and velar stops of two-category languages. Shows clear bimodal separation.
- **Figs 5-7 (pages 404-406/p21-23):** VOT frequency distributions for three- and four-category languages.
- **Fig 8 (page 408/p25):** Overall normalized VOT distribution across all 11 languages, showing the trimodal pattern (modes at -100, +10, +75 msec) for labials, apicals, and velars.

## Results Summary

1. VOT effectively separates stop categories in all 11 languages examined.
2. The VOT continuum is used by languages in a remarkably uniform way: categories cluster around three modes (-100, +10, +75 msec).
3. Two-category languages select two of these three modes (typically -100 and +10, or +10 and +75).
4. Three-category languages use all three modes.
5. Four-category languages (Hindi, Marathi) need additional features beyond VOT alone to separate voiced aspirates from voiced unaspirates (both have voicing lead of similar duration; they differ in voice quality during the murmur/aspiration phase).
6. Velars show somewhat higher positive VOT values than other places.
7. In sentences, VOT values are slightly compressed but categories remain well-separated.
8. No language places its categories at the extremes of the VOT continuum; there is substantial "unused" phonetic space.

## Limitations

- Only word-initial prevocalic stops examined (not medial, final, or cluster positions).
- Small number of informants per language (1-4 speakers).
- No perceptual validation presented (promised as a sequel study).
- VOT alone is insufficient for four-category languages (Hindi/Marathi): voiced aspirates and voiced unaspirates overlap on VOT. Additional cues (breathy voice quality, F1 cutback) are needed.
- Korean three-way contrast is not well-separated by VOT alone (the two lower categories overlap considerably).
- Measurement precision limited to 5 msec.
- No control for vowel environment, stress, or speech rate in most languages.

## Testable Properties

- VOT for English /p/ should average 28-58 msec (sentences vs. isolated words)
- VOT for English /t/ should average 39-70 msec
- VOT for English /k/ should average 43-80 msec
- VOT for English /b d g/ should be 0-20 msec (short lag) for most speakers
- Velar VOT > alveolar VOT > labial VOT (monotonic ordering by place)
- Aspirated stops should show VOT > 50 msec
- Unaspirated stops should show VOT 0-25 msec
- Prevoiced stops should show VOT -50 to -250 msec
- In sentences, VOT magnitudes are slightly compressed vs. isolated words

## Relevance to Project

This is the foundational paper for VOT measurement and directly informs Klatt stop consonant synthesis in Qlatt:

1. **AV/AH timing rules:** VOT defines when to switch from voicing source (AV) to aspiration noise source (AH) at stop release. For voiced stops, AV should be active nearly simultaneously with release (VOT ~0-10 ms). For voiceless aspirated stops, AH should fill the interval from release to voicing onset (VOT ~30-80 ms for English).

2. **AF burst timing:** The release burst (AF parameter) marks the VOT reference point. AF onset defines t=0 on the VOT dimension.

3. **Place-dependent VOT:** Velar stops require longer aspiration intervals than alveolars, which require longer than labials. This should be reflected in the TTS frontend duration rules.

4. **Cross-language synthesis:** If Qlatt is extended to other languages, the three-mode VOT framework provides the universal template for stop consonant timing.

5. **Edge vibrations:** The paper's observation about inaudible glottal edge vibrations during voiceless stops is relevant to the PLSTEP burst mechanism: very low-amplitude glottal activity may be present but should not be synthesized as true voicing.

## Open Questions

- [ ] How exactly should VOT vary with vowel context in synthesis? (Paper does not control for this.)
- [ ] What is the optimal VOT for English /b d g/ in synthesis: short lag or voicing lead? (Both patterns are attested.)
- [ ] How should VOT compression in sentences be modeled? (Linear scaling? Additive offset?)
- [ ] What additional acoustic features distinguish Hindi/Marathi voiced aspirates from voiced unaspirates? (Breathy voice quality, F1 onset patterns.)

## Related Work Worth Reading

- Lisker & Abramson (1967) "Experiments in Perception" - the perceptual validation sequel
- Liberman, Delattre & Cooper (1958) "Some Cues for the Distinction between Voiced and Voiceless Stops in Initial Position" - earlier perceptual work on VOT cues
- Abramson & Whalen (2017) "Voice Onset Time (VOT) at 50" - the 50-year retrospective (ALREADY IN COLLECTION)
- Fant (1960) "Acoustic Theory of Speech Production" - cited for force of articulation framework
- Jakobson, Fant & Halle (1952) "Preliminaries to Speech Analysis" - cited for tenseness/laxness features
- van den Berg, "Voice Production: the Vibrating Larynx" (1960) - cited for breathy voice mechanisms

## Collection Cross-References

### Already in Collection
- `Abramson_Whalen_2017_VOTat50` - This is the 50-year retrospective on VOT. The present 1964 paper is the ORIGINAL that Abramson & Whalen 2017 looks back on. The 2017 paper reviews how VOT has been extended to intervocalic stops, fricatives, and affricates, and proposes standardized Praat measurement conventions.
- `Fant_1960_AcousticTheorySpeechProduction` - Cited (footnote 5, 9) for the view that voicing, aspiration, and force of articulation are consequences of glottal position/activity during stop production rather than independent dimensions.
- `Zue_1976_StopConsonantAcoustics` - Provides detailed acoustic measurements of English stops (VOT, burst frequency, burst amplitude) that build directly on the VOT framework established here.
- `Klatt_1980_CascadeParallelFormantSynthesizer` - Uses VOT-based timing for stop consonant synthesis parameters (AV, AH, AF).
- `Crystal_House_1988_StopConsonantDuration` - Provides connected-speech stop duration data that complements the isolated-word and sentence-level VOT data here.
- `Koenig_LaryngealFactors` - Investigates how laryngeal control contributes to VOT variability across speaker groups, directly extending the physiological questions raised in Section IV of this paper.
- `Blumstein_Stevens_1979_AcousticInvariance` - Investigates burst spectral shapes as place-of-articulation cues, complementing VOT as the voicing cue.
- `Haskins_StopRecognition` - Examines the perceptual weighting of burst and formant transition cues for stop identification, complementary to the VOT production data here.

### New Leads (Not Yet in Collection)
- Liberman, Delattre & Cooper (1958) "Some Cues for the Distinction between Voiced and Voiceless Stops in Initial Position," *Language and Speech* I, 153-166 - directly relevant perceptual study of VOT cues
- Lisker & Abramson (1967) "A Cross-Language Study of Voicing in Initial Stops: Experiments in Perception" - the perceptual sequel to this paper
- van den Berg (1960) "Voice Production: the Vibrating Larynx" (film, U. Groningen) - laryngeal mechanisms for breathy/edge vibrations
- Sonesson (1960) "On the Anatomy and Vibratory Pattern of the Human Vocal Folds" - vocal fold anatomy for understanding VOT physiology

### Supersedes or Recontextualizes
- `Abramson_Whalen_2017_VOTat50` - The 2017 paper is explicitly a retrospective on this 1964 paper. Reading the original provides the full empirical foundation and cross-language data tables that the 2017 retrospective summarizes. The 1964 paper's detailed per-language tables (1-22) provide specific VOT values that the 2017 paper does not reproduce in full.
