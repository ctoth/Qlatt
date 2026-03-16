---
title: "Strom 2002 — From Text to Prosody Without ToBI"
year: 2002
one_sentence_summary: "A bootstrapping/EM method that iteratively learns accent/boundary labels and prosody-predicting CARTs from unlabeled speech data, eliminating the need for manual ToBI annotation while outperforming hand-crafted prosody rules."
---

# Strom 2002 — From Text to Prosody Without ToBI

## Key Contributions

1. Eliminates manual ToBI labeling requirement for prosody model training
2. Iterative EM-like bootstrapping: alternate between prosody prediction (text) and recognition (text + acoustics)
3. F0 targets represented as cluster centroids (Lloyd's algorithm) rather than continuous values
4. Phone durations predicted as z-scores (deviation from mean / standard deviation)
5. Speaker-adaptive: CARTs inherently capture speaker-specific prosodic characteristics
6. Significant listener preference for data-driven prosody over hand-crafted rules (65% vs 35%)

## System Architecture

### Four CARTs

| CART | Input | Output | Domain |
|------|-------|--------|--------|
| Accent predictor | Text features | Binary (accented/not) | Symbolic |
| Boundary predictor | Text features | Binary (boundary/not) | Symbolic |
| F0 target predictor | Text features + accent/boundary | Cluster index (→ centroid vector) | Acoustic |
| Duration predictor | Text features + accent/boundary | Phone z-score | Acoustic |

### F0 Representation

- F0 sampled at 10 ms frames, interpolated through unvoiced regions
- Three samples per syllable: beginning, middle, end
- ~12 clusters identified via Lloyd's algorithm (k-means variant)
- Each cluster centroid = prototype F0 contour for a syllable
- CART predicts cluster index; centroid replaces it at synthesis time
- Number of clusters trades off quantization error vs. prediction accuracy
- Training data equalization needed to cover rare but important cases (e.g., yes-no question final rise)

### Duration Representation

- Phone duration predicted as z-score: `z = (actual - mean) / std_dev`
- Normalized durations used as acoustic features for prosodic labeling
- Ratio of actual to predicted duration reveals accent and boundary lengthening
- Speaking rate normalization: compare actual vs. predicted phrase duration

## Iterative Training Algorithm (EM-like)

### Initialization
1. Boundaries: each longer pause + each sentence boundary → boundary label
2. Accents: simple text-derived rule (speaker-independent)
3. Or: use existing prosody model from another speaker of the same language

### Iteration (2 iterations typically sufficient)
1. **Predict**: Train duration and F0 CARTs from text features + current accent/boundary labels
2. **Recognize**: Use text + acoustic features to refine accent/boundary labels
3. Repeat

### Recognition Features (11 acoustic + text)
- 3 energy bands from log short-time FFT (median-smoothed)
- Interpolated F0 decomposed into 3 components via band-pass filters
- F0 + 3 components + their time derivatives = 8 F0 features
- Pause durations and normalized syllable durations
- Hierarchical classifier: CART outputs posterior probabilities → added to acoustic features → n-nearest-neighbor classifier

### Recognition Accuracy
- Accent: 88.5% syllable accuracy (vs. hand labels)
- Boundary: 96.7% syllable accuracy
- Close to inter-labeler consistency

## Text-Derived Features

### Word-level
- Part of speech (POS)
- Distance to sentence end
- Given/new feature (focus stack with lemmatized content words)

### Syllable-level
- Stress
- Whether syllable should be accented

### Phone-level (for duration prediction)
- Phone class
- Position within syllable

### Engineered features for special cases
- Explicit "yes-no question" binary feature required — CART could not learn final F0 rise from punctuation + POS + "or" presence alone
- Feature combinations suggested by literature or intuition (Breiman et al.)

## Evaluation Results

### Paired Comparison (12 German listeners, 19 utterances, 2 voices)

| Voice | DataPro Preferred | ManPro Preferred |
|-------|-------------------|------------------|
| Klara | 65.4% | 34.6% |
| Reiner | 64.9% | 35.1% |
| Pooled | 65.1% (p=0.0001) | 34.9% |

11 of 12 listeners preferred DataPro. No listener preferred ManPro.

### MOS Ratings (3 news paragraphs)

| Condition | MOS |
|-----------|-----|
| Klara + DataPro | 3.556 |
| Klara + ManPro | 3.250 |
| Reiner + DataPro | 3.194 |
| Reiner + ManPro | 2.806 |
| Competitor (female) | 1.972 |

DataPro consistently +0.35 MOS over ManPro.

## Practical Observations

1. **Yes-no questions**: Some speakers produce falling F0 on yes-no questions; these training examples should be removed
2. **Unexpected pauses**: Speaker-specific pause patterns may produce boundary labels too hard to predict from text — use another speaker's CART for initialization
3. **Feature selection**: Too many correlated features worsens CART performance; manual pre-selection of relevant combinations is still needed
4. **Numeric features**: CARTs handle categorical features well but struggle with numeric ones — cluster analysis and quantization up front is the solution
5. **RMSE ≠ quality**: Lower duration RMSE doesn't necessarily improve TTS quality due to unit selection interactions
6. **Convergence**: Predicted and recognized labels will never fully converge because there are many correct ways to say something

## Relevance to Qlatt

### Directly applicable concepts

1. **Duration z-scores**: The z-score representation for phone durations (deviation from mean as multiple of std dev) is a natural normalization that could inform the duration rule phase. Currently Qlatt uses multiplicative factors; z-scores would provide a more principled way to handle speaker-specific duration distributions.

2. **F0 as syllable-level cluster centroids**: The 3-samples-per-syllable F0 representation (beginning, middle, end) with cluster prototypes is a compact alternative to point-by-point F0 specification. This could inform F0 contour generation in the prosody rule phase.

3. **Accent/boundary as features, not hard decisions**: The paper's insight that accent and boundary are just two features among many for acoustic prediction — letting the CART decide when they matter — avoids error propagation from hard symbolic decisions. Qlatt's current pipeline makes hard accent decisions early; a softer approach could be explored.

4. **Speaking rate normalization via predicted/actual duration ratio**: This ratio metric could be useful for adjusting duration rules when different speaking rates are desired.

### Less directly relevant

- The CART training and EM bootstrapping are for corpus-based TTS, not rule-based synthesis
- Unit selection interactions don't apply to Qlatt's formant synthesizer

## Collection Cross-References

## References (from paper)

1. Silverman et al. (1992) — ToBI standard
2. Syrdal & Hirschberg (2001) — Automatic ToBI prediction
3. Syrdal (2000) — Inter-transcriber ToBI reliability
4. Conkie et al. (1999) — AT&T Next-Gen TTS
5. Breiman et al. (1984) — Classification and Regression Trees
6. Black et al. — CSTR software (wagon)
7. Hirschberg (1993) — Pitch accent prediction from context
8. Lloyd (1982) — Least squares quantization (k-means)
9. Dempster et al. (1977) — EM Algorithm
10. Strom (1995) — Accent/boundary detection with prosodic features
