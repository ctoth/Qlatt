# Simulation of Differences Between Male and Female Vocal Fold Configuration During Phonation

**Authors:** M. Kob, Ph. Dejonckere, E. Calderon, S. Kaynar
**Year:** 2009
**Venue:** NAG/DAGA 2009 - Rotterdam (International Conference on Acoustics)
**DOI/URL:** N/A (conference proceedings)

**Note:** The directory name attributes this to "Lucero 2009" but the paper is actually Kob et al. 2009. The naming discrepancy is preserved to avoid breaking existing references.

## One-Sentence Summary

Uses a multiple-mass vocal fold model (VOX) to simulate how gender-related differences in vocal fold geometry produce different contact force distributions, explaining the much higher prevalence of vocal fold nodules in females.

## Problem Addressed

Vocal fold nodules are ~95% female and ~5% male. The approximately 2x higher F0 in females only partially explains this. The paper investigates whether anatomical differences in laryngeal framework geometry (thyroid cartilage angle, vocal fold shape) lead to different impact stress patterns that could account for the differential prevalence.

## Key Contributions

- Demonstrates that female vocal fold geometry produces more localized contact forces (hourglass-shaped vibration pattern), while male/linear geometries distribute forces more broadly
- Provides quantitative simulation evidence linking laryngeal framework geometry to vocal fold impact stress distribution
- Validates the clinical concept of "hourglass-shaped" vibration pattern as a mechanism for localized tissue damage

## Methodology

Used the VOX multiple-mass model (Kob 2002) with 14 mass-pairs per side. Three configurations were simulated:
1. **Female** — based on mean pre-phonatory rest positions (n=10 subjects, from Dejonckere 2001)
2. **Male** — based on mean pre-phonatory rest positions (n=9 subjects)
3. **Linear** — straight vocal fold edges (control case)

Contact forces in the x-direction (main oscillation direction) were recorded for upper and lower masses during continuous phonation.

## Key Equations

No explicit equations given in this short proceedings paper. The model is described in [2] (Kob 2002).

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Female vocal fold length | — | mm | — | 13-17 | Adult female |
| Male vocal fold length | — | mm | — | 15-23 | Adult male |
| Female thyroid angle | — | degrees | 120 | — | Between left and right laminae |
| Male thyroid angle | — | degrees | 90 | — | Between left and right laminae |
| Female mean F0 | — | Hz | ~220 | — | Speaking frequency |
| Male mean F0 | — | Hz | ~120 | — | Speaking frequency |
| Sub-glottal pressure | — | Pa | 980 | — | Used in simulation |
| Effective stress | — | kPa | 60 | — | Used in simulation |
| Dorsal gap | — | mm | 1.2 | — | Between vocal folds |
| Mass pairs per side | — | — | 14 | — | In caudal-cranial dimension |

## Implementation Details

- The VOX model uses 2 masses vertically x 14 mass-pairs in caudal-cranial direction per side
- Pre-phonatory rest positions from Dejonckere 2001 define the vocal fold edge shape
- Female configuration: slightly concave/curved vocal fold edges
- Male configuration: relatively straight vocal fold margins
- The model tracks contact forces along the entire vocal fold length for upper and lower mass layers

## Figures of Interest

- **Fig 1 (page 2):** 3D mesh plots comparing male, female, and linear vocal fold settings — shows the geometric difference in rest configuration
- **Fig 2 (page 2):** 3D surface plot of contact forces (x-component) over time and mass number for all three configurations — key result showing localized vs. distributed impact

## Results Summary

- **Linear case:** Largest contact force amplitudes but broadest distribution along vocal fold length. Zipper-like closing pattern (successive closure along length).
- **Male case:** Smaller amplitudes than linear, but similarly broad distribution. Closing pattern similar to linear (successive).
- **Female case:** Similar amplitudes to male, but narrower/more localized distribution. Closing starts near center and extends ~1/3 of vocal fold length in each direction — the "hourglass" pattern.

The localized impact in the female case corresponds to higher local stress concentration, supporting the hypothesis that geometry contributes to nodule prevalence beyond the F0 difference.

