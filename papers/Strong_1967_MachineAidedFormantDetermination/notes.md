# Machine-Aided Formant Determination for Speech Synthesis

**Authors:** William J. Strong
**Year:** 1967
**Venue:** Journal of the Acoustical Society of America, Volume 41, Number 6, pp. 1434-1442
**DOI/URL:** Published by ASA

## One-Sentence Summary
This paper describes a semi-automatic "manual formant vocoder" system where a human operator marks formant positions on processed speech data to extract control parameters for a four-pole parallel synthesizer.

## Problem Addressed
How to extract detailed control parameters (formant frequencies, formant amplitudes, F0) from natural speech to guide speech synthesis by rule development, when automatic formant tracking was unreliable.

## Key Contributions
- Semi-automatic analysis-synthesis system combining machine processing with human decision-making
- Four-pole parallel synthesizer with amplitude modulation after (not before) the resonators
- Phase reversal on even-numbered poles to remove inter-formant zeros
- Intelligibility testing methodology using Griffiths' modified rhyme test
- Detailed error analysis categorizing confusions by manner, place, and voicing

## Methodology
1. **Analysis Stage:**
   - 2-sec speech samples digitized (5kHz low-pass, 10kHz sample rate)
   - 100 bandpass filter channels (40 cps bandwidth, centers at 40N-20 Hz)
   - Full-wave rectification + low-pass filtering
   - Synchronous sampling at 10 ms intervals → "narrow-band sections"
   - Cosine series expansion (100 coefficients) for smoothing
   - First 32 coefficients → "wide-band section" for display
   - Highest 60 coefficients → F0 estimation (cepstrum-like)

2. **Operator Decisions:**
   - CRT display of wide-band sections
   - Voltage knobs to position four poles
   - Sense-switch for noise excitation decision
   - Light pen for F0 curve modification

3. **Synthesis Stage:**
   - Four parallel resonators with independent amplitude control
   - Linear interpolation of parameters at 1 ms intervals
   - Pulse train (voiced) or noise (unvoiced) excitation

## Key Equations

**Resonator transfer function:**
$$P(s) = \frac{2as}{(s+a)^2 + \omega^2} \cdot \frac{\omega}{s+\omega}$$

Where:
- $a$ = half-bandwidth (Hz)
- $\omega$ = center frequency (rad/s)
- $s$ = frequency of interest (rad/s)

**Filter center frequencies:**
$$f_N = 40N - 20 \text{ cps}, \quad N = 1, 2, \ldots, 100$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Formant 1 frequency | F1 | cps | - | 20-4000 | Channel 1-100 mapping |
| Formant 2 frequency | F2 | cps | - | 20-4000 | |
| Formant 3 frequency | F3 | cps | - | 20-4000 | |
| Formant 4 frequency | F4 | cps | - | 20-4000 | |
| Formant 1 amplitude | A1 | dB | - | 0-62.5 | ¼ dB steps |
| Formant 2 amplitude | A2 | dB | - | 0-62.5 | |
| Formant 3 amplitude | A3 | dB | - | 0-62.5 | |
| Formant 4 amplitude | A4 | dB | - | 0-62.5 | |
| Fundamental frequency | F0 | cps | - | ~80-250 | Minus zero = noise |
| Bandwidth B1 (voiced) | B1 | cps | 70 | - | Fixed for voiced |
| Bandwidth B2 (voiced) | B2 | cps | 80 | - | Fixed for voiced |
| Bandwidth B3 (voiced) | B3 | cps | 100 | - | Fixed for voiced |
| Bandwidth B4 (voiced) | B4 | cps | 140 | - | Fixed for voiced |
| Bandwidth B1 (unvoiced) | B1 | cps | 100 | - | Fixed for noise |
| Bandwidth B2 (unvoiced) | B2 | cps | 150 | - | Fixed for noise |
| Bandwidth B3 (unvoiced) | B3 | cps | 200 | - | Fixed for noise |
| Bandwidth B4 (unvoiced) | B4 | cps | 250 | - | Fixed for noise |
| Analysis frame rate | - | ms | 10 | - | |
| Synthesis interpolation | - | ms | 1 | - | Linear interpolation |
| Analysis bandwidth | - | cps | 40 | - | 3 dB points |

## Implementation Details

### Analysis Pipeline
1. Digitize speech at 10 kHz (5 kHz low-pass filtered)
2. Process through 100 parallel bandpass filters (40 Hz BW each)
3. Full-wave rectify each channel
4. Low-pass filter (max detection over 10 ms interval)
5. Convert to dB (¼ dB resolution)
6. Compute 100 cosine coefficients of the narrow-band section
7. Use first 32 coefficients for wide-band section (smoothed spectrum)
8. Use highest 60 coefficients for F0 detection (cepstrum method)

