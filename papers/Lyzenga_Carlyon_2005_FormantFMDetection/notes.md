# Detection, Direction Discrimination, and Off-Frequency Interference of Center-Frequency Modulations and Glides for Vowel Formants

**Authors:** J. Lyzenga, R. P. Carlyon
**Year:** 2005
**Venue:** Journal of the Acoustical Society of America, Vol. 117, No. 5, May 2005, pp. 3042-3053
**DOI:** 10.1121/1.1882943

## One-Sentence Summary

Place-of-excitation cues dominate formant frequency-change detection and direction discrimination for natural-like formants, while off-frequency formant modulations can interfere with both tasks, implying that coarticulation cues are vulnerable to disruption by concurrent formant movements.

## Problem Addressed

Prior work (Lyzenga & Carlyon 1999, 2000) established that listeners detect sinusoidal formant-frequency modulation using place, AM-depth, and beating cues, and that off-frequency modulated formants can interfere (FMDI). This paper extends the investigation to:
1. Linear formant glides (more speech-realistic than sinusoidal FM)
2. Direction discrimination (more speech-relevant than mere detection)
3. FMDI for direction discrimination (not previously tested)

## Key Contributions

1. **FMTs for linear formant glides** are ~31% larger than for sinusoidal FM, attributable to frequency roving uncertainty and reduced effective glide extent from stimulus tapering.
2. **Direction discrimination thresholds approximately equal detection thresholds** for formants with multiple resolved harmonics (i.e., natural-like formants). Listeners can identify formant movement direction as soon as they detect the movement.
3. **Exceptions** occur for stimuli with only 1-2 harmonics: direction discrimination can be much harder than detection because AM-depth and beating cues do not encode direction.
4. **FMDI extends to direction discrimination**: an off-frequency modulated formant disrupts both detection and direction identification of a target formant's movement.
5. **FMDI is larger for shallow spectral slopes** (50 dB/oct, spanning many harmonics) than steep slopes (200 dB/oct, few harmonics).

## Stimulus Parameters

### Formant Construction
- Band-limited harmonic tones with triangular spectral envelopes (log-log scale)
- Spectral slopes: **50 dB/oct** (broad, many harmonics) or **200 dB/oct** (narrow, few harmonics)
- F0: **80 Hz** or **240 Hz**
- Three frequency regions: LOW (~500 Hz), MID (~1500 Hz), HIGH (~3000 Hz)
- Center frequency either on a harmonic or midway between two harmonics
- Duration: 200 ms (plus 25-ms raised-cosine ramps)
- Background: continuous pink noise, spectrum level 0 dB at 1 kHz
- Presentation level: 30 dB above threshold in pink noise (~46-47 dB SL)

### Center Frequencies Used
| Region | F0=80 Hz, on harmonic | F0=80 Hz, between | F0=240 Hz, on harmonic | F0=240 Hz, between |
|--------|----------------------|-------------------|----------------------|-------------------|
| LOW    | 480 Hz               | 520 Hz            | 480 Hz               | 600 Hz            |
| MID    | 1440 Hz              | 1560 Hz           | 1440 Hz              | 1560 Hz           |
| HIGH   | 2960 Hz              | 3000 Hz           | 2880 Hz              | 3000 Hz           |

### Modulation Parameters
- Sinusoidal FM: 5-Hz rate, single cycle in 200-ms window
- Linear FM: constant-rate glide over full 250-ms duration, with +/-160 Hz frequency rove
- Rove spans: ~62% (LOW), ~21% (MID), ~11% (HIGH) -- prevents use of endpoint cues
- FMDI interferers: 10-Hz rate (2 cycles in 200 ms), amplitude = 4x detection threshold

## Key Results

### Experiment 1: FM Detection Thresholds (FMTs)

**Sinusoidal FM FMTs** (zero-to-peak, expressed as % of center frequency):
- Shallow slopes (50 dB/oct): dominated by **place-of-excitation cues** across all conditions
- Steep slopes (200 dB/oct): different cues dominate depending on F0 and harmonic alignment:
  - On harmonic: place or AM cues
  - Between harmonics: place or beating cues

