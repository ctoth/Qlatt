# Analysis of Nasal Consonants

**Authors:** Osamu Fujimura
**Year:** 1962
**Venue:** The Journal of the Acoustical Society of America, Volume 34, Number 12, pp. 1865-1875
**Received:** September 5, 1962

## One-Sentence Summary
Provides the pole-zero (formant-antiformant) distributions that characterize the spectra of English nasal consonants /m/, /n/, and /ŋ/ in various vowel contexts, establishing the acoustic basis for distinguishing nasals by place of articulation.

## Problem Addressed
How to characterize the spectral properties of nasal murmurs in a unified and compact form using transfer function pole-zero analysis, and whether consistent acoustic features exist that distinguish /m/, /n/, and /ŋ/ from each other and from other speech sounds.

## Key Contributions
- Complete pole-zero distributions for /m/, /n/, and /ŋ/ derived from analysis-by-synthesis spectrum matching
- Identification of the antiformant (nasal zero) as the primary distinguishing feature between the three nasals
- Quantitative formant and antiformant frequency and bandwidth measurements (Table I)
- Three common spectral characteristics of all nasal murmurs as a class
- Theoretical framework relating articulatory configurations to acoustic pole-zero locations via susceptance curves

## Methodology
- Natural utterances of nonsense syllables /haCVC/ spoken by 3 talkers of American English
- Speech digitized through 36 filter bank (100-7200 cps), rectified, smoothed at 8.3 ms intervals
- Analysis-by-synthesis: operator-adjusted pole-zero configurations matched to observed spectra on CRT display
- Spectral matching using 5 formant poles + 2 buffer poles + 1 antiformant zero + auxiliary pole-zero pairs
- Goodness of fit measured as sum of squared differences across 20-24 filter channels
- Typical match quality: 20-40 dB² over lowest 20-24 channels

## Key Equations

### Transfer Function (Eq. 1)
$$
U_0(s) = T(s) \cdot U_s(s)
$$
Where: $U_0(s)$ = output volume velocity (nostrils), $U_s(s)$ = source volume velocity (glottis), $T(s)$ = vocal tract transfer function, $s$ = complex frequency.

### Pole-Zero Form of Transfer Function (Eq. 2)
$$
T(s) = \frac{\prod_{j=1}^{n}\left(1 - \frac{s}{s_j}\right)\left(1 - \frac{s}{s_j^*}\right)}{\prod_{i=1}^{m}\left(1 - \frac{s}{s_i}\right)\left(1 - \frac{s}{s_i^*}\right)} H(s)
$$
Where: $s_j$ = zeros, $s_i$ = poles, $m$ and $n$ are the number of poles and zeros, $H(s)$ = higher-frequency correction term.

### Sound Pressure at Distance d (Eq. 3)
$$
P_d(s) = (s\rho / 4\pi d) \cdot \exp(-sd/c) \cdot U_0(s)
$$
Where: $\rho$ = air density, $d$ = distance, $c$ = speed of sound.

### Absolute Spectrum Envelope (Eq. 4)
$$
P_d(s) = (s\rho / 4\pi d) \cdot \exp(-sd/c) \cdot \frac{\prod_{j=1}^{n}\left(1 - \frac{s}{s_j}\right)\left(1 - \frac{s}{s_j^*}\right)}{\prod_{i=1}^{m}\left(1 - \frac{s}{s_i}\right)\left(1 - \frac{s}{s_i^*}\right)} H(s) \cdot U_s(s)
$$

### Spectrum Envelope in Frequency Domain (Eq. 5)
$$
\kappa \omega E(\omega) = K(\omega) \frac{\left|\prod_{j=1}^{n}\left(1 - \frac{j\omega}{\sigma_j + j\omega_j}\right)\left(1 - \frac{j\omega}{\sigma_j - j\omega_j}\right)\right|}{\left|\prod_{i=1}^{m}\left(1 - \frac{j\omega}{\sigma_i + j\omega_i}\right)\left(1 - \frac{j\omega}{\sigma_i - j\omega_i}\right)\right|}
$$
Where: $\kappa$ = absolute signal level constant, $s_i = \sigma_i + j\omega_i$ (poles), $s_j = \sigma_j + j\omega_j$ (zeros), $K(\omega)$ = over-all correction function.

## Parameters

### Formant Frequencies for /ŋ/ (Speaker KS)
| Formant | Frequency (cps) | Notes |
|---------|----------------|-------|
| F1 | ~350 | Typical across vowel contexts |
| F2 | ~1050 | Typical across vowel contexts |
| F3 | ~1900 | Typical across vowel contexts |
| F4 | ~2750 | Typical across vowel contexts |

