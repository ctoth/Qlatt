# Acoustic analysis of the effects of sustained wakefulness on speech

**Authors:** Adam P. Vogel, Janet Fletcher, Paul Maruff
**Year:** 2010
**Venue:** Journal of the Acoustical Society of America, Vol. 128, No. 6, pp. 3747-3756
**DOI:** 10.1121/1.3506349

## One-Sentence Summary
This paper documents how acoustic properties of speech (timing, F0 variation, F4 variation, spectral tilt) change systematically during 24 hours of sustained wakefulness, providing empirical data on fatigue-induced speech degradation patterns.

## Problem Addressed
No prior studies had systematically examined pitch and timing changes in healthy adults over 24 hours of sustained wakefulness using objective acoustic measures and within-subject designs. Previous work used small samples, poor recording quality, subjective measures, or periods >34 hours.

## Key Contributions
- First systematic acoustic documentation of speech changes during short-term (24h) sleep deprivation
- Identified specific acoustic correlates of fatigue: increased F0 variation, F4 variation changes, timing changes (slower speech rate, longer pauses), increased alpha ratio (spectral tilt)
- Found peak fatigue effect occurs just before dawn (~22h post-baseline, around 06:00)
- Different speech tasks (automated vs reading) show different fatigue patterns

## Methodology
- 18 healthy adults (11 male, 7 female), ages 18-28
- Speech samples recorded every 4h until midnight, then every 2h until 08:00
- Five speech tasks: reading (GRAN), sustained vowel /a:/ (AAAH), extemporaneous speech (FREE), counting 1-20 (C120), days of week (DAYS)
- Acoustic analysis using PRAAT
- Within-subject effect sizes (Dunlap's d) computed for change from baseline

## Key Equations

Equivalent sound level (Leq):
$$
L_{eq} = 10 \log_{10} \left[ \frac{(1/T) \int P_a^2 \cdot dt}{P_{ref}^2} \right]
$$
Where: $P_a$ = sound pressure (Pa), $P_{ref}$ = reference pressure (20 × 10⁻⁶ Pa), $T$ = time (s)

Dunlap's d (within-subject effect size):
$$
d = t \left[ \frac{2(1-r)}{n} \right]^{1/2}
$$
Where: $t$ = t-statistic, $r$ = correlation across pairs, $n$ = sample size

Alpha ratio:
$$
\alpha = \frac{\text{Energy} \leq 1\text{ kHz}}{\text{Energy } 1\text{-}8\text{ kHz}}
$$

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Fundamental frequency | f0 | Hz | - | - | Remained stable; variation increased |
| F0 standard deviation | f0 SD | Hz | - | - | Increased with fatigue (peak at 22h) |
| F0 coefficient of variation | f0 CoV | - | - | - | Increased with fatigue |
| Formant 4 | F4 | Hz | - | - | Variation decreased with fatigue |
| F4 standard deviation | F4 SD | Hz | - | - | Peak change at 20-22h |
| Alpha ratio | α | dB | - | - | Increased (steeper spectral tilt) |
| Mean pause length | - | ms | - | - | Increased on reading task |
| Total speech time | - | s | - | - | Increased on reading task |
| Speech rate | - | syl/s | - | - | Decreased on reading task |
| Leq | Leq | dB | ~58 | 57.5-59.8 | Remained stable (~58 dB) |
| Intensity threshold | - | - | 0.65 | - | Of distance between ref and floor |
| Min pause duration | - | ms | 15 | - | For pause detection |
| Min speech duration | - | ms | 30 | - | For pause detection |
| Formant ceiling (male) | - | Hz | 5000 | - | High-end filter for formant analysis |
| Formant ceiling (female) | - | Hz | 5500 | - | High-end filter for formant analysis |

## Implementation Details

### Recording Setup
- Sampling rate: 44.1 kHz, 16-bit quantization
- Microphone: Logitech A-0374A USB headset, uni-directional
- Sensitivity: -38 dB, frequency range 100 Hz - 16 kHz
- Position: 45° angle, 8 cm from mouth
- Software: Audacity

### Pause Detection Algorithm (Rosen et al. 2010 modification)
1. Calculate intensity contour
2. Set reference intensity = 0.95 × maximum intensity
3. Set intensity threshold = 0.65 × (reference - floor)
4. Mark segments below threshold as pauses
5. Concatenate pause segments < 15 ms with adjacent speech
6. Concatenate speech segments < 30 ms with adjacent pauses

### Sample Truncation
- AAAH task: 1.5 s each side of temporal midpoint (3 s total analysis window)
- FREE task: 20 s each side of temporal midpoint (40 s total)
- GRAN/C120/DAYS: Remove silence from start/end only

### Formant Extraction
- From middle 3 s of sustained vowel /a:/
- High-end frequency filter: 5000 Hz (male), 5500 Hz (female)

## Figures of Interest
- **Fig 1 (p. 3750):** F0 measures over time - shows f0 SD and CoV increase after 16h, peak at 22h
- **Fig 2 (p. 3751):** F4 variation on sustained vowel - greatest change at 20-22h post-baseline
- **Fig 3 (p. 3751):** Timing measures on reading task - speech rate decrease, pause length increase
- **Fig 4 (p. 3752):** Timing on automated tasks - opposite pattern (faster, shorter pauses)
- **Fig 5 (p. 3752):** Alpha ratio on FREE task - increases with fatigue
- **Table II (p. 3752):** Leq remains stable (57.5-59.8 dB) across all sessions

## Results Summary

### Frequency Changes
- f0 mean: No significant change
- f0 variation (SD, CoV): Significant increase from 16-24h, peak at 22h
- F1-F3: No significant change (d < 0.2)
- F4 variation: Significant decrease at 18-22h, return to baseline at 24h

### Timing Changes (Reading Task)
- Total speech time: Increased
- Mean pause length: Increased
- Total signal time: Increased
- Speech rate: Decreased
- Number of pauses: No change

### Timing Changes (Automated Tasks)
- Opposite pattern: speech-to-pause ratio increased
- Pause length decreased (C120)
- Speaking rate increased (DAYS)
- Suggests compensation strategies

### Spectral Changes
- Alpha ratio: Increased (steeper spectral tilt)
- Leq: Stable throughout (no loudness change)

### Temporal Pattern
- Changes begin ~16h post-baseline (midnight)
- Peak effect at 22h post-baseline (06:00, just before dawn)
- Partial recovery at 24h (08:00, sunrise)
- Pattern mirrors psychomotor performance decline

## Limitations
- Small sample size (N=18)
- Single 24h period (no repeated measures across days)
- Significance levels not adjusted for multiple comparisons (exploratory)
- Only healthy young adults (18-28 years)
- Controlled environment may not generalize to real-world fatigue

## Relevance to Project

**Direct relevance to voice quality synthesis module.** This paper validates and extends the existing `reports/voice-quality-synthesis.md` architecture:

### Confirms Existing Design Decisions

| Existing Architecture | Vogel 2010 Evidence |
|-----------------------|---------------------|
| France (2000): F0 features ineffective for affect | F0 *mean* stable throughout; only F0 *variation* changed |
| Alpha ratio/spectral tilt as key marker | Alpha ratio increased with fatigue (Fig 5, p. 3752) |
| Laukka (2008): pauseScale for anxiety | Task-dependent pause changes (Figs 3-4) |
| Formant modulation > F0 for perception | F4 variation changed; F1-F3 remained stable |

### New Emotion Preset: `fatigued`

Add to `EMOTION_PROFILES` in voice-quality-synthesis.md:

```javascript
fatigued: {
  rdDelta: +0.2,           // Slight breathiness (α ratio increase)
  f0Scale: 1.0,            // F0 mean unchanged (Vogel Fig 1)
  f0Variance: 1.3,         // F0 SD/CoV INCREASED 16-24h (Fig 1)
  durationScale: 1.15,     // Slower speech rate on reading (Fig 3)
  intensityBoost: 0,       // Leq stable (Table II: ~58 dB)
  ahBoost: 2,              // Mild aspiration increase
  pauseScale: 1.3,         // Longer pauses on cognitively demanding tasks
  // Spectral tilt
  spectralTiltBoost: +3,   // Alpha ratio increase (Fig 5)
  // F4 variation decrease (unique to fatigue)
  f4VarianceScale: 0.7,    // F4 SD decreased at 20-22h (Fig 2)
  // Formants F1-F3 stable
  f1Delta: 0,
  f2Delta: 0,
  f3Delta: 0,
  fbw1Scale: 1.0,
  fbw2Scale: 1.0,
  fbw3Scale: 1.0
}
```

### Task-Dependent Timing (Novel Finding)

Vogel shows opposite timing effects by task complexity:
- **Reading tasks**: Slower rate, longer pauses (cognitive load + fatigue)
- **Automated tasks**: Faster rate, shorter pauses (compensation strategy)

This suggests `pauseScale` could be task-aware:

```javascript
// Task complexity modulates fatigue timing effects
function getFatiguePauseScale(taskComplexity, fatigueLevel) {
  if (taskComplexity === 'high') {
    return 1.0 + 0.3 * fatigueLevel;  // Pauses increase
  } else {
    return 1.0 - 0.2 * fatigueLevel;  // Pauses decrease (compensation)
  }
}
```

### Temporal Pattern

Peak fatigue effect at **22h post-baseline (06:00, pre-dawn)** with partial recovery at sunrise. Relevant for:
- Time-of-day voice variation modeling
- Circadian rhythm simulation
- "Morning voice" vs "evening voice" presets

## Open Questions
- [ ] Add `fatigued` preset to EMOTION_PROFILES in tts-frontend-rules.js
- [ ] Implement F4 variation scaling (unique to fatigue; not in current architecture)
- [ ] Add task-complexity parameter to modulate pause behavior
- [ ] How does fatigue interact with existing emotion presets? (e.g., fatigued + anxious)
- [ ] Validate alpha ratio → Rd mapping: increased alpha ratio ≈ +0.2 Rd delta?

## Related Work Worth Reading
- Klatt & Klatt (1990) - Voice quality variations, breathiness effects on formants
- Gauffin & Sundberg (1980, 1989) - Spectral correlates of glottal source
- Laukkanen et al. (2008) - Vocal fatigue acoustic measures
- Nilsonne (1987, 1988) - f0 variation in depression
- Harrison & Horne (1997) - Perceptual study of sleep deprivation effects on speech

---

## Collection Cross-References

### Already in Collection
- [[Klatt_1990_VoiceQualityVariations]]
- [[Laukka_2008_AnxietyVocalExpression]]
- [[Sun_2006_VocalTractGlottalSource]]

### New Leads (Not Yet in Collection)
- **Gauffin & Sundberg (1980, 1989)** - Glottal source waveform characteristics and spectral correlates - Fundamental for understanding how source modifications (like those during fatigue) affect the output spectrum.
- **Nilsonne et al. (1988)** - F0 variation during depression - Relevant because depression and fatigue show similar acoustic patterns; useful for implementing affective speech states.
- **Hillenbrand et al. (1994, 1996)** - Acoustic correlates of breathy voice - Discusses how breathiness (relevant to fatigue) affects higher formants and spectral characteristics.
