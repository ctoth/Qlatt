# Gobl 1988 — Voice Source Dynamics in Connected Speech

## Key Contribution

First systematic study of LF model parameter variation during running speech (not just sustained vowels). Provides temporal trajectories of Ee, rg, rk, ra across utterances for 3 adult males and 1 child, yielding **Table III** — a rule table mapping phonetic context to LF parameter ranges suitable for driving a formant synthesizer.

## LF Model Summary (as used in this paper)

The differentiated glottal flow E(t) is modeled with four parameters:

### Segment 1 (opening to excitation):
```
E(t) = E0 * e^(alpha*t) * sin(omega_g * t)
for t0 <= t <= te
```
- `E0`: scale factor
- `alpha = -B*pi` where B is "negative bandwidth" of exponentially growing amplitude
- `omega_g = 2*pi*Fg` where `Fg = 1/(2*tp)`, tp = rising time from glottal opening to max flow

### Segment 2 (return phase):
```
E(t) = -(Ee / (epsilon * ta)) * [e^(-epsilon*(t-te)) - e^(-epsilon*(tc-te))]
for te <= t <= tc
```
- `ta`: time constant of exponential return phase (projection on time axis at te)
- `epsilon`: iteratively determined from `epsilon * ta = 1 - e^(-epsilon*(tc-te))`
- For small ta, epsilon ~ 1/ta
- `Ee`: negative amplitude of excitation spike
- `tc`: time of complete closure (by convention tc = t0 of next period)

### Area balance constraint:
```
integral(0 to t0) E(t)dt = 0
```

## Analysis Parameters Used

Instead of the raw model parameters, the paper uses more convenient analysis parameters:

| Parameter | Definition | Description |
|-----------|-----------|-------------|
| **Ee** | Negative peak of E(t) at te | Excitation strength (arbitrary units) |
| **rg** | Fg / F0 = T0 / (2*tp) | Glottal frequency ratio (% of period) |
| **rk** | (te - tp) / tp = tn / tp | Closing-time to rising-time ratio |
| **ra** | ta / T0 | Return phase time constant as % of period |

### Derived/alternative parameters:
- **Oq** (open quotient): `Oq = (ti + tp + tn) / T0` but redefined as `Oq = te / T0` (time from opening to excitation / period)
- **Fa** (return phase cutoff): `Fa = 1 / (2*pi*ta)` — spectral effect of return phase
- Spectral attenuation from return phase: `delta_La(f) = 10 * log10(1 + f^2 / Fa^2)` dB

## Typical Parameter Values (Table III) — KEY FOR SYNTHESIS

