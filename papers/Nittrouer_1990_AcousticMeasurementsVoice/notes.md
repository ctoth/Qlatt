# Acoustic Measurements of Men's and Women's Voices: A Study of Context Effects and Covariation

**Authors:** Susan Nittrouer, Richard S. McGowan, Paul H. Milenkovic, Donna Beehler
**Year:** 1990
**Venue:** Journal of Speech and Hearing Research, 33, 761-775
**DOI/URL:** 0022-4685/90/3304-0761

## One-Sentence Summary

Provides normative data on how fundamental frequency, jitter, shimmer, SNR, band-limited SNR (2-4 kHz), and H1-H2 vary with speaker sex, consonantal context, and vowel identity, with implications for aspiration noise modeling in synthesis.

## Problem Addressed

Previous work had not systematically measured how multiple acoustic voice-source parameters covary with phonetic structure (consonantal context and vowel identity) in normal speakers, nor had it resolved whether signal-to-noise ratio measures and spectral tilt (H1-H2) index the same or different aspects of laryngeal activity.

## Key Contributions

- Normative data for six acoustic voice-source measures across 15 CV syllables, separated by speaker sex
- Evidence that consonantal voicing/manner systematically affects F0, jitter, shimmer, SNR, BLSNR, and H1-H2
- Demonstration that SNR and H1-H2 are driven by different mechanisms in male vs. female voices: for men, SNR is dominated by jitter; for women, SNR reflects aspiration noise
- Introduction of BLSNR (2-4 kHz band-limited signal-to-noise ratio) as a more aspiration-noise-specific measure
- Evidence that H1-H2 tracks with F0 for men but not women, suggesting women limit variation in spectral tilt above a certain F0

## Methodology

- 8 speakers (4M, 4F), 15 CV syllables (vowels /i, a, u/ x consonants /s, f, t, d, k/) in carrier phrase
- Recorded at two times of day (morning, afternoon)
- 8 tokens per syllable per session; 10 pitch periods from vowel center extracted and inverse-filtered (22-coeff LPC)
- Measurements: F0, jitter (ms), shimmer (%), SNR (dB), BLSNR (2-4 kHz, dB), H1-H2 (dB, for /a/ only)
- ANOVAs with speaker sex (between), consonantal context + vowel + time of day (within)

## Key Equations

None presented as formal equations. Key measures defined operationally:

- **Jitter**: Mean cycle-to-cycle change in pitch period (ms)
- **Shimmer**: Mean percent change in waveform amplitude among pitch periods (%)
- **SNR**: $10 \log_{10}(\text{total energy} / \text{aperiodic energy})$ (dB), measured via pitch predictor on inverse-filtered signal, passband 0-3.3 kHz
- **BLSNR**: Same as SNR but applied to the 2-4 kHz frequency range only
- **H1-H2**: Amplitude of first harmonic minus amplitude of second harmonic (dB), from DFT on /a/ samples

## Parameters

| Measure | Sex | Mean | SD | Context Notes |
|---------|-----|------|----|---------------|
| F0 (Hz) | M | 132-139 | 23-29 | varies by vowel; /a/ lowest |
| F0 (Hz) | F | 197-215 | 7-14 | /a/ lowest, /u/ highest |
| Jitter (ms) | M morning | 0.076-0.088 | 0.036-0.060 | lower after /d/ |
| Jitter (ms) | M afternoon | 0.104-0.153 | 0.042-0.071 | dramatically higher |
| Jitter (ms) | F | 0.027-0.050 | 0.007-0.028 | no consonant effect |
| Shimmer (%) | all | 3.00-4.07 | 1.37-2.14 | /a/ highest |
| SNR (dB) | all | 22.2-23.5 | 2.8-3.0 | highest after /d/ |
| BLSNR (dB) | all | 6.92-8.37 | 2.54-3.34 | /u/ lowest |
| H1-H2 (dB) | M (/a/) | ~1-3 | - | increases with F0 |
| H1-H2 (dB) | F (/a/) | ~3-6 | - | independent of F0 |

### Consonantal Context Effects (Table 2 data, means across other variables)

| Measure | /d/ | /s/ | /f/ | /t/ | /k/ |
|---------|-----|-----|-----|-----|-----|
| SNR (dB) | 24.0 | 22.4 | 22.5 | 22.0 | 21.9 |
| BLSNR (dB) | 8.57 | 7.85 | 7.87 | 7.29 | 7.49 |
| Shimmer (%) | 2.91 | 3.33 | 3.42 | 3.85 | 3.62 |
| F0 M (Hz) | 128 | 134 | 133 | 138 | 137 |
| F0 F (Hz) | 196 | 206 | 205 | 212 | 210 |
| H1-H2 M (/a/) | 0.67 | 1.67 | 1.59 | 2.96 | 2.79 |
| H1-H2 F (/a/) | 3.56 | 4.39 | 4.31 | 4.68 | 4.34 |