**Linear FM FMTs** are larger than sinusoidal FMTs by a factor related to a 31% increase in the internal detection thresholds used by the place and AM-depth models. The beating cue was not useful for linear FM due to frequency roving.

**Dominant cue table (Table I):**
- For 50 dB/oct slope: Place cues (P) dominate in nearly all conditions for both sinusoidal and linear FM
- For 200 dB/oct slope: Mix of Place (P), AM (A), and Beating (B) cues for sinusoidal FM; mostly Place (P) and AM (A) for linear FM

### Experiment 1: Direction Discrimination

- For most conditions: **dFMT/FMT ratio near 1.0** -- listeners identify direction as soon as they detect modulation
- Elevated ratios (dFMT >> FMT) occur for steep-slope stimuli where only 1-2 harmonics are within the formant:
  - These stimuli produce symmetrical AM patterns (beating at F0 rate) that signal FM presence but not direction
  - Worst case: F0=240 Hz, LOW region, 200 dB/oct slope -- dFMT approximately 30x the FMT

### Experiment 2: FMDI (Frequency Modulation Detection Interference)

- Signal formant in MID region, interferer in HIGH region
- Both formants have same spectral slope (50 or 200 dB/oct)
- FMDI ratio (threshold with interferer / threshold without):
  - **Shallow slope (50 dB/oct): consistent FMDI across conditions** (average ratio ~1.54)
  - **Steep slope (200 dB/oct): inconsistent, smaller FMDI** (average ratio ~1.24)
  - Overall significant effect of slope on FMDI (p < 0.05)
- FMDI slightly larger for same-F0 interferers than different-F0 (1.43 vs 1.33, not significant)
- **No significant effect of task (detection vs direction discrimination) on FMDI amount**
- FMDI slightly larger for sinusoidal FM (1.51) than linear glides (1.26), not significant

## Hybrid Auditory Model

### Architecture
Three sub-models combined by summing d' values in quadrature (square root of sum of squares):

1. **Modified Place Model** (Lyzenga & Horst 1997):
   - Roex filter bank: 3400 filters, Q=5 (Patterson & Moore 1986)
   - Log spacing above 800 Hz, linear below
   - Excitation patterns compared between two "looks" at stimulus (max positive and negative FC excursion)
   - Detection threshold: **5.6 dB** (sinusoidal FM), **7.3 dB** (linear FM, 31% larger)
   - For reference: original frequency discrimination task used 2 dB threshold

2. **AM-Depth Detection Model**:
   - Same Roex filter bank
   - Hilbert transform extracts temporal envelope in channel at FC and largest-component channels
   - Compares modulation depth to threshold
   - Thresholds: **45% at 5 Hz, 25% at 10 Hz** (sinusoidal FM); 31% larger for linear FM
   - Consistent with Lee & Bacon (1997) and Viemeister (1979) AM detection data

3. **Beating Detector** (Lyzenga & Horst 1997, "temporal model"):
   - Detects sharp zero crossings in temporal envelope (within-channel beating at F0 rate)
   - Uses second derivative of Hilbert envelope
   - Threshold: reduction of average peak to **15% of original value**
   - Only relevant for sinusoidal FM; not useful for linear FM (frequency rove disrupts)

### Model Predictions
- Place cues dominate for shallow spectral slopes (natural-like formants)
- AM and beating cues only relevant for steep slopes with few harmonics
- The 31% threshold increase for linear vs sinusoidal FM reflects: (a) frequency rove uncertainty, (b) reduced effective glide extent from stimulus tapering

## Implications for Speech Perception and Synthesis

### Coarticulation Vulnerability
- Formant transitions associated with coarticulation (e.g., F2 locus transitions into/out of consonants) can be disrupted by simultaneous formant changes in other frequency regions
- This applies both within the same speech signal (different formants changing simultaneously) and from competing speech

