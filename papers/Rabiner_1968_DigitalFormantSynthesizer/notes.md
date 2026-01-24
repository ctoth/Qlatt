# Digital-Formant Synthesizer for Speech-Synthesis Studies

**Authors:** Lawrence R. Rabiner
**Year:** 1968
**Venue:** Journal of the Acoustical Society of America, Vol. 43, No. 4, pp. 822-828
**DOI:** 10.1121/1.1910902

## One-Sentence Summary
Describes a digital serial terminal-analog formant synthesizer with three key innovations: a voiced fricative excitation network using pitch-synchronous noise modulation, a voice bar generator for voiced stops, and automatic higher-pole correction exploiting sampled data system properties.

## Problem Addressed
Previous terminal-analog synthesizers lacked methods for properly synthesizing voiced fricatives (which have both voiced and unvoiced components), voice bars during voiced stop closures, and automatic higher-pole correction in digital implementations.

## Key Contributions
1. Voiced fricative excitation network with pitch-synchronous noise modulation
2. Simple voice bar generation via amplitude control of shaped pitch pulses
3. Higher-pole correction exploiting periodicity of sampled data systems
4. Detailed comparison of serial vs parallel synthesizer architectures

## Architecture

### Block Diagram (Fig. 1)
Three branches summed to produce output:

**Upper Branch (Voiced Path)**:
```
Pitch Impulse → Switch → Shaping → Formant → Higher-Pole → Nasal Branch → Radiation → Output
Generator         ↑      Network   Network   Correction    (parallel)     Network
                  VA                (F1,F2,F3)  Network
```

**Lower Branch (Unvoiced Path)**:
```
Frication → AFRIC → Multiplier → Fricative Pole/Zero → Shaping → Output
Generator    gain      ↑          Network (FPOL,FZER)   Network
                       |
              Voiced Fricative
              Excitation Network
```

**Middle Branch (Voice Bar)**:
```
Shaping Network Output → AVB gain → Output
```

## Key Equations

### Formant Contour (from companion synthesis-by-rule paper)
$$
\frac{d^2f_N(t)}{dt^2} + \frac{2}{\tau_{AB}^N}\frac{df_N(t)}{dt} + \frac{1}{(\tau_{AB}^N)^2}f_N(t) = \frac{P_N(t)}{(\tau_{AB}^N)^2}
$$
Where:
- $N$ = formant number (1, 2, or 3)
- $P_N(t)$ = step functions for Nth formant targets
- $f_N(t)$ = formant contour response
- $\tau_{AB}^N$ = time constant between phonemes A and B

### Higher-Pole Correction
Due to periodicity of sampled systems, pole at frequency $f$ represents analog poles at:
$$
f, f + f_s, f + 2f_s, \ldots
$$
Where $f_s$ = sampling frequency

## Parameters

### Control Signals
| Parameter | Function | Notes |
|-----------|----------|-------|
| F0 | Pitch impulse rate | External control |
| VA | Voice/aspiration switch | Gates source to shaping |
| F1, F2, F3 | Formant frequencies | Center freq + bandwidth |
| ANASAL | Nasal branch enable | 0=nonnasal, 1=nasal |
| NPOL, NZER | Nasal pole/zero positions | Complex conjugate pairs |
| AVOICING | Overall voiced output level | Gain control |
| AFRIC | Overall unvoiced output level | Gain control |
| FPOL, FZER | Fricative pole/zero positions | Variable |
| AVB | Voice bar amplitude | For voiced stop closure |

### Higher-Pole Correction Resonators (20 kHz synthesizer)
| Resonator | CF (Hz) | Q | BW (Hz) |
|-----------|---------|---|---------|
| F4 | 3500 | 20 | 175 |
| F5 | 4500 | 16 | 281 |
| F6 | 5500 | 12 | 458 |
| F7 | 6500 | 9 | 722 |
| F8 | 7500 | 6 | 1250 |
| F9 | 8500 | 4 | 2125 |
| F10 | 9500 | 2 | 4750 |

### System Parameters
| Parameter | Value | Notes |
|-----------|-------|-------|
| Sampling rate | 20 kHz | Output rate |
| Control rate | 100 Hz | Parameter update rate |
| Shaping network | 12 dB/oct rolloff | Complex conjugate pole pair |
| Radiation | 6 dB/oct rise | Differentiator |

## Implementation Details

