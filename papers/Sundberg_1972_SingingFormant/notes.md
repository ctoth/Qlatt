# An Articulatory Interpretation of the 'Singing Formant'

**Authors:** Johan Sundberg
**Year:** 1972
**Venue:** STL-QPSR (Speech Transmission Laboratory - Quarterly Progress and Status Report), Vol. 13, No. 1, pp. 45-53
**Institution:** Dept. for Speech, Music and Hearing, KTH Stockholm
**URL:** http://www.speech.kth.se/qpsr

## One-Sentence Summary

The "singing formant" (~3 kHz spectral peak in professional male singing) arises from the larynx tube acting as a Helmholtz resonator when the larynx is lowered, creating an extra formant (F4) between the normal F3 and F4 of speech.

## Problem Addressed

Professional singers produce a characteristic spectral peak near 3 kHz (the "singing formant") that allows their voice to project over an orchestra. This paper explains the articulatory and acoustic mechanisms that generate this phenomenon.

## Key Contributions

1. Demonstrates that five formants below 3 kHz are required to synthesize the singing formant
2. Shows that lowered larynx causes the larynx tube to act as a separate Helmholtz resonator
3. Identifies the sinus piriformes as creating a transfer function zero (spectral notch) at 3-4 kHz
4. Provides quantitative equations for calculating resonance frequencies

## Methodology

- X-ray tomograms of trained bass singers (speech vs singing)
- Acoustic tube model experiments
- Comparison of formant frequencies in speech (Fant et al. 1969) vs singing (Sundberg 1968)

## Key Findings

### Articulatory Differences (Speech vs Singing)

| Feature | Speech | Singing |
|---------|--------|---------|
| Larynx position | Normal | Lowered |
| Jaw opening | Normal | Larger |
| Tongue tip (back vowels) | Normal | Advanced |
| Lip protrusion (front vowels) | Normal | Excessive |

### Formant Frequency Compression in Singing

In singing, five formants appear below the frequency of the fourth formant in normal speech:
- F4 in singing ≈ 2.8 kHz (from larynx tube resonance)
- F5 in singing ≈ F4 in speech (~3.5 kHz)
- F2 and F3 lowered in front vowels
- F3 slightly raised in back vowels

## Key Equations

### Helmholtz Resonator Frequency (Larynx Tube)

$$
f = \frac{c}{2\pi} \cdot \sqrt{\frac{A_n}{V \cdot \ell_{n,e}}}
$$

Where:
- $c$ = speed of sound (~35,000 cm/s)
- $A_n$ = cross-sectional area of the neck (larynx tube opening)
- $V$ = volume (sinus Morgagni)
- $\ell_{n,e}$ = effective length of the neck

### Effective Neck Length (Ingard 1953)

$$
\ell_{n,e} = \ell_n + 0.48 \sqrt{A} \cdot (1 - 1.25\sqrt{A_n/A})
$$

Where:
- $\ell_n$ = physical length of the neck
- $A$ = cross-sectional area of the larger tube (pharynx)
- $A_n$ = cross-sectional area of the neck

### Sinus Piriformes Zero Frequency (Quarter-Wave Resonator)

$$
f = \frac{c}{4 \cdot \ell_e}
$$

Where:
- $\ell_e$ = effective length of the tube
- $\ell_e = \ell + 0.7\sqrt{A/\pi}$ (end correction)

## Parameters

| Parameter | Symbol | Value | Units | Notes |
|-----------|--------|-------|-------|-------|
| Sinus Morgagni volume | V | ~0.5 | cm³ | From tomograms, lowered larynx |
| Larynx tube length | ℓn | ~2 | cm | Roughly cylindrical |
| Larynx tube cross-section | An | ~0.5 | cm² | Opening area |
| Larynx tube resonance | f | ~2.8-2.9 | kHz | Calculated and measured |
| Sinus piriformes depth | ℓ | ~2 | cm | Each pocket |
| Sinus piriformes area | A | 1-2 | cm² | Cross-sectional |
| Piriformes zero frequency | f | 3-4 | kHz | Creates spectral notch |
| Pharynx cross-section | A | ≥6 | cm² | Required for separate resonator |
| Spectrum gain at 3 kHz | - | ~20 | dB | Sung vs spoken [u] |