## Limitations

- Very short proceedings paper (2 pages) — limited detail on model parameters and validation
- Small sample sizes for vocal fold shape data (n=10 female, n=9 male)
- No direct comparison with in-vivo measurements of contact forces
- Single subglottal pressure and stress value used — no parametric sweep
- The VOX model details are in the dissertation (Kob 2002), not reproduced here

## Testable Properties

- Female vocal fold configuration should produce more spatially concentrated contact forces than male or linear configurations
- The peak contact force location in female configuration should be near the center of the vocal fold length
- Male and linear configurations should show zipper-like (sequential) closing; female should show center-first closing
- Contact force amplitudes: linear > male ~ female
- Contact force spatial spread: linear ~ male > female

## Relevance to Project

This paper provides physiological grounding for gender-differentiated voice parameters in the synthesizer. The key parameters for Qlatt are the gender-specific F0 ranges (male ~120 Hz, female ~220 Hz), vocal fold length ranges, and the thyroid cartilage angle differences. However, the paper's primary contribution is about vocal pathology mechanics rather than acoustic output parameters, so its direct implementation relevance is limited to informing default parameter ranges for male vs. female voice presets.

## Open Questions

- [ ] The VOX model (Kob 2002) — is it worth implementing for more detailed vocal fold simulation, or does the LF model suffice for synthesis purposes?
- [ ] Could the hourglass vibration pattern affect the glottal waveform shape in ways that are perceptually relevant (e.g., different spectral tilt for female voices)?

## Related Work Worth Reading

- Kob, M.: Physical modelling of the singing voice. Dissertation RWTH Aachen Univ., Logos, Berlin, 2002. (The VOX model details)
- Dejonckere, P.H.: Gender differences in the prevalence of occupational voice disorders. Kugler Publications, 2001. (Source of the vocal fold shape data)
- Jiang, J.J., Titze, I.R.: Measurement of vocal fold intraglottal pressure and impact stress. J Voice 8 (1994). (Experimental validation of impact stress)
- Titze, I.R. (1989) — already in collection as Titze_1989_MaleFemaleVoices — likely covers related male/female voice differences

## Collection Cross-References

### Already in Collection
- [[Titze_1989_MaleFemaleVoices]] — not directly cited, but Titze's work on male-female scale factors (alpha=1.2, beta=1.6) provides the theoretical framework that this paper's simulation builds upon; Titze derives acoustic consequences from anatomy while Kob simulates the contact force mechanics

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Kob, M. (2002) — "Physical modelling of the singing voice" (Dissertation) — contains full specification of the VOX multiple-mass model used here
- Dejonckere, P.H. (2001) — "Gender differences in the prevalence of occupational voice disorders" — source of the male/female vocal fold shape measurements (n=10 female, n=9 male)
- Jiang, J.J. & Titze, I.R. (1994) — "Measurement of vocal fold intraglottal pressure and impact stress" — experimental validation of the kind of contact forces simulated here

### Conceptual Links (not citation-based)
- [[Titze_1989_MaleFemaleVoices]] — Strong. Titze derives male-female voice differences from anatomical scale factors and predicts acoustic consequences (F0, airflow, efficiency, glottal waveform shape). This Kob paper complements Titze by simulating the *mechanical* consequences of those same anatomical differences — specifically the spatial distribution of contact forces. Where Titze shows the acoustic output differs, Kob shows the collision mechanics differ, connecting anatomy to pathology rather than acoustics.
- [[Zhang_2021_LaryngealSizeSexDifferences]] — Moderate. Zhang's 3D finite-element simulations of laryngeal size and sex differences extend the same research question with far more sophisticated modeling (216,000 simulations varying length, thickness, depth). Zhang provides the computational evidence that Kob's 2-page proceedings paper sketches.
- [[Lucero_2005_VocalFoldBifurcations]] — Moderate. Though by a different Lucero (not Kob), this paper models vocal fold bifurcation dynamics that interact with the contact force patterns Kob simulates — both use mass-spring vocal fold models to study pathological vs. normal phonation regimes.
