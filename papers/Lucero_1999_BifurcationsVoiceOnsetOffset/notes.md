# Lucero 1999 — Bifurcations at Voice Onset-Offset: Implementation Notes

## Core Claim

Phonation onset and offset occur through **different bifurcation mechanisms** at **different subglottal pressure values**, producing oscillation hysteresis. This is the standard regime for normal phonation, not a pathological case.

## Bifurcation Classification

### At voice onset: Subcritical Hopf bifurcation

- As subglottal pressure Ps increases past a critical value Ps_onset, the equilibrium (closed glottis) loses stability.
- In a **subcritical** Hopf bifurcation, an **unstable** limit cycle is absorbed into the equilibrium as the parameter crosses threshold. The system jumps discontinuously to a large-amplitude stable limit cycle.
- This means onset is a **sudden jump** to full oscillation — not a gradual amplitude growth.

### At voice offset: Saddle-node (fold) bifurcation of limit cycles

- As Ps decreases below onset, oscillation **persists** — the stable limit cycle does not vanish at Ps_onset.
- At a lower pressure Ps_offset, the stable limit cycle collides with the unstable limit cycle in a **saddle-node bifurcation of limit cycles** (also called fold bifurcation of cycles).
- Both cycles annihilate each other, and oscillation ceases abruptly.

### Why NOT supercritical

A supercritical Hopf bifurcation would produce:
- Gradual amplitude growth from zero at onset
- Identical onset and offset pressures (no hysteresis)
- Same biomechanical configuration at onset and offset

Experimental evidence contradicts all three: onset/offset occur at different pressures with different vocal fold configurations.

## Hysteresis

- Onset pressure > Offset pressure (always, for subcritical case)
- **Ps_offset / Ps_onset ratio: ~0.45** in the two-mass model simulation
- Theoretical ratio from mucosal wave model: ~1/2 (Lucero, in press [ref 6])
- Both values are within the range of experimental observations

### Bifurcation diagram structure (conceptual)

```
Oscillation
amplitude
    |          stable limit cycle
    |        *======================*
    |       /                        \
    |      / (fold/saddle-node)       \ (onset jump)
    |     *                            |
    |     unstable limit cycle         |
    |     - - - - - - - - - - - - - - -|
    |                                  * equilibrium loses stability
    |____*_____________________________*____________> Ps
       Ps_offset                    Ps_onset

  Increasing Ps -->  onset at Ps_onset (jump up to stable cycle)
  Decreasing Ps <--  offset at Ps_offset (stable cycle vanishes)
```

## Key Figures

- **Figure 1**: Time-domain simulation of hysteresis. Top: subglottal pressure ramp (0 to ~600 Pa then back to 0). Middle: glottal area waveform showing onset jump and offset drop. Bottom: oscillation amplitude envelope — onset occurs at higher Ps than offset, with ratio ~0.45.
- **Figure 2**: Voice intensity (dB) at onset vs offset plotted against F0 (Hz). Onset intensity is ~10 dB higher than offset intensity across all frequencies (roughly 83-91 dB onset vs 57-81 dB offset). Clear hysteresis gap.

## Model Used

- Ishizaka-Flanagan two-mass model of vocal folds (1972)
- Two-tube vocal tract approximation for male /a/ (from Titze 1994)
- Radiation load: piston on spherical baffle
- Glottal aerodynamics: boundary layer approximation for high Reynolds numbers (Pelorson et al. 1994)
- Control parameter: subglottal pressure Ps
- F0 controlled via mass/spring scaling parameter
- Pressure ramp rate: 10 Pa/cycle

## Relevance to Synthesis

### Voice onset modeling

In a synthesizer, voice onset should not be modeled as a gradual amplitude ramp from zero. The subcritical Hopf bifurcation means onset is a **jump** to finite amplitude. The initial cycles after onset should already have substantial amplitude.

### Voice offset modeling

Offset occurs at a lower pressure than onset. If modeling Ps as a control parameter, the system should sustain oscillation below the onset threshold until hitting the lower offset threshold. Offset is also abrupt (fold bifurcation), not a gradual decay.

