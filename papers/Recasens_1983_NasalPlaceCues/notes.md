# Place Cues for Nasal Consonants with Special Reference to Catalan

**Authors:** Daniel Recasens
**Year:** 1983
**Venue:** Journal of the Acoustical Society of America, Vol. 73, No. 4, April 1983, pp. 1346–1353
**DOI:** 0001-4966/83/041346-08$00.80

## One-Sentence Summary
This paper quantifies the relative perceptual contributions of formant transitions vs. nasal murmur spectra for distinguishing place of articulation in nasal consonants [n], [ɲ], [ŋ], providing spectral parameter tables directly usable for synthesizing distinguishable nasals.

## Problem Addressed
While manner cues for nasals (low F1, antiformant, weak higher formants, large bandwidths) are well established, the *place* cues — how listeners distinguish alveolar [n] from palatal [ɲ] from velar [ŋ] — were poorly understood, especially how formant transitions and nasal murmur spectra interact perceptually.

## Key Contributions
- Comprehensive acoustic analysis of nasal murmur formant frequencies (N1–N4, NZ) and formant transition extents (F1–F3) for [m], [n], [ɲ], [ŋ] in Catalan
- Systematic perception experiment showing transitions are generally more powerful cues than murmurs, but murmurs contribute significantly to place identification
- Evidence that transitions and murmurs are perceptually integrated simultaneously (not sequentially) — paralleling burst+transition integration for stops
- Specific spectral values for synthesizing distinguishable nasal consonants in a formant synthesizer

## Methodology
1. **Acoustic analysis**: Spectrographic measurements of Catalan monosyllables (VC final position) from one reference speaker + 12 additional speakers. Measured murmur formant frequencies/bandwidths and formant transition extents.
2. **Perception experiments**: Synthetic stimuli created with Haskins serial formant synthesizer. Four tests varying transitions and murmurs independently along continua. 24 Catalan listeners identified final nasal as [n], [ɲ], or [ŋ].

## Key Equations
No explicit equations — this is primarily an experimental/perceptual study.

## Parameters

### Table II: Nasal Murmur Formant Frequencies (Hz) — Single Catalan Speaker

| Nasal | N1   | N1 bw | N2   | N3   | N4   | NZ   |
|-------|------|-------|------|------|------|------|
| [m]   | 200  | 160   | 1120 | 1360 | 2100 | —    |
| [n]   | 250  | 180   | 850  | 1550 | 2025 | 1780 |
| [ɲ]   | 250  | 150   | 1025 | 2100 | 3125 | 2650 |
| [ŋ]   | 350  | 200   | 1200 | 2030 | 2540 | 3700 |

### Table II: Nasal Murmur Formant Frequencies (Hz) — 12 Catalan Speakers (means)

| Nasal | N1   | N1 bw | N2   | N3   | N4   | NZ   |
|-------|------|-------|------|------|------|------|
| [m]   | 255  | 69    | 1015 | 1300 | 1620 | —    |
| [n]   | 285  | 37    | 1035 | 1515 | 2130 | —    |
| [ɲ]   | 295  | 58    | 1055 | 1760 | 2265 | —    |
| [ŋ]   | 295  | 50    | 1060 | 1530 | 2215 | —    |

Note: Standard deviations in parentheses in original. NZ only measured for single speaker.

### Table III: Formant Transition Extents (Hz) — Final Transitions

| Nasal | F1    | F2    | F3    |
|-------|-------|-------|-------|
| [m]   | −120  | −285  | −10   |
|       | −70   | −75   | −55   |
| [n]   | −145  | +75   | +80   |
|       | −30   | +235  | +65   |
| [ɲ]   | −400  | +400  | +300  |
|       | −120  | +460  | +125  |
| [ŋ]   | −20   | +10   | −190  |
|       | −30   | +110  | −65   |

(Row 1 = single speaker; Row 2 = 12 speakers mean. Negative = falling, positive = rising.)

### Ordering of Murmur Spectral Values

- N1 frequency: [ŋ] > [ɲ],[n] > [m]
- N1 bandwidth: [ŋ] > [ɲ],[n],[m]
- NZ frequency: [ŋ] > [ɲ] > [n]

### Formant Transition Generalizations

- F1: consistently falling, more for [ɲ] than [m], [n], and even less for [ŋ]
- F2: rising (by 500–1000 Hz) for [ɲ]; rising or flat for [n]; slightly rising/falling/flat for [ŋ]; consistently falling (by 50–500 Hz) for [m]
- F3: generally falling for [m], [n], [ŋ], and rising for [ɲ]

## Implementation Details

### Synthesis Parameters Used (Haskins Formant Synthesizer)
- Variable F2–F3 transition endpoints combined with fixed murmur patterns (or vice versa)
- Extra pole (used as N2) and extra zero (used as NZ)
- F1 transitions flat at 900 Hz for all stimuli
- Preceding [a] nasalized via single low pole-zero (500/500 to 600/700 Hz)
- Stimulus: 560 ms total — 200 ms vowel steady state, 60 ms transition, 300 ms murmur
- 10 dB amplitude decrease from vowel onset to murmur onset
- Falling F0 contour from vowel onset (120 Hz) to murmur offset (80 Hz)

