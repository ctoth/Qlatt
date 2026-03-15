# Holmes 1973 — Implementation Notes

**Full title:** The Influence of Glottal Waveform on the Naturalness of Speech from a Parallel Formant Synthesizer
**Author:** John N. Holmes (Joint Speech Research Unit, Ruislip, England)
**Published:** IEEE Transactions on Audio and Electroacoustics, Vol. AU-21, No. 3, June 1973, pp. 298-305
**DOI:** 10.1109/TAU.1973.1162466

## Key Findings

1. A parallel formant synthesizer can produce speech almost indistinguishable from natural speech under critical earphone listening, provided the glottal pulse is derived by inverse filtering a natural vowel from the same talker.
2. Idealized cosine-segment glottal pulses are less natural than inverse-filtered pulses, but the difference is small.
3. Phase structure of glottal pulses matters for earphone listening but is irrelevant for loudspeaker listening in a room (reverberation randomizes phase).

## Parallel Formant Synthesizer Architecture

### Topology
- 6 parallel paths total:
  - 5 second-order recursive filters as formant generators (FN, F1, F2, F3, F4)
  - 1 bandpass filter (3600-4000 Hz) for high-frequency voiceless sounds
- FN = extra nasal formant in the F1 region; nasal zero achieved by mixing parallel FN and F1 signals
- Formants 2-4 connected in **alternate polarity**
- F4 fixed frequency; FN, F1, F2, F3 dynamically controlled

### Spectrum-Shaping Filters (Inter-Formant Interaction Reduction)
Each formant output passes through an individual spectrum-shaping filter before mixing. Filter specifications (real zeros on complex-frequency plane):

| Formant | Zero Position (rad/s) |
|---------|----------------------|
| 1       | -2pi x 640           |
| 2       | -2pi x 300           |
| 3       | 0                    |
| 4       | 0                    |

Result: neutral vowel differs from series synthesizer by no more than 1 dB over the four-formant frequency range.

### Source Signal Chain
- Glottal volume-velocity waveform -> +12 dB/octave filter -> formant generators -> mixing -> -6 dB/octave output filter -> output
- In practice: stores the **second time derivative** of the glottal pulse (avoids explicit +12 dB/octave filter)
- Twice-differentiated glottal pulses have roughly flat spectrum, so flat-spectrum noise is appropriate for voiceless source
- Voiceless source has additional -6 dB/octave rolloff below 600 Hz to compensate for output filter's low-frequency emphasis

### Voiced Source
- Stored glottal pulse shape: **72 ordinate samples**
- F0 and pulse duration independently controllable through clampable smoothing filters
- Interpolation method avoids quantization of glottal period (no stepping frequency artifacts)
- Clamping criterion depends on F0 jumps only; applied to both F0 and duration filters simultaneously

### Voiceless Source
- Pseudorandom noise generator with Gaussian amplitude distribution
- Switched off for 5 ms and replaced by a **single pulse** on simultaneous upward amplitude jumps on 2+ formants (for stop bursts — more effective than noise alone)

### Mixed Excitation System
- Variable mixing between voiced and voiceless per formant, with per-formant offsets
- Constant power mixing: 50% voicing gives 0.707 of each source
- At 50% voicing nominal setting: F4 is just fully voiceless; FN, F1, F2 still fully voiced; F3 is 50% voiced
- Change from voiceless to voiced for any one formant = 1/3 of total voicing control range
- AHF control switches between F4 and high-frequency voiceless signal based on voicing level

### Bandwidth Control
- Bandwidths preset but increased by rule for:
  - Voiceless sounds
  - Nasalized sounds (factor up to **2.5x for F1**)
- Nasality determined by empirical algorithm using relative amplitudes of FN and F1, and frequency of F1

### Control Smoothing
- All amplitude and frequency control lines have smoothing filters
- Smoothing filters have "clamp" facility: output jumps immediately to input when input change exceeds threshold
- Prevents slowing down stop bursts and allows sudden formant transitions at consonant-vowel boundaries
- Best smoothing filter bandwidth for excitation controls: **10 Hz**
- Other smoothing filters: gradual cutoff at **50 Hz** nominal

### Control Information
- 12 independent controls
- 32 quantization levels each
- 100 frames/s
- Total: 6000 bits/s (deliberately generous for research)

### Subglottal Coupling (Optional)
- Glottal area waveform stored independently of excitation pulse shape
- Two preset coefficients per formant generator: how much glottal area modifies formant frequency and bandwidth
- Pitch-synchronous formant frequency and bandwidth modification

### Pulse Timing Jitter (Optional)
- Controllable random time jitter of excitation pulses

## Glottal Pulse Processing

### Inverse Filtering Procedure
1. Inverse filter a nonnasalized vowel from natural speech
2. Optimize filter parameters for minimum ripple in closed-glottis period
3. Fourier analyze the second time derivative of the measured pulse
4. Modify harmonic amplitudes to make spectrum trend flat (retain local power spectrum and phase structure)

### Subglottal Coupling Effect on Measured Pulses
- When glottis is open, subglottal structure shifts formant poles
- Inverse filter (optimized for closed-glottis) doesn't fully cancel open-glottis poles
- Results in spectral dip at inverse filter zero frequency and adjacent peak at shifted pole frequency
- For one talker: deep spectral dip ~500 Hz, peak ~600 Hz; pronounced ripple on opening phase of pulse waveform
- Correction: manually remove F1 ripple from stored pulse; use pitch-synchronous formant modification to represent the effect

## Listening Test Results

### Natural vs. Synthetic (with inverse-filtered source)
- Inexperienced listeners: considerable difficulty discerning any difference, even after 20+ repetitions
- Experienced listeners: could detect small differences on 1-2 sounds per sentence after several listens

### Inverse-Filtered vs. Cosine-Segment Source
- ~40% of judges detected no difference
- ~60% who detected differences all preferred inverse-filtered source
- A few expressed strong preference

### Phase Structure Experiment
- Two periodic sources with identical power spectra but different phase (single-pulse vs. four-pulses-per-period)
- Shaped by filter with poles at -50 +/- j200 Hz and double zero at origin
- **Earphone listening:** all judges chose single-pulse as more natural; four-pulse gave "rattly" quality especially at low pitch
- **Loudspeaker in room:** judges generally detected no difference at all; both completely acceptable as natural speech
- Close to loudspeaker: judgments similar to earphone listening

### Practical Implication
- For loudspeaker-reproduced speech, glottal pulse phase structure is irrelevant — room reverberation randomizes harmonic phases
- For earphone/headphone applications, phase structure matters

## Relevance to Klatt Synthesizer

- The spectrum-shaping filters for reducing inter-formant interaction in parallel synthesis are directly applicable to Qlatt's parallel formant paths
- The +12 dB/octave pre-emphasis (stored as second derivative) and -6 dB/octave output filter chain matches Klatt's radiation characteristic approach
- The mixed excitation system with per-formant voicing offsets is a precursor to Klatt's SW parameter approach
- The stop burst mechanism (replacing noise with a single pulse on simultaneous amplitude jumps) relates to Qlatt's PLSTEP burst mechanism
- The bandwidth-by-nasality rule (2.5x for F1) provides a concrete parameter for nasalization modeling
- The finding that phase doesn't matter for loudspeaker listening supports using minimum-phase or simplified glottal models in practical synthesis