### Intensity hysteresis

At onset, voice intensity is higher (~10 dB) than at offset for the same F0. This is a natural consequence of the higher Ps required for onset. Voice range profiles (phonetograms) should show this asymmetry.

### No closed-form threshold equations in this paper

The paper does not derive new threshold pressure equations — it references:
- Titze 1988 for the small-amplitude oscillation physics (phonation threshold pressure)
- Lucero (in press, ref 6) for the analytical subcritical Hopf proof and the 1/2 ratio derivation using the mucosal wave model
- Ishizaka & Flanagan 1972 for the two-mass model equations

For threshold equations, see Titze 1988 and Lucero's JASA paper (ref 6, later published as Lucero 1999 JASA 105(1)).

---

## Collection Cross-References

### Already in Collection
- [[Lucero_2005_VocalFoldBifurcations]] — cited as [6] (in press at time of this publication); provides analytical proof using the mucosal wave model. Partially corrects this paper: for typical parameters the Hopf bifurcation is supercritical (soft onset), not subcritical as found here in the two-mass model. The 2005 paper's extended model with quartic damping recovers the subcritical behavior demonstrated here.

### Cited By (in Collection)
- [[Lucero_2005_VocalFoldBifurcations]] — cites this as [10]; the 2005 paper provides the analytical treatment that this paper's numerical simulations motivated

### Conceptual Links (not citation-based)
- [[Steinecke_1995_BifurcationsVocalFold]] — **Strong.** Both analyze bifurcations in the Ishizaka-Flanagan two-mass model family. Steinecke maps bifurcation diagrams for left-right vocal fold asymmetry (producing subharmonics, chaos, diplophonia), while this paper maps the onset/offset hysteresis under symmetric conditions. Together they characterize the full bifurcation landscape: symmetric onset/offset (this paper) and asymmetric pathological regimes (Steinecke).
- [[Herzel_1994_VocalDisordersNonlinearDynamics]] — **Strong.** Herzel catalogs empirical acoustic signatures of bifurcations (period-doubling, tori, chaos) in 95 dysphonic patients. This paper provides the mathematical framework for onset-type bifurcations that produce some of those signatures. Herzel's observation that tiny parameter changes cause abrupt regime transitions maps directly to the bifurcation diagrams here.
- [[Titze_1992_VocalIntensity]] — **Moderate.** Titze derives SPL as a function of excess pressure over phonation threshold pressure. This paper's hysteresis result (onset pressure > offset pressure) means the "excess pressure" concept must account for which threshold applies — onset or offset — depending on direction of pressure change.
- [[Titze_2014_BistableVocalFoldAdduction]] — **Moderate.** Titze 2014 describes bistability in modal-falsetto register transitions arising from adductory geometry. This paper describes bistability in phonation onset/offset. Both involve coexisting stable states (oscillating/non-oscillating here, convergent/divergent glottis there) with hysteresis, but through different mechanisms.
- [[Titze_1989_MaleFemaleVoices]] — **Moderate.** Titze 1989 derives male-female F0 differences from vocal fold geometry. This paper's bifurcation analysis uses the Ishizaka-Flanagan model with parameter scaling for F0 control, and the onset/offset pressure ratios may differ between male and female vocal fold configurations due to the size/length scaling factors Titze identifies.
- [[Fant_1985_LFModelGlottalFlow]] — **Moderate.** The LF model parameterizes glottal flow waveform shape; the limit cycle amplitude and shape in this paper's bifurcation analysis determine the resulting glottal waveform. The abrupt onset (subcritical Hopf) means the initial LF waveform parameters should jump to finite values rather than grow gradually.

**See also:** Lucero_2005_VocalFoldBifurcations - Analytical bifurcation analysis of the mucosal wave model showing that for typical parameters the Hopf bifurcation is supercritical (soft onset), partially correcting this paper's finding of subcritical onset in the two-mass model. The 2005 paper introduces an extended model with quartic nonlinear damping that can recover subcritical behavior and hysteresis.