### Antiformant (Zero) Frequency Ranges
| Nasal | Antiformant Range (cps) | Typical Value | Notes |
|-------|------------------------|---------------|-------|
| /m/ | 750-1250 | ~1000 | Low position; between F1 and F2 clusters |
| /n/ | 1450-2200 | ~1700 | Medium position; near F2-F3 region |
| /ŋ/ | >3000 | ~3000+ | High position; above main formant range |

### Formant Bandwidths (Table I) - Half-Power Bandwidths in cps
| | /m/ | /n/ | /ŋ/ |
|---|-----|-----|-----|
| Formant 1 | 60 | 40 | 80 |
| Formant 2 | 60 | 100 | 100 |
| Formant 3 | 90 | 110 | 230 |
| Formant 4 | 280 | 170 | 100 |
| Formant 5 | 170 | 100 | ... |
| Antiformant | 80 | 600 | ... |

Key observations from Table I:
- Nasal formant bandwidths are comparable to or greater than vowel bandwidths
- The 4th formant of /m/ (~2000 cps) has very wide bandwidth (280 cps), affiliated with nasal cavity
- /n/ antiformant has very wide bandwidth (600 cps) compared to /m/ antiformant (80 cps)
- /m/ antiformant is quite sharp; /n/ antiformant has considerably more damping

### Formant Spacing
- Average formant spacing along frequency axis: ~800 cps for typical male speaker (smaller than ~1000 cps for vowels, due to longer pharynx+nasal tract)

### Articulatory Configurations (Three-Tube Model)
| Subsystem | Description |
|-----------|-------------|
| Pharynx | Glottis to velum (susceptance $B_p$) |
| Oral cavity | Velum to complete closure at anterior end (susceptance $B_m$) |
| Nasal tract | Nasopharynx + nasal passages terminated by radiation (susceptance $B_n$) |

Coupling point: velum opening. Internal susceptance: $B_i = B_p + B_n$

### Formant Locations by Nasal (Fig. 6)
| Feature | /m/ | /n/ | Context Dependency |
|---------|-----|-----|-------------------|
| F1 | ~300 cps | ~300 cps | Relatively stable |
| F2 | ~1000 cps | ~1000 cps | Stable for /n/; varies for /m/ |
| F3 | ~2300 cps (cluster) | ~2000 cps | Variable; cluster with antiformant |
| F4 | ~2000 cps | ~2600-2700 cps | Fixed for /m/; varies for /n/ |
| Antiformant | 750-1250 cps | 1450-2200 cps | Varies with vowel context |

## Implementation Details

### Spectrum Matching Procedure
1. Operator specifies initial set of poles and zeros on complex-frequency plane (right-hand side of Eq. 5)
2. Correction curve $K(\omega)$ constructed from fixed buffer poles at 4500, 5000, 5500, 7000 cps and zeros at 3000-4000 cps range
3. Trial spectrum computed and compared with observed speech spectrum at 36 filter points
4. Operator adjusts pole-zero locations iteratively until goodness-of-fit (squared difference sum) minimized
5. For /n/: frequency range restricted to 100-2300 cps (20 channels) to avoid second antiformant
6. For /m/: two fixed zeros on negative real axis at 1000 and 2000 cps represent higher pole/zero correction
7. Additional auxiliary pole-zero pairs inserted above main frequency range and below 500 cps when needed to match deviations from ideal -12 dB/octave source slope

### Three Common Characteristics of Nasal Murmurs (Section V)
1. **Very low first formant** (~300 cps), well separated from upper formant structure
2. **High damping factors** (relatively wide bandwidths) compared to vowels
3. **High density of formants** in the middle-frequency domain (plus the antiformant)

Combined effect: even distribution of sound energy in the 800-2300 cps range with neither prominent peaks nor deep valleys. This "flat middle-frequency" characteristic distinguishes nasals from vowels (which show either front or back concentration).

### Low-Frequency Spectral Feature
- First spectral peak at ~600 cps with consistent lack of energy just above it
- This stable low-frequency region (200-1000 cps) may serve as a class identifier for nasals
- Influenced by antiformant of /m/ but also present for /n/ and /ŋ/
- Combination with middle-frequency flatness may constitute a reliable recognition criterion

### Antiformant Context Dependency
- /m/ antiformant: higher before front vowels (due to anterior tongue narrowing), lower before back vowels (tongue retraction → large mouth cavity)
- /n/ antiformant: also shows vowel-context effects but smaller in magnitude
- Antiformant position changes within utterance, shifting during nasal murmur anticipating following vowel

### Formant-Antiformant Interaction Rules
- A singularity of $B_i$ always exists between any two adjacent formants when no antiformant lies between them
- When formant and antiformant are close, they form a "cluster" that shifts together
- If antiformant frequency exactly matches a $B_i$ singularity (i.e., a pharyngeal or nasal cavity resonance), the formant-antiformant pair annihilates
- Crossing of formant and antiformant observed in time-varying data (Figs. 5, 6)

