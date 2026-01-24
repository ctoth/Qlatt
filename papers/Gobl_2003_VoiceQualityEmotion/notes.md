# The Role of Voice Quality in Communicating Emotion, Mood and Attitude

**Authors:** Christer Gobl, Ailbhe Ní Chasaide
**Year:** 2003
**Venue:** Speech Communication 40, pp. 189-212
**DOI/URL:** PII: S0167-6393(02)00082-1

## One-Sentence Summary
Provides KLSYN88 voice source parameter settings for synthesizing 7 distinct voice qualities (modal, tense, breathy, whispery, creaky, harsh, lax-creaky) with perceptual validation linking each to affective states.

## Problem Addressed
- Voice quality is critical for expressing affect but poorly understood due to methodological difficulties
- Most emotion research focused on f0, intensity, timing - voice quality neglected
- Need acoustic parameterization of voice qualities for synthesis applications
- Traditional impressionistic labels (breathy, harsh) poorly defined across researchers

## Key Contributions
1. Complete KLSYN88 parameter trajectories for 7 voice qualities (Fig. 1)
2. Perceptual mapping of voice qualities to 16 affective attributes
3. Evidence that voice quality signals milder states/moods better than strong emotions (except anger)
4. Introduction of "lax-creaky" voice quality not in Laver (1980)

## Methodology
1. Recorded Swedish utterance "ja adjö" from male speaker with modal voice
2. Inverse filtered 106 glottal pulses, matched to LF model
3. Converted LF parameters (EE, RA, RG, RK) to KLSYN88 parameters (AV, TL, OQ, SQ)
4. Synthesized modal voice via copy synthesis
5. Modified source parameters to create 6 non-modal qualities
6. Perception test: 12 listeners rated 7 stimuli on 8 attribute pairs (10 randomizations each)

## Key Equations

LF model to KLSYN88 parameter mapping (from Mahshie & Gobl, 1999):

- **AV** (amplitude of voicing) ← derived from **EE** (excitation strength)
- **TL** (spectral tilt) ← derived from **RA** and **f0**
- **OQ** (open quotient) ← derived from **RG** and **RK**
- **SQ** (speed quotient) ← derived from **RK**

Where:
- $EE$ = amplitude of differentiated glottal flow at main discontinuity
- $RA$ = residual airflow after main excitation
- $RG$ = glottal frequency normalized to f0
- $RK$ = glottal pulse skew (ratio of opening/closing branch durations)

## Parameters

### KLSYN88 Source Parameters Used

| Parameter | Symbol | Description | Range in Study |
|-----------|--------|-------------|----------------|
| Fundamental frequency | f0 | Pitch | 60-150 Hz |
| Amplitude of voicing | AV | Source amplitude | 30-55 dB |
| Spectral tilt | TL | High-frequency rolloff | 0-30 dB |
| Open quotient | OQ | Fraction of cycle glottis open | 30-100% |
| Speed quotient | SQ | Asymmetry of glottal pulse | 100-400% |
| Aspiration noise | AH | Turbulence amplitude | 0-55 dB |
| Diplophonia | DI | Alternating pulse perturbation | 0-30% |
| First formant bandwidth | B1 | Affects coupling to subglottal | 50-250 Hz |

### Voice Quality Parameter Settings (from Fig. 1, approximate values)

| Quality | f0 | AV | TL | OQ | SQ | AH | DI | B1 |
|---------|-----|-----|-----|-----|-----|-----|-----|-----|
| **Modal** | 120 Hz baseline | 50-55 dB | 10-15 dB | 50-55% | 270-300% | 0 | 0 | 120-150 Hz |
| **Tense** | +5 Hz | 42-48 dB | 5-8 dB | 35-40% | 350-400% | 0 | 0 | 50-70 Hz |
| **Harsh** | +5 Hz (=tense) | 42-48 dB | 5-8 dB | 35-40% | 350-400% | 0 | 10-20% | 50-70 Hz |
| **Breathy** | baseline | 35-42 dB | 20-30 dB | 85-95% | 130-170% | 35-50 dB | 0 | 200-250 Hz |
| **Whispery** | baseline | 30-40 dB | 22-30 dB | 70-80% | 170-220% | 45-55 dB | 5% | 200-250 Hz |
| **Creaky** | -30 Hz | 50-55 dB | 10-15 dB | 45-55% | 270-300% | 0 | 5-25% | 120-150 Hz |
| **Lax-creaky** | -30 Hz | 35-42 dB | 20-30 dB | 45-55% | 130-170% | AH-20 dB | 15-25% | 200-250 Hz |

### Key Transforms from Modal to Non-Modal (Section 3.5)

**Tense voice:**
- Lower OQ (shorter open phase)
- Higher SQ (faster closing)
- Lower TL (less spectral tilt = brighter)
- Narrower B1
- +5 Hz f0

**Breathy voice:**
- Lower AV
- Higher OQ (longer open phase)
- Lower SQ (slower closing)
- Higher TL (more tilt = darker)
- Wider B1
- Add AH (aspiration noise)

**Creaky voice:**
- -30 Hz f0 (reduced to -20 Hz at stress peaks)
- DI = 25% baseline, reducing to 5% at f0 peaks

**Lax-creaky voice:**
- Breathy source settings BUT:
- OQ values from creaky voice
- -30 Hz f0
- AH reduced by 20 dB
- DI = 25% baseline, reducing to 15% at f0 peaks

