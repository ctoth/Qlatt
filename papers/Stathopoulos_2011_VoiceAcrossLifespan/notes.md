# Changes in Acoustic Characteristics of the Voice Across the Life Span: Measures From Individuals 4-93 Years of Age

**Authors:** Elaine T. Stathopoulos, Jessica E. Huber, Joan E. Sussman
**Year:** 2011
**Venue:** Journal of Speech, Language, and Hearing Research, Vol. 54, 1011-1021
**DOI:** 10.1044/1092-4388(2010/10-0036)

## One-Sentence Summary
Provides F0, SPL, and SNR measurements across the full life span (ages 4-93) for 192 speakers, with stepwise regression models showing nonlinear age-dependent trends that differ by sex.

## Problem Addressed
Previous voice production studies used small numbers of participants, had limited age ranges, and produced contradictory results about how acoustic voice characteristics change with aging.

## Key Contributions
- Largest cross-sectional study of voice acoustics across the full life span (192 speakers, ages 4-93)
- Demonstrates that F0, SPL, and SNR follow **nonlinear** trajectories with age
- Shows sex-specific divergence in F0 trends beginning around puberty
- Establishes that acoustic variability (COVARs) follows U-shaped curves — higher in children and elderly

## Methodology
- 192 participants (88 male, 104 female), ages 4-93
- Task: sustain vowel [a] at comfortable pitch and loudness, 3 trials
- Measures: F0 (Hz), SPL (dB), SNR (ratio of periodic to aperiodic energy)
- COVARs (coefficient of variation) computed for variability
- Stepwise regressions with age, age-squared, and sex as predictors

## Key Equations

### SPL Distance Correction (Equation 1)
$$
\text{correction} = 20 \times \log(4/6) = -3.5 \text{ dB}
$$
Applied to SPL data from the 30-93 age group to normalize from 4-cm to 6-cm mouth-to-microphone distance.

## Parameters

### F0 Regression Results

| Group | Predictor | F | p | R² |
|-------|-----------|---|---|-----|
| Combined | Sex | 140.71 | <.001 | .22 |
| Female | Age | 37.60 | <.001 | .48 |
| Female | Age² | 16.87 | <.001 | .55 |
| Male | Age | 122.14 | <.001 | .30 |
| Male | Age² | 88.85 | <.001 | .66 |

### SPL Regression Results

| Group | Predictor | F | p | R² |
|-------|-----------|---|---|-----|
| Combined | Age | 29.60 | <.001 | .13 |
| Combined | Sex | 0.08 | .77 | — |

### SNR Regression Results

| Group | Predictor | F | p | R² |
|-------|-----------|---|---|-----|
| Combined | Sex | 134.86 | .01 | .18 |
| Female | Age | 29.41 | <.001 | .05 |
| Female | Age² | 24.93 | <.001 | .24 |
| Male (linear) | Age | 7.43 | .008 | .08 |
| Male (Age²) | — | 1.43 | .23 | n.s. |

### Participant Age Summary (Table 1)

| Age (years) | n (F) | F M(SD) | F Range | n (M) | M M(SD) | M Range |
|-------------|-------|---------|---------|-------|---------|---------|
| 4 | 6 | 4.5(0.28) | 4.0-4.8 | 6 | 4.6(0.23) | 4.3-4.8 |
| 6 | 6 | 6.4(0.24) | 6.1-6.6 | 6 | 6.2(0.10) | 6.0-6.3 |
| 8 | 6 | 8.5(0.35) | 8.1-8.9 | 6 | 8.4(0.18) | 8.2-8.7 |
| 10 | 6 | 10.2(0.06) | 10.1-10.3 | 6 | 10.4(0.20) | 10.2-10.7 |
| 12 | 6 | 12.4(0.33) | 12.0-12.8 | 6 | 12.6(0.24) | 12.1-12.8 |
| 14 | 6 | 14.4(0.28) | 14.1-14.8 | 6 | 14.3(0.20) | 14.1-14.7 |
| 16 | 6 | 16.3(0.20) | 16.2-16.7 | 6 | 16.3(0.18) | 16.0-16.5 |
| 18 | 6 | 18.6(0.29) | 18.2-18.8 | 6 | 18.4(0.28) | 18.0-18.7 |
| 20 | 6 | 22.4(0.82) | 20.9-23.1 | 6 | 21.6(0.55) | 20.8-22.4 |
| 30 | 6 | 31.6(2.80) | 29.6-37.2 | 6 | 32.4(1.97) | 30.8-36.1 |
| 40 | 6 | 46.3(2.42) | 41.8-48.5 | 4 | 44.7(3.73) | 40.3-48.7 |
| 50 | 6 | 55.0(3.79) | 50.0-58.2 | 6 | 54.4(3.05) | 49.8-59.0 |
| 60 | 7 | 65.0(3.07) | 60.0-68.8 | 5 | 65.5(3.90) | 59.9-69.4 |
| 70 | 11 | 75.2(1.79) | 73.0-79.3 | 6 | 75.4(3.43) | 69.7-79.3 |
| 80 | 10 | 82.3(1.54) | 80.0-84.7 | 7 | 83.5(2.19) | 79.6-86.3 |
| 90 | 4 | 92.2(0.88) | 91.3-93.4 | 0 | — | — |
| **Total** | **104** | | | **88** | | |

