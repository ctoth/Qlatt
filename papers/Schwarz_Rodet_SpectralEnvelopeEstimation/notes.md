---
title: "Spectral Envelope Estimation and Representation for Sound Analysis-Synthesis"
authors: "Diemo Schwarz, Xavier Rodet"
year: "~1999 (based on references)"
venue: "IRCAM Technical Report / Conference Paper"
affiliation: "IRCAM - Centre Georges Pompidou, Paris"
---

# Spectral Envelope Estimation and Representation for Sound Analysis-Synthesis

## One-Sentence Summary
A survey comparing spectral envelope estimation methods (LPC, cepstrum, discrete cepstrum) and representation formats (filter coefficients, sampled, geometric, formants) for musical sound analysis-synthesis applications.

## Problem Addressed
Spectral envelopes are crucial for capturing timbre in the source-filter model, but different estimation methods and representations have trade-offs. This paper provides a systematic comparison to guide implementation choices.

## Key Contributions
- Comparative analysis of three estimation methods: LPC, cepstrum, discrete cepstrum
- Evaluation framework for spectral envelope representations with explicit requirements
- "Basic formant" equation for approximating two-pole resonator transfer function
- Introduction of "fuzzy formants" concept for robust formant tracking

## Methodology
Qualitative comparison of estimation methods on high-pitched signals (Figure 1), plus systematic evaluation of representations against seven requirements: preciseness, stability, locality, flexibility, synthesis speed, memory space, manual input.

## Key Equations

### Basic Formant Spectral Envelope (Equation 1)

$$
v_k(f) = \frac{10^{a_k/20}}{1 + \left(10^{3/20} - 1\right) \left(\frac{c_k - f}{b_k/2}\right)^2}
$$

Where:
- $v_k(f)$ = spectral envelope contribution of formant $k$ at frequency $f$
- $c_k$ = center frequency of formant $k$ (Hz)
- $b_k$ = bandwidth of formant $k$ (Hz)
- $a_k$ = amplitude of formant $k$ (dB)
- The factor $10^{3/20} - 1 \approx 0.413$ ensures -3 dB at half-bandwidth points

**Note:** This approximates the magnitude transfer function of a two-pole filter. Final envelope is sum of basic formants $\sum v_k(f)$.

## Parameters

| Name | Symbol | Units | Description | Notes |
|------|--------|-------|-------------|-------|
| Center frequency | $c_k$ | Hz | Formant peak frequency | Per-formant |
| Bandwidth | $b_k$ | Hz | Formant bandwidth | Per-formant |
| Amplitude | $a_k$ | dB | Formant peak amplitude | Per-formant |
| Order | - | integer | LPC/cepstrum order | Higher = less smoothing |
| Break frequency | - | Hz | Discrete cepstrum log scale transition | For mel-scale approximation |

## Estimation Methods Comparison

### LPC (Linear Predictive Coding)
- **Mechanism:** All-pole filter transfer function with p poles
- **Weakness:** Too smooth at low order, descends into valleys between partials for high-pitched sounds
- **Best for:** Residual noise estimation

### Cepstrum
- **Mechanism:** Low-pass filtering of log magnitude spectrum
- **Weakness:** Averages spectrum rather than linking peaks; descends between partials
- **Best for:** Residual noise estimation

### Discrete Cepstrum
- **Mechanism:** Computed from distinct frequency-amplitude points (spectral peaks from additive analysis)
- **Strength:** Avoids LPC/cepstrum problems by working from detected partials
- **Enhancement:** Logarithmic frequency scale above break frequency (mel-scale-like) reflects human ear resolution
- **Limitation:** Cannot be used for residual noise (no discrete peaks)

### Composite Envelope (Footnote 2)
For speech: discrete cepstrum below maximum voiced frequency + LPC above for unvoiced region.

## Representation Requirements

1. **Preciseness** - Describe arbitrary envelope accurately
2. **Stability** - Resilient to small input changes (noise)
3. **Locality in frequency** - Local changes possible without global effects
4. **Flexibility/ease of manipulation** - Musical parameter control
5. **Speed of synthesis** - Direct usability without expensive conversion
6. **Space in memory** - Compact for storage/transmission
7. **Manual input** - Easy to specify by drawing or parameter entry

## Representation Comparison Table

| Representation | Stability | Locality | Flexibility | Synth Speed (TD/FD) | Space | Manual Input |
|----------------|-----------|----------|-------------|---------------------|-------|--------------|
| Filter coef. | + | -- | --/-- | ++/o | + | -- |
| Sampled | ++ | ++ | ++/+ | --/++ | o | + |
| Geometric (BPF/spline) | - | + | /++ | - | + | ++ |
| Formants | - | + | ++/++ | + | ++ | o |