## Critical Condition for Singing Formant

The larynx tube acts as a separate resonator **only when**:
$$
A_n < \frac{A}{6}
$$

Where $A_n$ is larynx tube opening area and $A$ is pharynx cross-sectional area.

This means: **pharynx must be at least 6x wider than larynx tube opening**.

## Implementation Details

### For Formant Synthesizer (Klatt-style)

To simulate singing formant:

1. **Add extra formant F4** at ~2.8 kHz (between normal F3 and F4)
   - This represents the larynx tube Helmholtz resonance
   - Relatively stable across vowels (articulation-independent)

2. **Compress higher formants**:
   - Normal F4 (~3.5 kHz) becomes F5
   - Normal F5 (~4.5 kHz) becomes F6

3. **Add spectral zero** at ~3.5-4 kHz (from sinus piriformes)
   - Creates characteristic notch above singing formant peak

4. **Adjust existing formants**:
   - F2 lowered in front vowels (pharynx lengthening)
   - F3 raised in back vowels (tongue tip advancement)
   - F1 raised (larger jaw opening)

### Pitch Compensation

At higher pitches:
- Larynx tube opening increases (vocal fold movement)
- Must compensate by: lowering larynx more, widening sinus Morgagni
- This explains need for "covering" high notes

## Figures of Interest

- **Fig. III-C-1 (page 46):** Spectra of [u] spoken vs sung - shows 20 dB difference at 3 kHz
- **Fig. III-C-2 (page 47):** Formant frequencies for all Swedish vowels, speech (dashed) vs singing (solid) - shows formant compression
- **Fig. III-C-3 (page 48):** Tomogram tracings showing larynx high vs low for [a] and [i]
- **Fig. III-C-4 (page 50):** Volume vs neck area for Helmholtz resonator at 2.8 kHz
- **Fig. III-C-5 (page 51):** Zero frequency vs sinus piriformis depth
- **Fig. III-C-6 (page 52):** Formant frequencies with/without sinus piriformes simulation
- **Fig. III-C-7 (page 53):** Spectrum envelope changes from each component

## Results Summary

The singing formant is generated by:
1. **Larynx tube resonance** (~2.8 kHz) - creates spectral peak (Helmholtz resonator effect)
2. **Sinus piriformes** (~3.5-4 kHz) - creates spectral notch (quarter-wave zero)
3. **Combined effect** - ~20 dB gain at 3 kHz region

All effects are secondary consequences of **lowering the larynx**.

## Limitations

- Study based on male bass singers only
- Tube model simplified (no subglottal coupling, no soft tissue damping)
- Individual anatomical variation not fully characterized
- Did not simulate pharynx lengthening in all model experiments

## Relevance to Qlatt Project

### Direct Implementation

For singing voice synthesis, could add:
- Extra F4 resonator at ~2.8 kHz (narrow bandwidth)
- Transfer function zero at ~3.5-4 kHz
- Modified formant targets for "sung" vowels

### Broader Insight

- Confirms importance of coupling between larynx and pharynx
- Shows how vocal tract geometry affects higher formants
- Provides physical basis for "voice quality" modifications beyond basic vowels

### Not Needed for Speech TTS

The singing formant is specific to trained operatic singing - not present in normal speech. However, understanding may help with:
- Projecting/calling voice styles
- Voice quality variations
- Understanding F4/F5 behavior

## Open Questions

- [ ] How would this apply to female singers? (Higher F0, different anatomy)
- [ ] What bandwidth should the "singing formant" resonator have?
- [ ] How does this interact with subglottal resonances?

## Related Work Worth Reading

- Fant, G. (1970): Acoustic Theory of Speech Production (2nd ed.) - comprehensive vocal tract acoustics
- Lindblom & Sundberg (1971): "Acoustical Consequences of Lip, Tongue, Jaw and Larynx Movement" - formant perturbation theory
- Sundberg (1970a): "The Level of the 'Singing Formant' and the Source Spectra of Professional Bass Singers" - more detail on singing formant
- Ingard (1953): "On the Theory and Design of Acoustic Resonators" - Helmholtz resonator theory
