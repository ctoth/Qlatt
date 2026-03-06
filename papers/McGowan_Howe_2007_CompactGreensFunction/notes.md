# Compact Green's Functions Extend the Acoustic Theory of Speech Production

**Authors:** R.S. McGowan, M.S. Howe
**Year:** 2007
**Venue:** Journal of Phonetics 35, 259-270
**DOI:** 10.1016/j.wocn.2006.03.001

## One-Sentence Summary
This paper extends the classical source-filter acoustic theory of speech production by introducing compact Green's functions that model the detailed 3D coupling between aerodynamic (hydrodynamic) sources and acoustic radiation in the vocal tract, particularly for pressure sources like sibilant fricatives and aspiration.

## Problem Addressed
The classical acoustic theory (Fant, 1960) uses transfer functions that relate source volume velocity to output at the lips, but does not account for the detailed coupling mechanism between pressure sources and the acoustic field. Specifically, the theory does not explain *why* sibilant pressure sources at sharp edges (like incisors) are so much more effective at generating sound than aspiration sources at the rounded false vocal folds.

## Key Contributions
- Tutorial introduction to Green's functions in the context of vocal tract acoustics
- Factorization of Green's function into two components: g_o (far-field propagation = classical transfer function) and g_s (source-region acoustic coupling)
- The g_s component accounts for how source geometry affects sound generation efficiency
- Demonstrates that sharp edges (like incisors for sibilants) are far more effective at converting hydrodynamic energy to acoustic energy than rounded surfaces (like false vocal folds for aspiration)
- Provides a physical explanation for the amplitude difference between sibilant and non-sibilant fricatives

## Methodology
- Derives compact Green's function formulation from first principles (wave equation, Lighthill's aeroacoustic analogy)
- Uses conformal mapping to solve for the acoustic potential field (phi*) around vocal tract obstructions modeled as 2D wedges/fences
- Computes the source pressure pulse created when a vortex is swept past a fence (sharp edge) in the vocal tract
- Analyzes the Lamb vector (omega x v) as the source term coupling hydrodynamic to acoustic modes

## Key Equations

### Wave equation
$$c^{-2} \frac{\partial^2 p}{\partial t^2} - \nabla^2 p = 0$$
(Eq. 1)

### Wave equation with aerodynamic source (Lighthill analogy)
$$c^{-2} \frac{\partial^2 p}{\partial t^2} - \nabla^2 p = \rho_0 \nabla \cdot (\boldsymbol{\omega} \times \mathbf{v})$$
(Eq. 14)

Where $\boldsymbol{\omega} = \text{curl } \mathbf{v}$ is vorticity, $\mathbf{v}$ is flow velocity, $\rho_0$ is air density.

### Green's function factorization (compact approximation)
$$G(\mathbf{x}|\mathbf{y}) = g_o(\mathbf{x}|y_0) \cdot g_s(\mathbf{y})$$
(Eq. 15)

Where:
- $g_o(\mathbf{x}|y_0) = G_0(\mathbf{x}|\mathbf{y}_1) \mathscr{T}_p(y_0)$ — far-field Green's function (classical transfer function + radiation)
- $g_s(\mathbf{y}) = \phi^*(\mathbf{y}) / A^*$ — source-region coupling function

### Source-region coupling
$$g_s(\mathbf{y}) = \phi^*(\mathbf{y}) / A^*$$
(Eq. 17)