Key insights:
- Filter coefficients lack locality (one coef change affects all frequencies)
- Sampled lacks locality for manipulation (must specify all new values)
- Geometric representations don't model signal properties, just curve shape
- Formants can be unstable (small envelope change → sudden formant jump)

## Formant Representations

### 1. FOF (Forme d'Onde Formantique)
- Time-domain elementary waveform
- Parameters: center frequency, amplitude, bandwidth, skirt width, phase, excitation time, attenuation time
- Used in CHANT system for singing voice
- More information than needed for just spectral envelope

### 2. Basic Formants
- Simplified: center frequency, bandwidth, amplitude only
- Use Equation 1 above
- Final envelope = sum of basic formants (parallel structure)

### 3. Fuzzy Formants
- Regions in sampled envelope where formant assumed to exist
- Specified by: lower bound, upper bound, center (peak) frequency, label
- Labels enable formant tracking across frames
- More robust to estimation instabilities

## Implementation Details

### Synthesis Approaches

**Filtering:**
- Time-domain: convert envelope to filter coefficients
- Frequency-domain: convert to transfer function (e.g., IRCAM SuperVP phase vocoder)

**Additive Synthesis:**
- Sinusoidal partials: amplitude from sinusoidal spectral envelope at partial frequency
- Residual: filter white Gaussian noise with noise spectral envelope
- FFT^-1 method: 10-30x speedup over oscillator bank

### Key Implementation Notes
- Sinusoidal and noise envelopes must be treated separately (different production mechanisms)
- For voice transposition: must restore original spectral envelope after pitch shift to avoid unnatural formant shift
- Unified handling of noise and sinusoidal envelopes enables synchronized manipulation

## Figures of Interest

- **Fig 1 (page 2):** Comparison of LPC, cepstrum, and discrete cepstrum on high-pitched signal (0-8000 Hz). Shows discrete cepstrum linking partial peaks while LPC/cepstrum descend into valleys.

## Results Summary

- Discrete cepstrum best for sinusoidal partials from additive analysis
- LPC/cepstrum still useful for residual noise
- No single representation optimal for all uses; object-oriented hierarchy combining all recommended
- SDIF format used for interchange between programs

## Limitations

- Paper is a survey/overview, not detailed implementation guide
- Basic formant equation is approximation (not exact two-pole transfer function)
- Fuzzy formants require prior knowledge of approximate formant locations
- Geometric representations don't capture signal interdependencies

## Relevance to Qlatt Project

**Direct relevance: LOW-MEDIUM**

The Qlatt project uses a formant synthesizer (Klatt model) which directly specifies formant parameters (F1-F5, bandwidths, amplitudes) rather than estimating spectral envelopes from analysis. However:

1. **Basic formant equation** could be useful for visualizing/debugging formant contributions
2. **Parallel vs cascade** discussion (footnote 6, ref [6]) connects to Klatt's SW parameter
3. **Representation comparison** informs parameter storage/manipulation design
4. **FOF synthesis** mentioned as alternative to Klatt-style synthesis

## Open Questions

- [ ] How does basic formant equation compare to Klatt's two-pole resonator transfer function?
- [ ] Would fuzzy formants be useful for formant tracking in analysis (not synthesis)?

## Related Work Worth Reading

- **Holmes (1983)** [6]: "Formant synthesizers: Cascade or Parallel" - directly relevant to Klatt SW parameter
- **Rodet (1984)** [7]: FOF synthesis - alternative formant synthesis approach
- **Stylianou et al. (1995)** [4]: Harmonic+Noise model for speech modification
- **Schwarz (1998)** [2]: Full thesis on spectral envelopes (more detail than this paper)

---

## Collection Cross-References

### Already in Collection
- [[Holmes_1983_FormantSynthesizersCascadeParallel]]

### New Leads (Not Yet in Collection)
- **Rodet (1984) [7]** - FOF (Forme d'Onde Formantique) synthesis - An alternative time-domain formant synthesis technique used in CHANT. Worth understanding as a different approach to formant-based voice synthesis.
- **Stylianou et al. (1995) [4]** - Harmonic+Noise model for speech modification - Relevant for understanding how to separate and manipulate voiced/unvoiced components, which relates to Klatt's parallel/cascade handling.
- **Galas & Rodet (1991) [3]** - Discrete cepstrum method - The technical foundation for the discrete cepstrum estimation approach highlighted as superior for sinusoidal analysis.
- **Schwarz (1998) [2]** - Full thesis by first author - Contains much more detail on spectral envelope methods than this conference paper; primary source if deeper implementation details needed.

### Conceptual Links (not citation-based)
- [[Bonada_2008_VoiceSynthesisSpectralModels]] — Moderate. Bonada's EpR (Excitation plus Resonances) model decomposes the spectral envelope into source curve + formant resonances + residual, providing an alternative to Schwarz's cepstral approach. Both solve the same problem (robust spectral envelope estimation for voice synthesis) but for different synthesis architectures.
