# Vowel Perception: The Relative Perceptual Salience of Selected Acoustic Manipulations

**Authors:** R. Carlson, B. Granström, D. Klatt
**Year:** 1979
**Venue:** STL-QPSR (Speech Transmission Laboratory - Quarterly Progress and Status Report), Volume 20, Number 3-4, pp. 73-83
**URL:** http://www.speech.kth.se/qpsr

## One-Sentence Summary
This paper quantifies the relative perceptual importance of formant frequencies, bandwidths, spectral tilt, and harmonic phase for vowel perception, providing empirical psychophysical distance scores that can guide synthesizer parameter priorities.

## Problem Addressed
When designing synthetic vowels, many acoustic parameters can be manipulated. This study determines which parameters produce the largest perceptual changes, helping synthesizer designers know where to focus effort and which parameters can be approximated.

## Key Contributions
- Quantified perceptual salience hierarchy: **formant frequency > spectral tilt > amplitude > bandwidth**
- Demonstrated that **random phase** in harmonics produces harsh "aperiodic" quality with highest perceptual distance (score 10)
- Showed that **bandwidth changes are perceptually less important** than formant frequency changes (at least 20× less sensitive)
- Found that **low-frequency harmonics** (1st and 2nd) dominate pitch and quality perception
- Established that spectral notches between formants have minimal perceptual effect until very wide (900+ Hz)

## Methodology
- 66 synthetic vowels similar to /ae/ generated using an "additive harmonic synthesizer"
- 300-trial randomized listening test with 8 subjects
- Subjects rated perceptual distance (0-10 scale) between stimulus and reference
- Reference stimulus: F1-F5 = 700, 1800, 2500, 3300, 3700 Hz; B1-B5 = 60, 140, 150, 200, 250 Hz
- Spectral tilt: -6 dB per octave (DBO parameter)

## Key Equations

No formal equations presented. Key quantitative relationships:

**Formant frequency JND:**
$$
\text{JND}_{F1/F2} \approx 3\%
$$
(Flanagan, 1957)

**Perceptual distance scaling:**
- 0 = identical
- 10 = maximally different stimulus
- ~0.5 = significance threshold (p < 0.05)

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| F0 (fundamental) | F0 | Hz | 100-125 | time-varying | Rising onset 110→125 Hz |
| Formant 1 | F1 | Hz | 700 | - | Reference /ae/ |
| Formant 2 | F2 | Hz | 1800 | - | Reference /ae/ |
| Formant 3 | F3 | Hz | 2500 | - | Reference /ae/ |
| Formant 4 | F4 | Hz | 3300 | - | Reference /ae/ |
| Formant 5 | F5 | Hz | 3700 | - | Reference /ae/ |
| Bandwidth 1 | B1 | Hz | 60 | - | Reference |
| Bandwidth 2 | B2 | Hz | 140 | - | Reference |
| Bandwidth 3 | B3 | Hz | 150 | - | Reference |
| Bandwidth 4 | B4 | Hz | 200 | - | Reference |
| Bandwidth 5 | B5 | Hz | 250 | - | Reference |
| Spectral tilt | DB0 | dB/octave | -6 | - | Source + radiation combined |
| Voicing amplitude | AV | dB | 48→60→54→0 | time-varying | Vowel envelope |
| Duration | - | ms | 305 | - | Total stimulus length |

## Implementation Details

### Additive Harmonic Synthesizer
The study used an "additive harmonic synthesizer" rather than a cascade formant synthesizer because:
- Direct control over amplitude and phase of each harmonic
- Can create stimuli impossible with standard formant synthesizers
- Produces "roughly the same waveform as a formant synthesizer"

### Stimulus Timing
```
Time:  0    70   140   300   305 ms
F0:   110  125  125   100   Hz
AV:    48   60   60    54    0 dB
```
Linear interpolation between control points.

### Perceptual Distance Normalization
- Each subject's responses normalized to mean=2.73, variance=5.78
- Scale factors chosen so reference vs. itself = 0, most different = ~10

## Figures of Interest