Where $\phi^*(\mathbf{y})$ is the normalized acoustic velocity potential in the source region (satisfies Laplace's equation $\nabla^2 \phi^* = 0$), and $A^* = \oint \nabla \phi^* \cdot d\mathbf{S}$ is the effective cross-sectional area.

### Pressure source from Lamb vector
$$p_s = -\int (\nabla \phi^*(\mathbf{y})) \cdot \frac{\rho_0(\boldsymbol{\omega} \times \mathbf{v})}{A^*} d^3 \mathbf{y}$$
(Eq. 21)

This is the central result: source pressure depends on the dot product of the acoustic field gradient ($\nabla \phi^*$) with the Lamb vector ($\boldsymbol{\omega} \times \mathbf{v}$), which means geometry of the source region determines how effectively hydrodynamic energy converts to sound.

### Far-field Green's function (radiation + head scattering)
$$G_0(\mathbf{x}|\mathbf{y}_1) = \frac{\rho_0(2\pi i f)\sigma(f)}{4\pi |\mathbf{x} - \mathbf{y}_1|}$$
(Eq. 11)

Where $\sigma(f)$ is the head scattering function.

### Transfer function (Appendix A)
$$\mathscr{T}_p(y_0) = \left(\frac{Y_+^e Y_-^e}{Y_+^e + Y_-^e}\right) \frac{Y_1}{T_+(1,1)Y_1 + T_+(1,2)}$$
(Eq. A.7)

Where $Y_+^e$ and $Y_-^e$ are effective admittances looking toward the lips and glottis respectively, defined in terms of transmission matrix elements T.

## Parameters

| Name | Symbol | Units | Default | Range | Notes |
|------|--------|-------|---------|-------|-------|
| Speed of sound | c | m/s | ~350 | - | Thermodynamic property of air |
| Air density | $\rho_0$ | kg/m^3 | ~1.2 | - | Mean air density |
| Acoustic wavelength | $\lambda$ | m | - | 1.5-2.5 cm (at 15-20 kHz) | For sibilance frequencies |
| Source region size | $\ell$ | cm | <0.5 | - | Must be << $\lambda$ for compactness |
| Jet velocity at false folds | V | cm/s | 2000-3000 | - | For aspiration/voicing |
| Radius of curvature (false folds) | r | cm | ~0.2 | - | Rounded edge |
| Fence height (obstruction) | h | cm | - | - | Effective vertical dimension |

## Implementation Details

### Key physical insight for synthesis
The paper shows that the effectiveness of a pressure source depends critically on the **geometry** of the obstruction where the source is located:

1. **Sharp edges** (incisors, teeth): Acoustic streamlines are nearly vertical near the edge, meaning $\nabla \phi^*$ is nearly aligned with the Lamb vector — maximum energy transfer from flow to sound.

2. **Rounded/broad surfaces** (false vocal folds): Acoustic streamlines become horizontally oriented — nearly perpendicular to the Lamb vector — minimal energy transfer. Above a critical frequency proportional to V/(r), the turbulent source becomes exponentially less effective.

3. **Sibilants** (/s/, /sh/): Jet strikes incisors (sharp edges) → highly efficient pressure source → loud
4. **Aspiration/voicing**: Source at false vocal folds (rounded) → inefficient pressure source → quieter
5. **Non-sibilant fricatives** (/f/, /theta/): Distributed source, not necessarily compact → weaker

### Critical frequency for rounded edges
For rounded edges with radius of curvature r and jet velocity V:
- Turbulent source diminishes exponentially above frequency $f \sim V/r$
- Example: V = 2000-3000 cm/s, r = 0.2 cm → source diminishes above 1-2 kHz
- This explains why aspiration noise has steep high-frequency rolloff

### Source compactness criterion
Source regions are acoustically compact when:
$$\delta t \cdot c \sim \frac{c}{v} \ell \gg \ell$$
Since v/c < 0.15 (Mach numbers in vocal tract are small), this is satisfied for frequencies below 15-20 kHz where the acoustic wavelength exceeds 1.5-2.5 cm.

### Vortex-fence interaction (Fig. 1)
- A point vortex of circulation $\Omega$ moving at velocity V past a fence of height h produces a pressure pulse
- Peak pressure occurs when vortex is closest to fence edge
- Vorticity of opposite sign is shed from the edge, diminishing overall effectiveness
- The source pulse shape (Fig. 1b) is a unipolar pulse with antisymmetric wings

## Figures of Interest
- **Fig. 1a (page 7):** Acoustic streamlines for vorticity moving over the edge of a fence — shows how $\nabla \phi^*$ curves around the edge
- **Fig. 1b (page 7):** Resulting source pressure pulse $p_s(t)$ when vortex passes fence at height $\varepsilon \cdot h$ with $\varepsilon = 0.05$
- **Fig. 2a (page 8):** Acoustic streamlines around a knife edge — nearly vertical (efficient coupling)
- **Fig. 2b (page 8):** Acoustic streamlines around a wedge with right-angle corner — more horizontal (less efficient coupling)

## Results Summary
- The classical transfer function is one component (g_o) of the full Green's function
- The new component (g_s) captures source-region geometry effects on sound production efficiency
- Sharp edges (teeth) are maximally effective for converting vortex motion to sound
- Broader/rounded edges become exponentially less effective above a frequency determined by V/r
- This explains observed amplitude differences: sibilants are 10-15 dB louder than aspiration not just because of jet velocity differences, but because of geometric coupling efficiency
- Cross-modes (frequencies where propagation is not one-dimensional) can also be analyzed with compact Green's functions

## Limitations
- Only accounts for one-dimensional acoustic propagation in the vocal tract (valid below ~4 kHz for typical vocal tract cross-sections)
- The hydrodynamic field (Lamb vector) must still be determined experimentally or numerically — the paper provides the acoustic coupling framework but not the flow solution
- Counter-vorticity shed from edges is not modeled, which would diminish source effectiveness
- Tissue compliance effects on edge geometry are not fully understood
- The example is 2D (midsagittal plane with lateral symmetry); full 3D modeling would be more complex

## Testable Properties
- Sharp-edge obstruction sources should produce more high-frequency energy than rounded-edge sources at the same flow velocity
- Sibilant fricative amplitude should correlate with the sharpness of the nearest downstream obstruction (teeth)
- Aspiration noise spectral rolloff should correlate with false fold radius of curvature
- Source effectiveness at rounded edges should diminish exponentially above frequency V/r
- For compact sources ($\ell \ll \lambda$), the far-field spectrum should factor cleanly into source × transfer function components

## Relevance to Project
This paper provides the theoretical foundation for understanding *why* different noise sources in the Klatt synthesizer (AF for frication, AH for aspiration) need different amplitude levels and spectral characteristics. The key insight — that sibilant sources are geometrically amplified by sharp teeth edges while aspiration sources are geometrically attenuated by rounded false folds — explains the large amplitude difference between sibilant and non-sibilant noise in Klatt's parallel branch. This could inform:
- More principled AF/AH amplitude ratios (currently empirical in Klatt)
- Spectral tilt differences between sibilant frication and aspiration noise sources
- The frequency-dependent effectiveness of different source types
- Physics-grounded justification for the separate noise source architecture in Klatt (AF vs AH)

## Open Questions
- [ ] Could the g_s function be used to derive frequency-dependent AF amplitude corrections?
- [ ] How does this relate to the PLSTEP burst mechanism in Qlatt — does the vortex-edge pulse shape match the decay envelope?
- [ ] What are the practical implications for the ratio of sibilant to non-sibilant fricative amplitudes?
- [ ] Could cross-mode analysis explain why some fricatives have energy peaks above 4 kHz?

## Collection Cross-References

### Already in Collection
- **Fant_1960_AcousticTheorySpeechProduction** — cited as the foundation of the acoustic theory that this paper extends; the classical source-filter model is the g_o component of the compact Green's function
- **Stevens_1998_AcousticPhonetics** — cited for comprehensive acoustic phonetics framework; Stevens' treatment of turbulence noise and fricative sources is contextualized by this paper's geometric coupling analysis
- **Shadle_1985_FricativeAcoustics** — cited for experimental validation of fricative source mechanisms; Shadle's obstacle-source vs. surface-source classification is explained physically by the compact Green's function theory (sharp edges = obstacle sources = efficient coupling; distributed surfaces = weak coupling)

### Cited By (in Collection)
- (none found)

### New Leads (Not Yet in Collection)
- Howe & McGowan (2005) — "Aeroacoustics of [s]" — Proceedings of the Royal Society A, 461, 1005-1028 — applies compact Green's function specifically to sibilant [s], with experimental validation of absolute sound pressure levels
- Krane (2005) — "Aeroacoustic production of low-frequency unvoiced speech sounds" — JASA 118, 410-427 — complementary analysis of non-sibilant aeroacoustic sources
- McGowan (1988) — "An aeroacoustic approach to phonation" — JASA 83, 696-704 — applies aeroacoustic framework to voicing rather than frication

### Conceptual Links (not citation-based)
- **Hanson_2003_AspiratedStopsModels** — Hanson & Stevens found that /t/ aspiration contains frication noise from supraglottal constriction rather than pure glottal aspiration. This is explained by McGowan & Howe's theory: the alveolar ridge provides a sharper edge for aeroacoustic coupling than the false folds, so the "aspiration" phase of /t/ is actually more effective as a frication source than a true aspiration source.
- **Monson_2014_HighFrequencyVoice** — Monson documents that fricatives /f/, /theta/, /s/ have primary spectral peaks at 7-9 kHz. McGowan & Howe's theory predicts that rounded-edge sources (aspiration) lose effectiveness exponentially above V/r, while sharp-edge sources (sibilants) maintain effectiveness to much higher frequencies.
- **Shadle_2023_FricativeSpectraHighFreq** — Shadle's finding that non-sibilants have flat/rising high-frequency spectra while sibilants have peaked spectra is consistent with the compact Green's function theory: different source geometries produce different frequency-dependent coupling efficiencies.

## Related Work Worth Reading
- Howe, M.S. (1975). Contributions to the theory of aerodynamic sound — foundational aeroacoustics
- Howe, M.S. (1998). Acoustics of fluid-structure interactions — comprehensive treatment of compact Green's functions
- Howe, M.S. (2003). Theory of vortex sound — vortex-edge interaction theory
- Howe & McGowan (2005). Aeroacoustics of [s] — detailed application to sibilant production
- Krane, M.H. (2005). Aeroacoustic production of low-frequency unvoiced speech sounds — JASA 118
- Stevens, K.N. (1971). Airflow and turbulence noise — foundational source analysis
- Shadle, C.H. (1985). The acoustics of fricative consonants — experimental source characterization
- Lighthill, M.J. (1952). On sound generated aerodynamically — aeroacoustic analogy foundation