### Voiced Fricative Excitation Network (Fig. 2)
1. Pitch pulses excite B1 resonator tuned to F1 of voiced component
2. Subtract threshold V_TH from resonator output
3. Half-wave rectify result (models turbulence threshold)
4. Modulate noise generator output with rectified signal
5. Feed modulated noise to fricative network (lower branch)
6. Add to voiced component from upper branch

**Key insight**: Turbulence only produced when volume velocity exceeds threshold

### Voice Bar Generation
- Simple: gate shaped pitch pulses through AVB amplitude control
- Produces low-frequency, low-energy waveform
- Matches characteristics of natural voice bars

### Sound Class Synthesis Routing

| Sound Class | Upper Branch | Lower Branch | Middle Branch |
|-------------|--------------|--------------|---------------|
| Vowels, semivowels, liquids, glides | Pitch pulses | - | - |
| Voiced stops (closure) | - | - | AVB |
| Voiced stops (transition) | Pitch pulses | - | - |
| Voiceless stops (burst) | - | AFRIC noise | - |
| Voiceless stops (aspiration) | Noise | - | - |
| Voiceless stops (transition) | Pitch pulses | - | - |
| Voiceless fricatives | - | AFRIC noise | - |
| Voiced fricatives | Pitch pulses | Modulated noise | - |
| Nasals | Pitch pulses (ANASAL=1) | - | - |
| /h/, whispered speech | Noise | - | - |
| Affricates | Stop-like → fricative-like | | |

## Figures of Interest
- **Fig. 1 (p. 2)**: Complete block diagram of serial synthesizer
- **Fig. 2 (p. 3)**: Voiced fricative excitation network detail
- **Fig. 3 (p. 3)**: Spectrograms comparing synthetic vs natural /z/ and /ʒ/
- **Fig. 4 (p. 4)**: Z-plane pole positions for 10 kHz synthesizer
- **Fig. 5 (p. 4)**: Digital vs analog higher-pole correction comparison
- **Fig. 6 (p. 5)**: Spectrograms of synthetic utterances
- **Fig. 7 (p. 6)**: Parallel synthesizer block diagram

## Results Summary
- /z/ and /ʒ/ identified 100% correctly in VCV tests (15 possible responses)
- /v/ and /ð/ synthesized without unvoiced component (like vocalic sounds)
- Spectrograms show pitch-synchronous modulation visible in voiced fricatives
- Voice bars visible as low-frequency striations during stop closures

## Serial vs Parallel Synthesizer Comparison

### Serial Advantages
- No individual formant amplitudes needed (simpler rules)
- Produces spectra with only poles (no extraneous zeros)
- Better for synthesis-by-rule research

### Parallel Advantages
- Noise propagates additively (better for limited register length)
- Smaller signal sizes for given SNR
- Independent formant amplitude control (better for vocoder/spectrogram synthesis)

### Serial Disadvantages
- Noise propagates multiplicatively
- No direct control of formant amplitudes

### Parallel Disadvantages
- Extraneous zeros between resonances (may be audible)
- Zero positions move with resonance changes
- Unreliable higher-pole correction via zeros

## Limitations
- No dynamic source control (only pulse rate varies)
- Lower formants of synthetic voiced fricatives stronger than natural speech
- Formal quality tests not conducted (only informal listener comments)

## Relevance to Qlatt Project
- **Direct application**: Architecture matches Klatt synthesizer structure
- **Voiced fricative network**: Pattern for implementing pitch-synchronous frication
- **Voice bar**: Simple AVB control approach usable for voiced stops
- **Higher-pole correction**: Validates digital approach using fixed high-frequency resonators
- **Serial vs parallel**: Confirms serial for synthesis-by-rule, parallel for formant amplitude control

## Open Questions
- [ ] Exact threshold value V_TH for voiced fricative network?
- [ ] B1 resonator bandwidth for voiced fricative excitation?
- [ ] How does the 100 Hz control rate compare to Klatt's 5 ms (200 Hz)?

## Related Work Worth Reading
- Flanagan (1965) - Speech Analysis, Synthesis and Perception (reference for theory)
- Fant (1960) - Acoustic Theory of Speech Production
- Holmes, Mattingly & Shearme (1964) - Speech Synthesis by Rule (parallel synthesizer)
- Rabiner (1968) - Speech Synthesis by Rule: An Acoustic Domain Approach (companion paper)
- Gold & Rabiner (to be published) - Analysis of Digital and Analog Formant Synthesizers