**Pattern:** Voiced stop /d/ -> voiceless fricatives /s,f/ -> voiceless stops /t,k/: F0, jitter, shimmer, H1-H2 increase; SNR, BLSNR decrease.

### Key Correlations

| Correlation | All | Males | Females |
|-------------|-----|-------|---------|
| SNR vs BLSNR | 0.78 | - | - |
| SNR vs jitter | -0.43 | -0.71 | -0.11 (ns) |
| SNR vs shimmer | -0.61 | - | - |
| BLSNR vs jitter | -0.40 | -0.67 | -0.02 (ns) |
| BLSNR vs shimmer | -0.47 | - | - |
| H1-H2 vs F0 (/a/) | 0.79 | 0.76 | 0.10 (ns) |
| H1-H2 vs SNR (/a/) | 0.21 (ns) | 0.59 | -0.43 |
| H1-H2 vs BLSNR (/a/) | 0.06 (ns) | 0.44 | -0.59 |
| H1-H2 vs F1 (/a/) | 0.48 | 0.10 (ns) | -0.48 |

## Implementation Details

### Implications for Klatt Synthesis

1. **Aspiration noise (AH) after voiceless consonants:** The paper shows that SNR and BLSNR are lower (more noise) after voiceless stops and fricatives. This supports rules that increase AH during vowel onset following voiceless consonants, with the effect persisting into the vowel center.

2. **Sex-differentiated voice modeling:**
   - Women: Higher H1-H2 (~3-6 dB for /a/), H1-H2 independent of F0, aspiration noise is the primary noise component
   - Men: Lower H1-H2 (~1-3 dB for /a/), H1-H2 tracks F0, jitter is the primary noise component
   - For female voice presets, increasing TL (spectral tilt) and AH (aspiration) is appropriate
   - For male voice presets, increasing AV with slight jitter gives more natural quality

3. **Consonantal context on voice source:** Rules should adjust source parameters not just during consonants but into the following vowel (coarticulatory effects persist to vowel center). Specifically:
   - After voiceless stops: elevate F0 by ~7-10 Hz (men) or ~14-16 Hz (women), increase jitter (men only), increase shimmer, increase aspiration noise
   - After voiced stops: lower F0, lower jitter, lower shimmer, less aspiration noise
   - After voiceless fricatives: intermediate values

4. **BLSNR as a diagnostic measure:** The 2-4 kHz band-limited SNR is a better indicator of aspiration noise than broadband SNR, because broadband SNR is confounded by jitter (especially for male speakers).

5. **H1-H2 and F1 interaction:** The correlation between H1-H2 and F1 was largely artifactual (one speaker effect). The H1-H2 measure is unreliable for high vowels where F1 is near H2.

### Time of Day Effects

Minimal effects on most measures. Male jitter was significantly higher in afternoon samples (0.136 ms vs 0.084 ms). No practical consequence for synthesis.

## Figures of Interest

- **Fig 1 (page 10):** F1 vs H1-H2 scatterplot for female speakers for /a/, showing one speaker (4F) as an outlier driving the F1-H1-H2 correlation

## Results Summary

- Consonantal context systematically shifts all six voice-source measures, with voiceless stops producing the greatest perturbation from neutral
- For men, SNR is dominated by jitter; for women, SNR reflects aspiration noise
- H1-H2 covaries with F0 for men but not women, suggesting different laryngeal strategies
- The relationship between spectral tilt (H1-H2) and aspiration noise (BLSNR) is negative for women (more tilt = more noise) but positive for men (confounded by jitter reduction), with partial correlations showing the negative relationship holds for both sexes once jitter is removed
- Vowel effects: /a/ has highest shimmer, lowest F0; /u/ has lowest BLSNR; /i/ has highest BLSNR

## Limitations

- Only 8 speakers (4M, 4F)
- Only CV syllables in a carrier phrase, not continuous speech
- H1-H2 measured only for /a/ (unreliable for /i/ and /u/ due to F1-H2 proximity)
- 10 pitch periods may be insufficient for stable jitter/shimmer estimates (authors acknowledge this but argue multiple tokens compensate)
- Inverse filtering with 22-coefficient LPC may not perfectly remove formant structure

## Testable Properties

- After voiceless stops, F0 should be higher than after voiced stops by approximately 7-10 Hz (men) or 14-16 Hz (women)
- After voiceless stops, SNR should be lower (more noise) than after voiced stops
- For female voices, H1-H2 should be approximately 2-4 dB higher than for male voices
- The ordering for SNR across consonant contexts should be: /d/ > /s/,/f/ > /t/,/k/
- Jitter for female voices should be substantially less than for male voices (roughly 0.03 ms vs 0.08-0.15 ms)
- BLSNR (2-4 kHz) should be lower for /u/ than for /i/ or /a/

