# Childers et al. 1990 — Electroglottography and Vocal Fold Physiology

## Implementation-Relevant Notes

### EGG Mathematical Model (Eq. 1)

```
EGG(t) = k / [A(t) + C]
```

Where:
- `A(t)` = vocal fold contact area as a function of time
- `k` = scaling constant
- `C` = constant proportional to shunt impedance (when A(t) = 0)

This is the core relationship: EGG signal is inversely proportional to vocal fold contact area plus a shunt term. Low EGG values = high contact area (folds closed); high EGG values = low contact area (folds open/apart).

### EGG-to-Glottal-Event Correspondences

Key relationships validated by synchronized ultra-high-speed laryngeal film + EGG data (4 normal male subjects, 8 patients with vocal disorders):

1. **Glottal closure instant** <-> **Maximum negative peak in DEGG (differentiated EGG)**
   - Most reliable correspondence
   - Average difference: ~0.5 samples at 10 kHz (0.05 ms)
   - SD: ~2 samples (0.2 ms)

2. **Glottal opening instant** <-> **Maximum positive peak in DEGG**
   - Less reliable than closure
   - Average difference: ~2.5 samples (0.25 ms)
   - SD: ~7 samples (0.7 ms)
   - Corresponds to inflection point in EGG (concave up -> concave down)
   - Approximately equals the upward zero crossing of EGG

3. **Maximum glottal area** <-> **Maximum positive peak in normalized EGG**
   - Average difference: ~3-4 samples (0.3-0.4 ms)

### Open Quotient (OQ)

```
OQ = duration_of_glottal_open_phase / duration_of_glottal_cycle
```

OQ from EGG agrees well with OQ from glottal area:
- Normal subjects (complete data): OQ_area = 0.71 (SD 0.12), OQ_EGG = 0.61 (SD 0.13)
- Normal subjects (closed phase data): OQ_area = 0.63 (SD 0.08), OQ_EGG = 0.62 (SD 0.10)
- Best agreement when complete glottal closure is present

### Relative Average Perturbation (RAP) — Jitter Measure (Eq. 2)

```
RAP = [1/N * sum(P(i))]^(-1) * [1/(N-2)] * sum_{i=2}^{N-1} |[P(i-1)+P(i)+P(i+1)]/3 - P(i)|
```

Where P(i) = pitch period for interval i, N = total intervals.

RAP from EGG and glottal area agree well:
- Normal subjects: RAP_area = 1.99% (SD 1.64), RAP_EGG = 1.73% (SD 1.50)

### Effect of F0 on Glottal Area Shape

Three representative glottal area curves observed at different F0s (Figure 6):
- **Low F0 (125 Hz)**: More symmetric opening/closing phases
- **Medium F0 (170 Hz)**: Slightly asymmetric
- **High F0 (340 Hz)**: Opening phase much longer than closing phase

The ratio of glottal opening phase to closing phase increases with increasing F0. Speed quotient confirms this.

### Closing Vocal Fold Contact Interval

Defined from DEGG:
1. Find maximum negative peak in DEGG (instant of closure)
2. Set threshold 10% above DEGG minimum
3. Measure interval between two points on either side of minimum that equal/exceed threshold

For normal subjects: ranges from ~0.4 ms to ~3.4 ms (4-34 samples at 10 kHz).
- Decreases with increasing phonation intensity (independent of frequency)
- Potentially useful for studying vocal efficiency and quality

### Key EGG Waveform Phases (Figure 1 — Idealized Model)

1. **Points 1-2**: Vocal folds maximally closed, maximum contact area
2. **Points 2-3**: Folds parting, usually lower margins to upper margins, posterior to anterior
3. **Point 3**: Break point (when present) = folds opening along upper margin
4. **Points 3-4**: Upper fold margins continue to open
5. **Points 4-5**: Folds apart, minimum contact area (open phase)
6. **Point 5**: Folds in contact along lower margin, glottal area zero
7. **Points 5-6**: Folds closing from lower to upper margin, anterior to posterior
8. **Points 6-1**: Rapid increase in vocal fold contact (closed phase)

### Key Observations for Synthesizer Implementation

- EGG minimum (maximum contact) occurs AFTER instant of glottal closure — not at closure instant as Baer et al. (1983) reported
- EGG begins to increase from its minimum while glottis is still closed or at minimum size — reflects separation beginning from inferior surfaces toward upper margins
- Once vocal folds completely separate, EGG reaches maximum — but folds may continue moving apart (increasing glottal area) with no further EGG change
- During vocal fold closure, EGG remains approximately constant while folds press together
- The rapid decrease in EGG at closure is the most consistently observed feature in normal chest register
- A breathy voice may produce an EGG similar to one with complete closure — EGG reveals little about voice quality alone
- Mucous strand breaking can cause spurious DEGG positive peaks after glottal opening

### Data Summary Tables

**Table 4 — Normal subjects, average values:**

| Measure | Complete data | Closed phase data |
|---------|-------------|-------------------|
| Opening instant diff (samples) | -2.47 (7.00) | -2.08 (5.75) |
| Closing instant diff (samples) | -0.48 (2.37) | -0.55 (2.30) |
| Peak instant diff (samples) | -4.14 (4.84) | -4.14 (4.84) |
| OQ from area | 0.71 (0.12) | 0.63 (0.08) |
| OQ from EGG | 0.61 (0.13) | 0.62 (0.10) |
| RAP from area (%) | 1.99 (1.64) | 1.32 (1.07) |
| RAP from EGG (%) | 1.73 (1.50) | 1.37 (1.56) |

Negative difference = EGG/DEGG event lagged corresponding glottal event. All at 10 kHz sample rate.

**Table 5 — Pathological subjects (8 patients), averages:**

| Measure | Average |
|---------|---------|
| Opening instant diff (samples) | -7.37 (13.33) |
| Closing instant diff (samples) | -0.28 (10.00) |
| OQ from area | 0.76 (0.12) |
| OQ from EGG | 0.59 (0.20) |

Patient data shows larger mean differences and standard deviations than normal subjects.

### Experimental Details

- 4 normal male subjects, 9 tasks each (3 F0 targets x 3 intensity targets)
- 8 patients with vocal disorders (hoarse, breathy, nodule, polyp, paralysis)
- Ultra high-speed laryngeal films at up to 5000 fps
- Glottal area sampled at 5 kHz, interpolated to 10 kHz
- EGG sampled at 10 kHz from synchronized film traces
- ~3000 film frames for normal subjects (~100+ pitch periods)
- ~1000+ film frames for patients
- 60% of normal data had complete glottal closure; 40% had incomplete closure (dc-offset removed)