### Missing Formant Problem
- For high F0 and narrow formants, formant peaks may not coincide with any harmonic
- Direction discrimination thresholds can be extremely elevated (30x detection threshold) for such "missing formants"
- The auditory system genuinely cannot extract formant frequency direction for such stimuli
- Supports models that down-weight or ignore missing formant information (de Cheveigne & Kawahara 1999; Hillenbrand & Houde 2003)

### Relevance to Klatt Synthesis
1. **Formant transition rates**: Place-of-excitation cues dominate, so transitions must produce sufficient spectral peak shift to be perceptible. The FMT data provide lower bounds on perceptible formant movement.
2. **F0 interaction**: At high F0 (e.g., female/child voices with F0 near 240 Hz), formant perception degrades, especially for narrow-bandwidth formants in the LOW region. Synthesis of high-F0 voices may need wider bandwidths or other compensation.
3. **Spectral slope matters**: Broader formants (lower spectral slopes) are more robustly perceived via place cues and more susceptible to FMDI. Narrow formants rely on less reliable temporal cues.
4. **Transition direction is free**: For well-resolved formants, direction discrimination comes "for free" with detection -- no extra acoustic contrast needed to signal transition direction.

## Collection Cross-References

### Already in Collection
- [[Hillenbrand_1995_VowelAcoustics]] — Hillenbrand provides updated formant measurements (F0-F4) for 12 American English vowels across 139 speakers; this paper's FMT data provides the perceptual lower bounds on formant frequency change detection that complement Hillenbrand's production data.
- [[Peterson_Barney_1952_VowelControl]] — canonical vowel formant measurements; this paper's finding that formant direction discrimination is "free" for well-resolved harmonics applies to the formant regions Peterson & Barney documented.

### Cited By (in Collection)
- (none found)

### Conceptual Links (not citation-based)
- [[Kent_Vorperian_2018_VowelFormantBandwidths]] — **Strong.** Kent provides formant bandwidth data that directly affects this paper's predictions: wider bandwidths (shallower spectral slopes) mean more harmonics within formant peaks, favoring place-of-excitation cues and making direction discrimination easier but also increasing FMDI susceptibility.
- [[Ohman_1966_CoarticulationVCV]] — **Moderate.** Ohman's locus theory of coarticulation involves F2 transitions between consonant loci and vowel targets. This paper shows that such transitions are vulnerable to interference from simultaneous formant movements (FMDI), suggesting coarticulatory cues may be degraded in contexts with concurrent F3/F4 changes.
- [[Fant_1960_AcousticTheorySpeechProduction]] — **Moderate.** Fant's acoustic theory provides the formant structure that this paper's psychoacoustic model analyzes. The spectral slope parameter (50 vs 200 dB/oct) directly relates to Fant's formant bandwidth predictions.
- [[Stevens_House_1956_FormantTransitionsVocalTract]] — **Moderate.** Stevens & House analyze how vocal tract configuration produces formant transitions; this paper quantifies the perceptual limits on detecting and discriminating those transitions.

## References Worth Following

- **Lyzenga & Carlyon (1999)** - JASA 105: Original FMDI study for vowel formants. Establishes the interference phenomenon and the hybrid model.
- **Lyzenga & Carlyon (2000)** - JASA 108: Binaural FMDI study. Shows interference has a central component.
- **Lyzenga & Horst (1997)** - JASA 102: Single-formant frequency discrimination. Source of the place model and beating detector.
- **Lyzenga & Horst (1998)** - JASA 104: Two-formant frequency discrimination. Shows parallel formant changes lower thresholds.
- **Mermelstein (1978)** - JASA 63: Formant frequency DLs for steady and consonant-bound vowels.
- **Hawks (1994)** - JASA 95: Formant pattern DLs showing combined formant changes help.
- **de Cheveigne & Kawahara (1999)** - JASA 105: Missing-data vowel identification model.
- **Hillenbrand & Houde (2003)** - JASA 113: Narrow-band pattern matching vowel model.
