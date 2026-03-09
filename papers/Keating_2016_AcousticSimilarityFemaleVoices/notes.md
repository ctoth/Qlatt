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
- LDA of 50 voices: 3 eigenfunctions for 49.2% of variance, 68.3% correct token classification
- Identifies top discriminating parameters: F0, SHR, F3, F4, CPP
- Shows that most acoustic variables are only useful for distinguishing a voice from one or two others, not broadly

## Methodology
- **Speakers**: 50 women from UCLA Speaker Variability Database, ages 18-29 (mean 20, SD=1.9), native English, fairly homogeneous group
- **Speech recordings**: 5 Harvard sentences read 6x each over 3 sessions (=30/speaker, total 1475 tokens), recorded in soundbooth with B&K mic at 22k SR
- **Speech processing**: Only vowel and approximant intervals; VoiceSauce [3,4], 42 acoustic parameters every 5 ms in 1475 tokens (~588k data frames); removed missing/extreme values -> ~193k frames (~0.65 sec speech/token); mean and SD of each parameter per token
- **Parameters measured** (26 retained after trimming):
  - F0 (from STRAIGHT)
  - H1*-H2*, H2*-H4*, H4*-H2k*, H2k*-H5k*
  - (the parameters of the source spectrum model of [5])
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
- Dimension 2 correlates with: F4, H1*-H2*, CPP
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
3. All parameters contribute to characterizing the full set of voices — many voices require many parameters
4. Surprisingly, the voice source spectrum model parameters [5] (H1*-H2*, H2*-H4*, etc.) are not important for speaker discrimination

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

## Collection Cross-References

### Already in Collection
- [[Kreiman_Gerratt_2010_PerceptualVoiceQualityAssessment]] — cited as [2]; the psychoacoustic model whose parameters are tested here for speaker discrimination
- [[Kreiman_2007_GlottalSourceSpectrum]] — Kreiman et al.'s source spectral model whose parameters (H1*-H2*, H2*-H4*, etc.) were tested here and found surprisingly unimportant for speaker discrimination

### Cited By (in Collection)
- [[Lee_2019_AcousticVoiceVariation]] — extends this work with full PCA on the same UCLA Speaker Variability Database (100 speakers vs. 50 here), finding that F0 is a major discriminator (confirming this paper's LDA finding) but not a major axis of variability

### Conceptual Links (not citation-based)
- [[Lee_2019_AcousticVoiceVariation]] — **Strong.** Same research group (Keating, Kreiman), same database. This poster identifies F0, SHR, F3, F4, CPP as top discriminators via LDA; Lee 2019 extends with PCA showing harmonic/inharmonic balance (PC1) and formant dispersion (PC2) as the dominant variability axes. The apparent tension — F0 is the top discriminator here but not a major variability axis in Lee 2019 — is resolved by recognizing that discrimination and variability are different analyses.
- [[Cartei_2014_VoiceMasculinity]] — **Moderate.** Cartei identifies F0 and formant spacing as independent dimensions of voice gender perception; this paper's finding that F3, F4, and F0 are top discriminators among female speakers aligns with Cartei's identification of these as independent voice identity cues.
- [[Iseli_2007_VoiceSourceAgeSexVowel]] — **Moderate.** Iseli provides harmonic correction formulas (H1*, H2*, etc.) used in this study's measurements; the corrected source spectral measures' poor discriminative power here challenges the assumption that corrected spectral tilt is a strong individual marker.
- [[Eyben_2015_GeMAPS_AcousticParameters]] — **Moderate.** GeMAPS standardizes many of the same acoustic measures (F0, formants, spectral tilt, loudness); this paper's ranking of discriminative value informs which GeMAPS features to prioritize for speaker profiling.
- [[Childers_Lee_1991_VoiceQualityFactors]] — **Moderate.** Childers' voice quality factors (OQ, spectral tilt) are among the source parameters tested here; the finding that these are weak individual discriminators suggests they characterize voice quality class rather than individual identity.
- [[Schild_2019_AttractiveVoiceFormantF0]] — **Moderate.** Schild's PCA-based approach to voice attractiveness uses many of the same spectral measures; this paper's finding that CPP and energy are strong discriminators provides context for which voice quality dimensions vary most across speakers.

## Related Work Worth Reading
- Kreiman & Sidtis (2011) — Foundations of voice studies (cited as [1])
- Kreiman & Gerratt (1996) — Perceptual structure of pathologic voice quality; no acoustic parameters mapped to MDS of 80 voices (cited as [2])
- Shue (2010) / Shue et al. (2011) — VoiceSauce voice analysis tool (cited as [3,4])
- Kreiman et al. (2014) — Perceptual evaluation of voice source models; source spectrum parameters tested here (cited as [5])