**Harsh voice:**
- Tense voice settings + DI = 10-20%

**Whispery voice:**
- Similar to breathy but:
- Relatively lower AV
- Higher AH
- Slightly lower OQ
- Slightly higher SQ
- DI = 5% throughout
- Required reducing formants from 6 to 5 to avoid "whistling"

## Implementation Details

### KLSYN88 Specifics
- Sampling rate: 10 kHz (16 kHz caused unpredictable behavior)
- Update interval: 5 ms
- 6 formant resonators (5 for whispery)
- Uses modified LF model (different from standard LF - see Mahshie & Gobl, 1999)

### AH Parameter Behavior
- Pseudo-random noise with flat spectrum above 1 kHz
- 12 dB rolloff below 1 kHz (at 100 Hz)
- When AV non-zero: noise amplitude modulated by 50% reduction in second half of glottal period
- Results in stronger aspiration during open phase

### DI Parameter (Diplophonia/Creakiness)
- Alters every second pulse
- Shifts pulse toward preceding pulse
- Reduces amplitude proportionally
- Creates period-doubling effect characteristic of creaky voice

### Data Reduction for Synthesis
- 106 analyzed pulses reduced to 7-15 timepoints per parameter
- Timepoints chosen for optimal linear interpolation
- Stylization similar to Carlson et al. (1991) but from pulse-by-pulse analysis

## Figures of Interest
- **Fig. 1 (page 199):** Complete parameter trajectories for all 7 voice qualities - THE KEY FIGURE for implementation
- **Fig. 2 (page 203):** Box plots of listener ratings by voice quality and attribute
- **Fig. 3 (page 204):** Mean ratings across all qualities and attributes - shows clustering
- **Fig. 4 (page 204):** Maximum ratings per attribute - shows which affects are well-signaled

## Results Summary

### Voice Quality → Affect Mappings

| Voice Quality | Primary Associations | Secondary Associations |
|---------------|---------------------|----------------------|
| **Tense** | Stressed, Angry, Confident, Formal, Hostile | Interested, (mildly Happy) |
| **Harsh** | Same as Tense (not differentiated) | - |
| **Breathy** | Relaxed, Content | Intimate, Friendly, (mildly Sad) |
| **Whispery** | Timid, Afraid | Similar to Breathy |
| **Creaky** | Similar to Breathy but weaker | - |
| **Lax-creaky** | Bored, Relaxed, Intimate, Content | Sad, Friendly |
| **Modal** | Slightly toward Confident, Formal, Stressed | Neutral baseline |

### Key Findings
1. Voice quality differentiates **activation/arousal**, not valence
2. Tense/harsh = high activation cluster; breathy/whispery/creaky/lax-creaky = low activation
3. Strong emotions (except anger) poorly signaled by voice quality alone
4. Milder states (relaxed, stressed, bored, intimate) well signaled
5. No one-to-one mapping: each quality → cluster of affects
6. Lax-creaky most potent for boredom (not standard creaky)
7. Whispery best for fear/timidity but still weak

### Statistical Significance
- 2-way ANOVA: voice quality and subject both highly significant
- Voice quality/subject interaction present
- Table 1: pairwise significance levels (p < 0.001 for most comparisons)
- Tense vs Harsh: NOT significant (too similar)
- Breathy vs Whispery: only significant for afraid/timid

## Limitations
1. Synthetic stimuli may not perfectly capture natural voice qualities
2. Harsh voice stimulus may need more extreme aperiodicity
3. Whispery voice difficult to synthesize (required formant reduction)
4. Single points on voice quality continua tested
5. f0 held relatively constant (intrinsic variations only)
6. Male voice only
7. Irish English listeners only (cross-language effects unknown)
8. Strong emotions may require f0 dynamics in addition to voice quality

## Relevance to Project

### Direct Implementation Value
- **Fig. 1 parameters** can be adapted for Qlatt to add voice quality variation
- Provides baseline settings for modal → non-modal transforms
- DI parameter equivalent needed for creaky/harsh synthesis

### Klatt Synthesizer Considerations
- KLSYN88 uses modified LF model (not identical to standard Klatt)
- AH modulation by glottal phase is important for natural breathiness
- Whispery voice needs high-frequency attenuation to avoid artifacts

### For Qlatt Implementation
1. Add DI (diplophonia) parameter for creaky/harsh voices
2. Implement AH modulation synchronized to glottal cycle
3. Consider B1 widening for breathy qualities
4. TL increase for breathy/lax qualities
5. OQ/SQ manipulation for tense vs lax continuum

## Open Questions
- [ ] How does modified LF in KLSYN88 differ from standard Klatt source?
- [ ] What is optimal DI implementation in time domain?
- [ ] Can pulse-by-pulse variation in parameters improve naturalness?
- [ ] What f0 dynamics combine with these voice qualities for emotions?

## Related Work Worth Reading
- Klatt & Klatt (1990) - KLSYN88 documentation, voice quality analysis
- Mahshie & Gobl (1999) - LF to KLSYN88 parameter mapping (CRITICAL)
- Fant et al. (1985) - LF model specification
- Laver (1980) - Phonetic description framework for voice qualities
- Ní Chasaide & Gobl (1997) - Voice source variation handbook chapter
- Burkhardt & Sendlmeier (2000) - Emotional speech with KLSYN88