## Implementation Details

### F0 Trends by Sex (from Figures 1 and text)
- **Males**: F0 declines steadily from ~300 Hz (age 4) to ~115 Hz (age 50), then rises slightly to ~130 Hz (age 80+)
- **Females**: F0 declines from ~300 Hz (age 4) to ~200 Hz (age 60), then rises slightly after 80
- Nonlinear (age²) regression fits better than linear for both sexes
- The nonlinear fit is **much stronger for males** (R² = .66) than females (R² = .55)

### SPL Trends (from Figure 2)
- SPL increases linearly with age for both sexes combined (R² = .13)
- Sex is NOT a significant predictor of SPL
- No nonlinear component significant

### SNR Trends (from Figure 3)
- **Females**: Nonlinear U-shaped curve — SNR rises to ~6 years, falls until ~50, rises again
- **Males**: SNR increases linearly with age (more noise in young, less in old)
- Sex differences in SNR begin at ~20 years of age
- Women display higher noise characteristics than men beginning in their 50s (menopause)

### Variability (COVAR) Trends
- **F0-COVAR**: Declines from 4 to 30 years, then rises — U-shaped for both sexes
- **SPL-COVAR**: Declines to ~20 years, rises at ~60 years — U-shaped, no sex difference
- **SNR-COVAR**: Nonlinear age-squared only, declines to ~20 then rises at ~50

## Figures of Interest
- **Fig 1 (page 5):** F0 scatter plot by age with linear and nonlinear regression fits, sex-separated
- **Fig 2 (page 5):** SPL scatter plot by age, combined sexes with linear regression
- **Fig 3 (page 6):** SNR scatter plot by age with sex-separated nonlinear (female) and linear (male) fits
- **Fig 4 (page 6):** F0-COVAR scatter plot by age, nonlinear regression
- **Fig 5 (page 6):** SPL-COVAR scatter plot by age
- **Fig 6 (page 7):** SNR-COVAR scatter plot by age

## Results Summary
1. F0 changes are sex-specific and nonlinear: males show U-shaped curve (minimum ~50 years), females show gradual decline
2. SPL increases linearly with age, no sex differences
3. SNR shows sex-specific patterns: females nonlinear (U-shaped), males linear increase
4. All variability measures show U-shaped curves — higher variability at both ends of the life span
5. Average age for menopause (51 years) marks a transition point for female SNR

## Limitations
- Cross-sectional design (not longitudinal)
- Different recording equipment for children vs. adults (required SPL correction)
- Different mouth-to-microphone distances (4 cm vs 6 cm)
- No measures of voice quality beyond SNR (no jitter, shimmer, HNR)
- No control for speaking style or vocal effort beyond "comfortable" instructions
- Small n per age group (typically 6)

## Testable Properties
- F0 at age 4-8 should be ~250-300 Hz for both sexes (pre-pubertal convergence)
- Male F0 minimum occurs around age 50 (~115 Hz)
- Female F0 minimum occurs around age 60 (~200 Hz)
- SPL must increase monotonically with age in the combined-sex model
- Variability (COVAR) for all measures must follow U-shaped curves
- Male SNR increases linearly (more periodic energy with age)
- Female SNR follows nonlinear pattern with inflection at ~50 years

## Relevance to Project
This paper provides the empirical basis for age-dependent voice parameter scaling in the Qlatt synthesizer. Specifically:
- F0 defaults for speaker age profiles (child, young adult, middle-aged, elderly)
- Sex-specific F0 trajectories for age modeling
- SNR/noise characteristics that should vary by speaker age and sex
- Variability parameters (jitter/shimmer proxies) that increase at both ends of the age spectrum

## Open Questions
- [ ] What are the exact regression coefficients (slopes, intercepts) for the nonlinear models? Paper shows F/p/R² but not the actual fitted equations
- [ ] How do these F0 values compare with Peterson & Barney (1952) adult data already in our inventory?
- [ ] Should SPL be modeled in the synthesizer, or is it purely a gain parameter?

## Related Work Worth Reading
- Huber et al. (1999) — F0 and SPL data for ages 4-25 (subset of this data)
- Linville (1996, 2002) — Perceptual indices of aging voice
- Abitbol, Abitbol, & Abitbol (1999) — Sex hormones and female voice
- Hollien (1987) — Old voices review