### Synthesizer Architecture
```
                    ┌─────────┐
                    │  F1     │──[A1]──┐
                    │ Filter  │        │
    ┌───────────┐   ├─────────┤        │
    │ Excitation│───│  F2     │─[-A2]──┼──[+]── OUTPUT
    │ Generator │   │ Filter  │        │
    │  (F0)     │   ├─────────┤        │
    └───────────┘   │  F3     │──[A3]──┤
         │         │ Filter  │        │
         │         ├─────────┤        │
    ┌─────────┐    │  F4     │─[-A4]──┘
    │Bandwidth│────│ Filter  │
    │Generator│    └─────────┘
    └─────────┘
```

**Key design choices:**
- Amplitude modulation AFTER poles (not before, as more common)
- Phase reversal on even-numbered poles (F2, F4) to remove inter-formant zeros
- No explicit zeros in the model
- All four formants have zeros at the origin in the reported configuration

### Excitation
- F0 positive: pulse train with flat spectrum
- F0 = minus zero: noise with flat spectrum
- Binary voiced/unvoiced decision (no mixed excitation)

## Figures of Interest
- **Fig. 1 (page 2):** Block diagram of the complete analysis system
- **Fig. 2 (page 3):** CRT display of a narrow-band section showing harmonic structure
- **Fig. 3 (page 4):** CRT display of wide-band sections with operator-placed poles
- **Fig. 4 (page 4):** Raw F0 contour with instabilities in weak voicing regions
- **Fig. 5 (page 5):** Modified F0 contour after light-pen correction
- **Fig. 6 (page 5):** Complete control parameters (F1-F4, A1-A4) for "Robby will like you daddy-oh"
- **Fig. 7 (page 6):** Block diagram of the four-pole parallel synthesizer
- **Fig. 8 (page 6):** Spectrogram comparison - natural vs synthetic "Robby will like you daddy-oh"
- **Fig. 9 (page 7):** Spectrogram comparison - natural vs synthetic "Joe took father's shoe bench out"

## Results Summary

**Intelligibility Test Results (Griffiths' modified rhyme test):**

| Category | Errors | Total | Error Rate |
|----------|--------|-------|------------|
| Vowels | 21 | 500 | 4.2% |
| Initial consonants | 99 | 500 | 19.8% |
| Final consonants | 70 | 500 | 14.0% |
| **All consonants** | **169** | **1000** | **16.9%** |

**Error Analysis:**
- Most consonant errors are in **manner** (fricatives → stops)
- Place errors: back consonants → middle/front
- Very few voicing errors despite some voicing decision errors in control signals
- Labiodental/dental confusions (v/ð, f/θ) also occur in natural speech

## Limitations
1. **Too little low-frequency energy** in voiced sounds (suggests removing first-formant zero at origin)
2. **Slow filter response time** obscures transient consonant features
3. **Unreliable voiced/unvoiced decision** in weak voicing regions (requires manual correction)
4. **Only four poles** - nasals need a fifth pole for realistic modeling
5. **No zeros** in the synthesizer (perceptually significant for nasals, laterals)
6. **Abrupt F1 transitions** for nasals - should be smooth crossfade between vowel and nasal poles
7. **Binary excitation** - no mixed voiced+noise excitation

## Relevance to Project

### Direct Applications to Qlatt:
1. **Parallel synthesizer rationale:** Strong provides three reasons to prefer parallel over cascade:
   - Cascade needs special circuitry for consonants; parallel handles consonants and vowels uniformly
   - No cumulative overflow in digital implementation
   - Pole movement noise is masked (parallel) vs enhanced (cascade)

2. **Phase reversal technique:** Inverting even-numbered pole outputs removes inter-formant zeros - could be relevant if Qlatt's parallel branch has spectral tilt issues

3. **Bandwidth values:** The fixed bandwidth sets (70/80/100/140 Hz voiced, 100/150/200/250 Hz unvoiced) are simpler than Klatt's formulas but provide a baseline

4. **Manner error analysis:** The finding that fricatives are often perceived as stops suggests amplitude transitions and possibly noise timing are critical

### Contrast with Klatt (1980):
- Strong uses pure parallel; Klatt uses cascade for vowels + parallel for consonants
- Strong has no explicit zeros; Klatt has antiresonators for nasals
- Strong has binary voicing; Klatt has mixed excitation (AV, AH, AF independent)
- Strong has fixed bandwidths; Klatt has parameterized bandwidths

## Open Questions
- [ ] Would phase reversal on even-numbered parallel branch formants improve Qlatt?
- [ ] Are the bandwidth values (70/80/100/140 Hz) comparable to typical Klatt values?
- [ ] Could the "too little low-frequency energy" problem relate to our cascade/parallel routing?

## Related Work Worth Reading
- Holmes, Mattingly, and Shearme (1964) - "Speech Synthesis by Rule" - Language and Speech 7, 127-143
- Noll (1964) - "Short-Time Spectrum and 'Cepstrum' Techniques for Vocal Pitch Detection" - JASA 36, 296-302
- Schroeder and Noll (1965) - "Recent Studies in Speech Research at Bell Telephone Laboratories" - Proceedings of the Fifth International Congress of Acoustics
- Griffiths (1966) - "Further Rhyme-Test Modification for Diagnostic Articulation Testing" - JASA 40, 1256(A)