| Context | ra (%) adult | ra (%) child | rk (%) adult | rk (%) child | rg (%) adult | rg (%) child |
|---------|-------------|-------------|-------------|-------------|-------------|-------------|
| **Vowels** | 2-3 | 5-10 | 25-35 | 30-40 | — | — |
| **Nasals and liquids** | like vowels | like vowels | like vowels | like vowels | — | — |
| **Voiced stops; oral closure** | 6-8 | 10-13 | 25-45 | 35-50 | — | — |
| **Voiced stops; oral release** | 10-13 | 13-16 | 50-70 | 50-80 | — | — |
| **Voiced fricatives (except /h/)** | 8-10 | 10-15 | 40-50 | 40-60 | — | — |
| **Voiced glottal fricative /h/** | 10-15 | 10-20 | 40-60 | 40-70 | 100-120 | 90-110 |
| **Devoicing: before voiceless stops** | 6-9 | 10-15 | 35-60 | 40-70 | see (3) | see (3) |
| **Devoicing: before voiceless fricatives** | 8-10 | 10-15 | 40-60 | 40-70 | see (3) | see (3) |
| **Devoicing: prepausal** | 10-15 | 15-20 | 40-60 | 50-80 | — | — |
| **Voice onset: after voiceless stops/frics** | 2-6 | 8-12 | 25-45 | 30-50 | — | — |
| **Voice onset (soft): postpausal** | 4-8 | 10-20 | 40-60 | 50-70 | — | — |
| **Voice onset (hard): postpausal** | 0-2 | 3-6 | 40-50 | 40-60 | — | — |

### Comments on Table III:
1. If devoicing is effected by a glottal stop, ra should be reduced by factor 2-4, rk increased by factor 1.5-2, rg increased by factor 1.3-2.
2. /l/ may exhibit a pattern similar to voiced stops. At oral release, ra value should be 1-3 times the initial ra value. This is more likely in stressed syllables. The ra value for nasals may be increased by factor 1-2.
3. rg may covary moderately with excitation Ee.

## Parameter Distribution (Fig. 15) — From 12 sec adult speech + 2.5 sec child

### Adult males:
| Parameter | Dominant range | Peak % |
|-----------|---------------|--------|
| rg | 87.5-125% | 46% at 100-112.5% |
| rk | 20-50% | 39% at 30-40% |
| ra | 2-5% | 54% at 2-5% |
| Fa | 0.25-1 kHz | 46% at 0.25-0.5 kHz |
| Oq | 40-80% | 44% at 50-60% |

### Child:
| Parameter | Dominant range | Peak % |
|-----------|---------------|--------|
| rg | 87.5-125% | 45% at 87.5-100% |
| rk | 20-60% | 62% at 20-30% |
| ra | 2-10% | 55% at 2-5% |
| Fa | 0.25-1 kHz | 66% at 0.25-0.5 kHz |
| Oq | 40-80% | 48% at 50-60% |

## Key Observations for Synthesis Rules

### Stress effects on Ee:
- Ee is stronger for vowels and weaker for consonants in **focal** (stressed) context
- The nucleus of the stressed syllable is much more prominent relative to surrounding consonants
- /h/ shows the largest weakening: Ee drops 20-25 dB in focal context compared to non-focal
- /l/ shows consistent weakening, but less (ca. 4 dB max)
- /b/ shows no clear evidence of weakening

### Temporal patterns:
- Ee drops during /h/ reaching a minimum just before release — consequence of oral closure and decreasing transglottal pressure
- Ee drops during devoicing before voiceless consonants
- ra and rk increase before voiceless consonants (smoother, more sinusoidal pulses before devoicing)
- ra values before voiceless stops: typically 8-10%, sometimes 3-10x the preceding vowel value
- ra values before voiceless fricatives: similar pattern, slightly lower
- Maximum ra values found at termination of utterance, extends over 200-300 ms, increase takes 20-50 ms

### Voice onset patterns:
- After voiceless stops/fricatives: ra starts low (2-6%), rk starts low (25-45%)
- Postpausal soft onset: ra = 4-8%, rk = 40-60%
- Postpausal hard onset: ra = 0-2%, rk = 40-50% (abrupt closure)

### rg behavior:
- Typically 100-120% for adult males (Fg slightly higher than F0)
- rg is the most stable parameter, varying in narrow range
- Child values slightly lower: 90-110%
- For /h/, rg values are listed in the table (100-120% adult, 90-110% child)

### Covariation between parameters:
- Strong correlation between Ee and rk: stronger excitation → shorter closing time relative to opening time
- When rk < 50%, correlation between rk and ra is positive
- When rk > 50%, main excitation does not coincide with maximum discontinuity; weaker higher harmonics
- ra is inversely proportional to absolute return phase time (independent of F0)

### Adult vs. child differences:
- Child has larger dynamic leakage (higher ra values: 5-12% vs 2-5%)
- Child has higher Oq values
- Child's pulses are more sinusoidal (less sharp excitation)
- rg values slightly lower for child

## Inverse Filtering Methodology

- Recorded in anechoic chamber on FM tape recorder
- B&K condenser microphone, 1" capsule
- Low-pass filtered at 6.3 kHz, sampled at 16 kHz
- High-pass filter at 20 Hz to remove DC
- Inverse filtering using complex-conjugate zeros (one per formant)
- 9 zeros for adult males (vocal tract 19.7 cm), 6 zeros for child (13.1 cm)
- Manual formant tracking using interactive program (INA)
- Source pulse matching using interactive joystick-based program

## Source Rule System Approach (Section 7)

The paper proposes controlling the LF model by rules:
- Let Ee be controlled by the amplitude parameter of the conventional exponential pulse source
- Determine ra, rk, rg from Ee with different proportionality coefficients per phonetic context (Table III)
- This gives a "first tentative approach" to dynamic voice source control in TTS

### Preferred parameterization:
- **Ee** for excitation strength (paramount importance)
- **ra** for return phase (provides intuitive info about glottal pulse shape, independent of F0, directly related to source spectrum)
- **Oq** (open quotient) = te/T0 preferred over rg for relating to earlier literature
- For remaining two parameters: rk and rg, or possibly Fa, or closed quotient combinations

## Resynthesis Quality
- Utterances were resynthesized using inverse-filtered formant values + matched source parameters
- Child's voice was most strikingly improved with the LF model
- Adult male voices also showed considerable enhancement
