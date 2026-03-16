---
title: "Conkie & Isard 1994/1997 — Optimal Coupling of Diphones"
year: 1997
---

# Conkie & Isard 1994/1997 — Optimal Coupling of Diphones

## Implementation-Relevant Notes

### Core Problem

In PSOLA-based diphone synthesis, time-domain resynthesis is not well-suited to spectral smoothing at unit boundaries. Therefore it is critical to choose diphone boundaries (cutpoints) that minimize spectral mismatch between adjacent units.

### Approach: Optimal Coupling

Instead of fixed diphone boundaries, the boundaries of a given diphone are chosen at synthesis time to provide the best spectral fit with neighboring diphones in the particular utterance being synthesized. Cutpoints are precomputed and stored in a table for each diphone pair, making lookup fast at runtime.

### Four Mismatch Measures Evaluated

#### 2.1 Simple Frame Mismatch (Euclidean distance on mel-cepstral coefficients)

- Analysis: 25.6 ms window, 5 ms frame shift
- Mel-cepstral coefficients extracted from nonsense words
- HMM aligner used for phonetic transcription alignment (hand-corrected)
- 2283 phone pairs (P1-P2) in English diphone set
- Optimised join: join left-hand diphone up to frame x, right-hand diphone from frame y onward, minimizing mismatch between frames x and y
- **Baseline** (hand-selected boundary in natural speech vowels): Mean 0.442, SD 0.244
- **Cross-diphone join** (hand-selected P1-V joined to hand-selected V-P2): Mean 1.91, SD 0.668
- **Optimised join** (minimised mismatch joining P1-V and V-P2): Mean 0.595, SD 0.146

#### 2.2 Mismatch of Frames Plus Regression Coefficients

- Extends cepstral vector with linear regression coefficient per cepstral dimension, computed over a window
- Ensures not just frame match but also contour smoothness across boundary
- Coefficients weighted by variance to normalize across dimensions
- Problem: much more variable on natural speech than simple mismatch; abandoned in favor of linear fit

#### 2.3 Linear Fit Over a Window of Frames

- Instead of Euclidean distance between individual frames, measures deviation of coefficients from best-fit line over a window
- Window size of 4 frames used
- **Hand-selected boundaries**: Mean 0.187, SD 0.499
- **Fixed boundary diphones**: Mean 0.981, SD 0.658
- **Optimised (minimised linear fit)**: Mean 0.682, SD 0.165
- Large SD for natural speech indicates this measure may not always give satisfactory results

#### 2.4 Least Mismatch Giving a Chosen Duration

- Variable-duration optimization: minimize mismatch while constraining resultant phone duration to match the value from the duration model
- Duration constraint means the optimal spectral coupling point may not be the globally best spectral match
- Authors found this often sounded better than fixed cutpoints, especially when vowel formants move monotonically from onset to offset with no clear steady state

### Assessment Results (Section 3)

#### Informal Listening Findings

1. Minimising mismatch with fixed duration alone is unsatisfactory — quality is degraded vs. fixed boundaries in many cases
2. For phrase-length materials, simple mismatch and linear fit are hard to distinguish without careful listening
3. When linear fit goes wrong, it leaves out too much of the vowel middle
4. Variable-duration optimisation (measure 2.4) often sounds better, especially for monotonically-moving formant tracks

#### Perceptual Test (CVC word identification)

- 20 CVC monosyllabic words chosen for near-neighbor confusability
- Compared: fixed cutpoints vs. simple mismatch optimised cutpoints
- 16 British English listeners, word identification task
- **Results**: 84% correct for optimised stimuli vs. 64% for fixed cutpoint stimuli (p < 0.05)
- For words where optimised version had advantage, average mismatch for fixed version was significantly higher (2.17 vs. baseline ~0.443)
- Two words identified correctly by all subjects in optimised version but none in fixed version

### Key Parameters

| Parameter | Value |
|-----------|-------|
| Analysis window | 25.6 ms |
| Frame shift | 5 ms |
| Feature type | Mel-scale cepstral coefficients |
| Linear fit window | 4 frames (20 ms) |
| Diphone inventory size | 2283 phone pairs (English) |

### Relevance to Klatt Synthesis

This paper is about concatenative (PSOLA) diphone synthesis, not parametric synthesis. In a Klatt formant synthesizer, the analogous problem is **formant transition smoothing at segment boundaries**. The key insight that transfers:

1. **Spectral continuity at boundaries matters more than getting the "canonical" boundary position** — the same principle applies to choosing transition trajectories in formant synthesis
2. **Simple frame-by-frame spectral distance is a useful quality metric** — could be adapted to evaluate Klatt output quality at segment junctions
3. **Duration and spectral optimization interact** — adjusting segment duration can improve spectral continuity, relevant to Qlatt's duration rules
4. The concept of precomputed optimal coupling tables could inform how structural rules handle segment boundary positioning

## Collection Cross-References

### Cited By (in Collection)
- `Chappell_Hansen_2002_SpectralSmoothingSegmentSynthesis` — references Conkie for diphone boundary optimization
- `Strom_2002_TextToProsodyWithoutToBI` — references Conkie in synthesis context

### Conceptual Links (not citation-based)
- `Hertz_2006_HybridSynthesisRegularities` — both address segment boundary quality in different synthesis frameworks
- `Carlson_1995_ModelsOfSpeechSynthesis` — both concern practical speech synthesis quality
