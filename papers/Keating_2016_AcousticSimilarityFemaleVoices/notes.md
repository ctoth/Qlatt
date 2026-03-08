# Acoustic Similarity Among Female Voices

**Authors:** Patricia Keating, Jody Kreiman
**Year:** 2016
**Venue:** Acoustical Society of America Meeting (ASA), Honolulu, 2 Dec 2016, Poster 5aSC7
**DOI/URL:** Poster presentation

## One-Sentence Summary
Identifies which acoustic parameters best distinguish individual female voices using MDS and LDA on 50 women's voices with 26 acoustic variables, finding that F0, SHR, F3, F4, and CPP do most of the work of speaker discrimination.

## Problem Addressed
Many acoustic parameters characterize voices, but it is unclear which few parameters are critical for distinguishing individual speakers vs. which are similar across many speakers.

## Key Contributions
- MDS analysis of perceptual voice similarity space (2D solution, R²=.88)
- LDA of 50 voices achieving 49.2% correct classification (chance ~2%) using acoustic variables
- Identifies top discriminating parameters: F0, SHR, F3, F4, CPP
- Shows that most acoustic variables are only useful for distinguishing a voice from one or two others, not broadly

## Methodology
- **Speakers**: 50 women from UCLA Speaker Variability Database, ages 18-29 (mean 20, SD=1.9), native English, fairly homogeneous group
- **Speech recordings**: 5 Harvard sentences read 3 times each, recorded in soundbooth with B&K mic at 22k SR
- **Speech processing**: VoiceSauce (v1.41), 42 acoustic parameters mapped to Multi-Dimensional Scaling of perceived similarity of 80 voices
- **Parameters measured** (26 retained after trimming):
  - F0 (from STRAIGHT)
  - H1*-H2*, H2*-H4*, H1*-H2K*, H2K*-H5K, H1*-A3*
  - (the * parameters of the source spectral model of [1])
  - F1, F2, F3, F4 (from Snack)
  - Cepstral Peak Prominence (CPP)
  - Means only; Energy, Subharmonic-to-harmonic ratio (SHR)
  - SDs only: Harmonic-noise ratio in 4 frequency bands
  - Note: bare parameter names refer to MEAN — a very limited acoustic model, no dynamics or timing

## Key Equations
No formal equations — poster-format study.

## Parameters

### MDS Results (2D solution)
- R² = .88
- Dimension 1 correlates with: F0, SHR, F3
- Dimension 2 correlates with: F0, F3 (re-ordered)
- Red = acoustic center; Blue = voices most distinguishable below; Black = voice least distinguishable from below; White = other voices

### LDA Results (50 speakers)
- 3 eigenvectors for 49.2% of variance
- Correct classification of tokens by speaker = 68.3%
- Very diverse misclassifications (of speakers)
- Correlate LDA factors with acoustic variables:
  - Correlated strongly with: **F0, F4, CPP** (then F1, CPP_SD)
  - Just these variables alone classify 22.1%
  - Correlated with: F0, F4

### Top Discriminating Variables (from LDA + correlation analysis)
1. **F0** — most important across all analyses
2. **SHR** (Subharmonic-to-Harmonic Ratio) — important in MDS
3. **F3** — important in MDS, correlated with speaker space
4. **F4** — important in LDA classification
5. **CPP** (Cepstral Peak Prominence) — correlated with LDA factors
6. **Energy** — now playing major role in reordered analysis

### 5-Speaker Subset Analysis
- 198 5-speaker subsets drawn from 50 voices
- Each voice appears in 20 subsets, with all others
- LDA of 5 speakers in each subset (150 sentences)
- Correlate LDA factors with acoustic variables
- Count number of times each acoustic variable correlated above threshold = how much work in each variable doing across all 5-voice subsets
- Result: most variables are useful for distinguishing a given voice from just one or two other voices
- A few variables are strongly correlated with LDA factors, making many voice distinctions: **Energy, SHR, F0, F3, F4, CPP**

## Results Summary
1. Voice space is primarily pitch (F0), higher formants (F3, F4), creak/breathiness (SHR, CPP)
2. Distinctiveness depends on more than just these — but these do "most of the work"
3. Most voice-distinguishing parameters [5] are not important here
4. All parameters contribute to characterizing the full set of voices — many voices require many parameters
5. Surprisingly, the voice source spectral model parameters [5] are not important here

## Limitations
- Poster format — limited methodological detail
- Only female voices (ages 18-29)
- Static measures only — no dynamics, timing, or temporal variation
- Limited to sustained reading; no spontaneous speech
- Only 26 variables retained after trimming from 42
- No explicit regression coefficients or weightings provided

## Testable Properties
- F0 must be the single strongest discriminator of individual voices
- F3 and F4 should contribute to speaker discrimination beyond F1/F2
- CPP (voice quality/periodicity) should contribute independently of F0
- H1*-H2* and other source spectral measures should be weak individual discriminators

## Relevance to Project
For the Qlatt speaker personality system, this work identifies which acoustic parameters matter most for creating distinct-sounding speaker profiles. The finding that F0, F3, F4, CPP, SHR, and Energy are the primary discriminators — rather than source spectral tilt measures — suggests that speaker profile design should prioritize these parameters. The relative unimportance of H1*-H2* and similar measures for speaker discrimination (though important for voice quality) suggests these parameters serve more to set overall voice quality class than to distinguish individuals within a class.

## Open Questions
- [ ] How do these findings generalize to male voices?
- [ ] Would including temporal/dynamic parameters change the ranking?
- [ ] Is F4 currently modeled with enough precision in Qlatt for speaker discrimination?

## Related Work Worth Reading
- Kreiman & Sidtis (2011) — Foundations of voice studies (cited as [1])
- Kreiman, Iseli, Shue & Alwan (2008) — Source spectral model parameters
- Kreiman, Park, Keating & Alwan (2015) — "The perceptual structure of pathological voice quality"