## Relevance to Project

This paper provides empirical support for consonantal-context-dependent voice source rules in the Qlatt synthesizer. It justifies:
- Increasing AH (aspiration) and decreasing AV after voiceless consonants into the following vowel
- Using different source parameter profiles for male vs. female speaker presets (TL, AH, F0 relationships)
- The ordering voiceless stop > voiceless fricative > voiced stop for the magnitude of source perturbation
- Using BLSNR as a diagnostic metric for evaluating synthesized aspiration noise quality

The data directly supports and extends Klatt & Klatt (1990) findings that are already foundational to the project.

## Open Questions

- [ ] How far into the vowel do the consonantal context effects persist? (Gobl 1988 and Lofqvist & McGowan 1989 suggest well into the vowel for voiceless consonants)
- [ ] Would the consonant ordering hold in continuous speech (not just CV syllables)?
- [ ] What is the perceptual threshold for the aspiration noise differences reported here?

## Related Work Worth Reading

- **Klatt & Klatt (1990)** - Already in collection; the primary reference for voice quality parameters in synthesis
- **Gobl (1988)** - Consonantal context effects on excitation strength lasting into the vowel
- **Lofqvist & McGowan (1989)** - Voice source variations showing open quotient effects persist 20+ pitch periods after voiceless consonants
- **Milenkovic (1987)** - LMS measures of voice perturbation, calibration of jitter/shimmer/SNR measures
- **Monsen & Engebretson (1977)** - Male/female glottal wave variations

## Collection Cross-References

### Already in Collection
- [[Klatt_1990_VoiceQualityVariations]] — cited extensively; this paper's H1-H2, aspiration noise, and sex difference findings directly extend Klatt & Klatt's analysis and synthesis framework
- [[Fant_1960_AcousticTheorySpeechProduction]] — cited for source-filter interaction and the prediction that H1-H2 correlates positively with F1
- [[Fant_1985_LFModelGlottalFlow]] — cited for glottal flow modeling (four-parameter model)
- [[Peterson_Barney_1952_VowelControl]] — cited for F0 sex differences (~120-130 Hz men, ~220 Hz women)
- [[Shadle_1985_FricativeAcoustics]] — cited for intrinsic F0 of vowels in sentence context
- [[Rothenberg_1981_InteractiveVoiceSource]] — cited for acoustic source-filter interactions that change volume-velocity pulse shape independently of laryngeal adjustments

### Cited By (in Collection)
- (none found — collection papers cite other Nittrouer works but not this specific 1990 paper)

### New Leads (Not Yet in Collection)
- Gobl, C. (1988) — "Voice source dynamics in connected speech" STL-QPSR — consonantal context effects on excitation strength persisting into the vowel; critical for coarticulatory duration of source perturbation rules
- Lofqvist, A. & McGowan, R. S. (1989) — "Voice source variations in running speech" — open quotient effects persist 20+ pitch periods after voiceless consonants
- Monsen, R. & Engebretson, A. (1977) — "Study of variations in the male and female glottal wave" JASA 62 — complementary male/female glottal source data

### Conceptual Links (not citation-based)
- [[Klatt_1990_VoiceQualityVariations]] — Klatt & Klatt's TL parameter and AH parameter directly map to Nittrouer's H1-H2 and BLSNR measures respectively; Klatt & Klatt report female H1-H2 of 11.9 dB vs male 6.2 dB, while Nittrouer shows 3-6 dB vs 1-3 dB (different vowel contexts and measurement methods may explain the gap)
- [[Gobl_2003_VoiceQualityEmotion]] — Gobl's KLSYN88 voice quality parameter settings (especially breathy voice: increased AH, OQ) operationalize exactly the sex-differentiated source mechanisms Nittrouer identifies: women's voices having more aspiration noise and higher open quotients
- [[Burkhardt_2009_VoiceQualityFormantSynthesis]] — Burkhardt's formulas for modifying TL and AH to simulate breathy/whispery voice implement the spectral tilt and aspiration noise dimensions that Nittrouer's correlational analysis shows are related but partially independent
- [[Chen_2022_AcousticMasculinityFemininity]] — Chen's PCA finds jitter and shimmer clustering separately from HNR for female voices but HNR grouping with shimmer for males, which aligns with Nittrouer's finding that SNR indexes different noise sources for each sex (jitter for men, aspiration for women)
- [[Childers_Lee_1991_VoiceQualityFactors]] — addresses the same question of what voice source parameters differentiate male/female voice quality