### Key Perceptual Finding for Synthesis
- **Transitions alone** can distinguish [n] vs [ɲ] well (95% for [ɲ] transitions)
- **Murmurs alone** distinguish [ŋ] best (40–64% [ŋ] responses with [ŋ] murmur)
- For [n], **both** transitions and murmurs needed
- For [ŋ], murmur contributes more to identification than transitions do (inverse pattern from [ɲ])

### Perceptual Category Ordering on Murmur Continuum
[n] < [n] < [ɲ] (i.e., spectral values increase as place moves back for nasals)

## Figures of Interest
- **Fig. 1 (page 4):** Synthesis patterns for tests 1a/1b — schematic spectrograms showing formant transitions and murmur pole/zero patterns with bandwidth values
- **Fig. 2 (page 4):** Synthesis patterns for tests 2a/2b — fixed transitions with variable murmur bandwidth values
- **Fig. 3 (page 5):** Perceptual results for transition continuum tests — shows crossover points between nasal categories
- **Fig. 4 (page 5):** Perceptual results for murmur continuum tests — shows how murmur spectral values shift identification
- **Fig. 5 (page 6):** Comparison of perception data with production data for F2–F3 transitions — shows good agreement between perceptual category boundaries and production spaces

## Results Summary
1. Transitions provide more effective cues than murmurs overall, but murmurs make significant contribution
2. For [ŋ]–[n] distinction, murmurs are particularly important (transitions alone insufficient)
3. The cue value of transitions: [ɲ] > [n] > [ŋ]
4. Static (murmur) and dynamic (transition) cues are perceptually integrated with reference to the typical production pattern — paralleling how bursts and transitions integrate for stops
5. Production data (F2–F3 transition spaces) align well with perceptual category boundaries

## Limitations
- Only tested in VC (final position) context with vowel [a]
- [m] excluded from perception experiments due to paradigm complexity
- Releases of nasals not investigated (stimuli used unreleased nasals)
- Only Catalan speakers tested — cross-language generalizability assumed but not tested
- Synthetic speech only; no natural speech manipulation experiments

## Relevance to Project
Directly relevant to nasal consonant synthesis in Qlatt:
- Provides specific formant frequency targets for nasal murmurs (N1–N4, NZ) that can be mapped to Klatt synthesizer parameters (FNP, FNZ, and parallel branch formants during nasal murmur)
- Quantifies formant transition extents (F1–F3) needed to distinguish nasal place — useful for setting transition targets in the phoneme parameter tables
- Confirms that both murmur spectrum AND transitions matter — can't just use identical murmurs for all nasals
- The murmur formant ordering (N1: [ŋ] > [ɲ] > [n] > [m]; NZ: [ŋ] > [ɲ] > [n]) maps directly to antiresonator frequency settings

## Open Questions
- [ ] How do these Catalan values map to English nasals [m], [n], [ŋ]? (English lacks [ɲ] but has the other three)
- [ ] What NZ (antiformant) values should be used for English nasals? (Only single-speaker NZ data here)
- [ ] How should murmur bandwidth values be set? (Paper provides some values but doesn't systematically test bandwidth perception)
- [ ] What is the optimal transition duration for nasal place cues? (Paper used 60 ms fixed)

## Related Work Worth Reading
- Fujimura, O. (1962). "Analysis of nasal consonants," J. Acoust. Soc. Am. 34, 1865–1875. — Foundational nasal acoustic analysis
- Fant, G. (1960). Acoustic Theory of Speech Production — Theory of nasal formant/antiformant structure
- Hecker, M. H. (1962). "Studies of nasal consonants with an articulatory speech synthesizer," J. Acoust. Soc. Am. 34, 179–188. — Nasal synthesis with formant synthesizer
- Nakata, K. (1959). "Synthesis and perception of nasal consonants," J. Acoust. Soc. Am. 31, 661–666.
- Larkey, L. et al. (1978). "Perception of synthetic nasal consonants in initial and final syllable position," Percept. Psychophys. 23, 299–312.

---

## Collection Cross-References

### Already in Collection
- [[Fant_1960_AcousticTheorySpeechProduction]]
- [[Fujimura_1962_NasalConsonantAnalysis]]

### New Leads (Not Yet in Collection)
- **Hecker (1962)** — Nasal consonant synthesis using an articulatory speech synthesizer; directly relevant to how we set formant synth parameters for nasals.
- **Nakata (1959)** — Early synthesis and perception study of nasals; one of the few studies combining both.
- **Mártony (1964)** — Role of formant amplitudes in nasal synthesis; relevant to setting parallel branch gains for nasal murmurs in Klatt synthesizer.