## Figures of Interest
- **Fig. 1 (page 1):** Midsagittal tracing of vocal tract during /n/ production + simplified three-tube acoustic model showing pharynx ($B_p$), mouth ($B_m$), and nose ($B_n$) susceptances
- **Fig. 2 (page 2):** Susceptance curves for $B_i$ and $B_m$ showing formant and antiformant locations for /n/ and /m/ configurations; arrows mark formants of uncoupled /ŋ/
- **Fig. 3 (page 4):** CRT display of spectrum matching showing input spectrum, matched spectrum, and difference curve for /n/
- **Fig. 4 (page 5):** Photographs of spectra for repeated /m/ samples showing variability in middle-frequency cluster structure
- **Fig. 5 (page 6):** Formant and antiformant frequencies vs. time for intervocalic /m/ and /n/ showing articulatory transitions
- **Fig. 6 (page 6):** Formant and antiformant locations for /m/ and /n/ across different vowel contexts for two speakers

## Results Summary
- Pole-zero distributions successfully characterize nasal murmur spectra
- The antiformant is the primary distinguishing feature: low (~1000 cps) for /m/, medium (~1700 cps) for /n/, high (>3000 cps) for /ŋ/
- This corresponds to the effective length of the oral cavity behind the closure point
- Formant transitions of adjacent vowels often play an important or dominant role in nasal recognition (alongside antiformant)
- The three-tube model with susceptance analysis provides a theoretical framework that correctly predicts the observed pole-zero behavior

## Limitations
- Manual spectrum matching procedure limits throughput and reproducibility
- Source spectrum $|U_s(j\omega)|$ not precisely known, contributing to matching error
- Limited number of speakers (primarily KS studied intensively)
- Only the nasal murmur portion analyzed; formant transitions into/out of nasals not systematically studied
- Bandwidth data accuracy somewhat limited compared to frequency data
- /ŋ/ only studied in final position (no intervocalic /ŋ/ data)

## Relevance to Project
- **Antiformant frequencies**: The antiformant (nasal zero) frequency distinguishes /m/, /n/, /ŋ/ and should be set accordingly in the Klatt synthesizer's FNZ parameter
- **Bandwidth settings**: Table I provides empirical bandwidths for nasal formants that may differ from default vowel values
- **Common nasal characteristics**: The three-feature description (low F1, high damping, dense formants) provides design targets for all nasal murmurs
- **Context dependency**: Antiformant position shifts with vowel context, suggesting coarticulation rules for the nasal zero parameter
- **Formant-antiformant clustering**: The variable "cluster" of F2/F3 with the antiformant explains why nasal spectra appear different from simple formant patterns

## Open Questions
- [ ] How do the antiformant bandwidths map to Klatt BNZ parameter?
- [ ] Should the nasal zero frequency be made vowel-context-dependent in the synthesizer?
- [ ] What are appropriate antiformant values for female/child speakers (all data from male speakers)?
- [ ] How to handle the formant-antiformant annihilation phenomenon in a fixed-topology cascade synthesizer?

## Related Work Worth Reading
- Fant, C. G. M. (1960). *Acoustic Theory of Speech Production*. Mouton. [Already in collection]
- House, A. S. (1957). Analog studies of nasal consonants. J. Speech Hearing Disorders, 22, 190-204.
- Stevens, K. N. and House, A. S. (1961). J. Acoust. Soc. Am., 33, 1174-1178.
- Hattori, S., Yamamoto, K., and Fujimura, O. (1958). J. Acoust. Soc. Am., 30, 267-274.
- Nakata, K. (1959). J. Acoust. Soc. Am., 31, 661-666.
- Flanagan, J. L. (1960). J. Acoust. Soc. Am., 32, 1613-1620.

---

## Collection Cross-References

### Already in Collection
- **Fant_1960_AcousticTheorySpeechProduction**

### New Leads (Not Yet in Collection)
- **Bell, Fujisaki, Heinz, Stevens, and House (1961)** [Ref 2] - Analysis-by-synthesis method for obtaining pole-zero distributions from natural speech. Defines the methodology used in this paper.
- **House (1957)** [Ref 5] - Analog studies of nasal consonants. Earlier work on nasal acoustics using electrical analogs; complements Fujimura's digital analysis approach.
- **Nakata (1959)** [Ref 4] - Prior work on antiformant frequency data that Fujimura references for /ŋ/ formant locations.
- **Stevens and House (1961)** [Ref 12] - Quantitative data on formant and antiformant bandwidths for nasal sounds referenced in the damping discussion.