- **Fig IV-B-1 (page 6):** 12-panel summary of all perceptual experiments:
  - Panel A: F1 or F2 alone (8% change → distance ~3)
  - Panel B: F1 and F2 together (8% change → distance ~4)
  - Panel C: All formants + vocal tract length (8% change → distance ~5.5)
  - Panel D: B1 or B2 alone (40% change → distance <1)
  - Panel E: All bandwidths with amplitude compensation
  - Panel F: AV amplitude changes
  - Panel G-I: Spectral notches at different locations
  - Panel J: Spectral tilt manipulation
  - Panel K: Vocal tract transfer function phase
  - Panel L: Random voicing source phase (HIGHEST DISTANCE)

- **Fig IV-B-2 (page 12):** Critical band spectra comparing reference and telephone-bandwidth stimuli

## Results Summary

### Hierarchy of Perceptual Salience (normalized distance for comparable % changes):

| Manipulation | Distance Score | Notes |
|-------------|----------------|-------|
| Random harmonic phase | **10** | Harsh, aperiodic quality |
| Negative VT phase (exponential growth) | **6.9** | |
| Zero VT phase (impulse-like) | **5.9** | Large peak factor |
| All formant frequencies (8%) | ~5.5 | Vocal tract length change |
| F1+F2 together (8%) | ~4 | |
| Single formant F1 or F2 (8%) | ~3 | |
| Telephone bandwidth filtering | **8.9** | 300-3000 Hz passband |
| Spectral notch at low freq | **variable** | Most effect on 1st/2nd harmonic |
| Spectral tilt (2 dB/kHz) | ~2.5 | |
| Bandwidth changes (40%) | <1 | **Minimal perceptual effect** |
| AV amplitude (20%) | ~2 | |

### Key Findings:

1. **Formant frequency dominates**: The auditory system is more sensitive to formant frequency shifts than spectral tilt changes.

2. **Bandwidth is nearly irrelevant**: A 40% bandwidth change produces less perceptual distance than a 4% formant frequency change. The JND for B1 is ~10%, but this is 3× the JND for formant frequency.

3. **Low harmonics critical**: Attenuation of the first one or two harmonics has the greatest perceptual effect of any manipulation. Removing energy above 3kHz has only moderate effect.

4. **Phase matters for quality, not identity**: Random phase produces harsh "aperiodic" quality but the vowel identity remains. This implicates **temporal processing** of neural spike timing for pitch perception.

5. **Spectral valleys unimportant**: Spectral notches between formants have minimal effect until >900 Hz wide and capturing harmonics near a formant peak.

## Limitations
- Only tested /ae/ vowel - results may differ for vowels with closer formants
- Small number of subjects (8)
- Did not test F3, F4, F5 independently
- Phase manipulations used specific patterns; random phase results may depend on particular random values chosen

## Relevance to Project

**Direct implications for Qlatt synthesizer:**

1. **Parameter priority**: Focus accuracy on F1, F2, F3 frequencies. Bandwidth values (B1-B5) can use rough defaults with minimal perceptual cost.

2. **Spectral tilt less critical**: The -6 dB/octave default tilt doesn't need fine-tuning for basic vowel quality.

3. **Phase coherence matters**: The LF-source glottal model should maintain consistent phase relationships. Avoid random-phase noise in the voicing source.

4. **Critical band filtering**: For perceptual evaluation, consider implementing a critical band analyzer (per Paterson 1976 data) as shown in Fig IV-B-2.

5. **Low-frequency sensitivity**: Pay special attention to accurate F0 and first few harmonics - these drive both pitch and quality perception.

## Open Questions
- [ ] Would these findings hold for vowels with closer F1-F2 (like /i/, /u/)?
- [ ] What is the exact relationship between bandwidth JND and formant frequency JND for different vowels?
- [ ] How do these perceptual priorities change in running speech vs. isolated vowels?

## Related Work Worth Reading
- Carlson & Granström (1976) - Earlier work on spectral slope discriminability
- Flanagan (1957) - JND measurements for vowel formants
- Fant (1960) - Acoustic Theory of Speech Production
- Klatt (1976) - Digital filter bank for spectral matching
- Klatt (1979a) - HARSYN additive harmonic synthesis documentation
- Klatt (1979c) - Speech perception model
- Zwicker & Feldtkeller (1967) - Critical band theory
- Paterson (1976) - Auditory filter shape measurements
