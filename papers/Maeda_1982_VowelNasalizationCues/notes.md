# Acoustic Cues for Vowel Nasalization: A Simulation Study

**Authors:** Shinji Maeda
**Year:** 1982
**Venue:** J. Acoust. Soc. Am. 72, S102 (104th Meeting abstract)
**DOI:** https://doi.org/10.1121/1.2019690

## One-Sentence Summary
Simulation study showing that the primary acoustic cue for vowel nasalization is spectral flattening in the 300-2500 Hz range caused by nasal coupling.

## Problem Addressed
Identifying the acoustic cues that signal vowel nasalization - what spectral changes make a vowel sound nasalized?

## Key Contributions
- Demonstrated that nasal sinus cavities (modeled as a side branch) are essential for natural-sounding nasalized vowels
- Identified **spectral flattening** (300-2500 Hz) as the principal cue for nasalization perception
- Showed this effect is consistent across all 11 French vowels tested

## Methodology
1. Vocal tract simulation with side cavity representing nasal sinuses connected to main nasal tract
2. Varied degree of nasal coupling parametrically
3. Computed vocal-tract transfer functions for 11 French vowels
4. Converted transfer functions to pseudo-auditory excitation patterns
5. Correlated spectral changes with perceptual nasalization

## Key Findings

### Spectral Flattening Effect
- Nasal coupling causes **flattening of excitation patterns** across 300-2500 Hz
- This flattening is consistent across all vowel qualities
- Vowels with flattened spectra are perceived as nasalized

### Role of Sinus Cavities
- Adding a side cavity (nasal sinuses) to the model produces naturally-sounding nasalization
- Reference: Maeda, "The role of the sinus cavities in the production of nasal vowels," Proc. IEEE ICASSP82, Paris, 911-914 (1982)

## Parameters

| Name | Symbol | Units | Value/Range | Notes |
|------|--------|-------|-------------|-------|
| Spectral flattening range | - | Hz | 300-2500 | Primary cue region |
| Vowels tested | - | - | 11 French vowels | Full inventory |
| Coupling magnitude | - | - | Variable | Arbitrary values possible in simulation |

## Implementation Notes

For Klatt synthesizer nasalization:
- The AN (amplitude of nasalization) parameter controls nasal coupling
- Key insight: nasalization isn't just about adding a nasal formant - it's about **broadband spectral flattening**
- The 300-2500 Hz range covers F1 through much of F2/F3 territory
- Flattening means reduced peak-to-valley contrast in formant regions

### Practical Implications for Synthesis
1. Nasal pole-zero pairs should create spectral flattening effect
2. The flattening should extend across multiple formant regions
3. Simply adding nasal resonance without anti-resonances won't sound natural

## Limitations
- This is a conference abstract - full details in the ICASSP82 paper
- Simulation only - no acoustic measurements of real speech
- French vowels only - may not generalize to all languages

## Relevance to Qlatt Project
- Informs how AN parameter should affect spectrum
- Suggests checking if current nasalization implementation creates appropriate spectral flattening
- May need to verify nasal pole-zero placement creates the 300-2500 Hz flattening effect

## Related Work Worth Reading
- **Maeda 1982 ICASSP** - "The role of the sinus cavities in the production of nasal vowels" (full paper with details)
- Chen 1997 - Nasalized vowel acoustics (already in papers/)

## Open Questions
- [ ] Does current Klatt implementation produce spectral flattening in 300-2500 Hz?
- [ ] What FNZ (nasal zero frequency) values best achieve this flattening?
- [ ] How does coupling magnitude map to AN parameter values?
