# Implementation Notes: El-Jaroudi & Makhoul 1991 — Discrete All-Pole Modeling

## Core Problem

Standard Linear Prediction (LP) matches the autocorrelation of a continuous all-pole spectrum to the data. When the input is a **discrete set of spectral points** (e.g., harmonics of voiced speech), LP suffers from autocorrelation aliasing: the sampled autocorrelation R(i) is an aliased version of the original R_org(i), causing LP to fit the wrong envelope. The problem worsens as pitch increases (fewer harmonics = more aliasing).

## Discrete All-Pole (DAP) Method

DAP uses the **discrete Itakura-Saito (I-S) distortion measure** as its error criterion, evaluated only at the given spectral points:

### Error Measure (Eq. 14)

```
E_IS = (1/N) * sum_{m=1}^{N} [ P(w_m)/P_hat(w_m) - ln(P(w_m)/P_hat(w_m)) - 1 ]
```

where:
- P(w_m) = given discrete spectrum at N frequency points w_m in Omega
- P_hat(w_m) = all-pole model spectrum = 1/|A(w_m)|^2
- A(w) = 1 + sum_{k=1}^{p} a_k * e^{-jwk}  (prediction polynomial)

### Spectral Error in dB (Eq. 15-16)

```
E_dB = 6.142 * sqrt(E_IS)
     = sqrt( (1/N) * sum [ 10*log10(P(w_m)) - 10*log10(P_hat(w_m)) ]^2 )
```

For small E_IS, E_dB approximates the RMS log spectral distance in dB.

### Key Property: Spectral Flatness (Eq. 29-30)

At the minimum error, the residual spectrum P(w_m)/P_hat(w_m) is normalized to 1:

```
(1/N) * sum_{m=1}^{N} P(w_m)/P_hat(w_m) = 1
```

The minimum I-S error equals the log of the ratio of the geometric means of the model and given spectra (spectral flatness property).

## Correlation Matching Conditions

### DAP Normal Equations (Eq. 20-22)

The minimization of E_IS yields:

```
R_hat(i) = R(i),   0 <= i <= p
```

where:
- R(i) = (1/N) * sum_{m=1}^{N} P(w_m) * e^{jw_m*i}  — autocorrelation of discrete spectrum (Eq. 5)
- R_hat(i) = (1/N) * sum_{m=1}^{N} P_hat(w_m) * cos(w_m*i)  — autocorrelation of DAP model sampled at same discrete frequencies (Eq. 21)

**Critical difference from LP:** In LP, R_hat_LP(i) is the autocorrelation of the continuous all-pole spectrum. In DAP, R_hat(i) is obtained by discrete sampling of the all-pole spectrum at the same points as the data. This accounts for aliasing.

### Matrix Form (Eq. 23-24)

```
2(R - R_hat) * a = 0
R * a = R_hat * a
```

where R, R_hat are symmetric Toeplitz matrices with elements R(i-j) and R_hat(i-j).

## Solution Types

Two possible solutions:

1. **Matching solution:** R_hat = R (autocorrelation matching). Model satisfies condition (20). Poles inside unit circle.
2. **Singular solution:** R_hat != R. Predictor vector a is eigenvector of (R_hat - R) for eigenvalue 0. Poles on unit circle (unstable).

The error function is **convex** — the optimal all-pole model is unique (under mild conditions on N). The optimal model is independent of which class it belongs to.

## The DAP Algorithm (Section IV-B)

An iterative two-step procedure:

### Algorithm Steps

```
1. Perform peak picking on spectrum. Obtain locations w_m, magnitudes P(w_m),
   and number N of peaks. (Peaks need not be harmonic multiples.)
2. Given w_m and P(w_m) for 1 <= m <= N, compute R(i) from (5).
3. Using ordinary LP, find initial estimate of {a_k}, 0 <= k <= p.
4. Compute A(w_m) for 1 <= m <= N.
5. Evaluate h_hat(-i) for 0 <= i <= p using (36):
   h_hat(-i) = (1/N) * sum_{m=1}^{N} e^{-jw_m*i} / A(w_m)
6. Solve (41) for new estimate of {a_k}:
   sum_{k=0}^{p} a_k * R_hat(i-k) = h_hat(-i),  0 <= i <= p
7. Evaluate E_IS using (2) and (14).
8. If reduction in E_IS > threshold T, go to step 4; else continue.
9. Normalize coefficients to satisfy (29).
10. Stop.
```

### Computational Cost

- Each iteration: two real DFTs of size N + solving (p+1) linear equations
- R matrix is Toeplitz, constant across iterations — inverted once
- More intensive than LP, but practical

### Convergence Properties

- DAP algorithm is equivalent to a **quasi-Newton fast gradient** method
- Update equation (Eq. 43-44):
  ```
  a_{m+1} = a_m - R^{-1} * R_hat_m * a_m
           = a_m - R^{-1}(R - R_hat_m) * a_m   [gradient step]
  ```
- The 2R matrix approximates the Hessian S (exact for large N)
- Guaranteed to converge to the optimal solution

### Accelerated Convergence (Eq. 47-48)

```
a_{m+1} = a_m - alpha * (2R)^{-1} * g_m
        = a_m * (1 - alpha) + alpha * R^{-1} * R_hat_m * a_m
```

where 0 <= alpha <= 1. Recommended range: **0.4 <= alpha <= 0.8** for good convergence speed.

- alpha = 1: standard algorithm (may not decrease error every iteration)
- alpha = 0.5: guaranteed error decrease every iteration, fast convergence
- alpha = 0.1: slow convergence
- Typical convergence: 4-10 iterations for real speech

## Weighted DAP (WDAP) — Section VI

Extends DAP with frequency-dependent weighting:

### Weighted Error Measure (Eq. 49)

```
E_WIS = (1/N) * sum_{m=1}^{N} W(w_m) * [ P(w_m)/P_hat(w_m) - ln(P(w_m)/P_hat(w_m)) - 1 ]
```

where W(w_m) >= 0 is a positive weighting function, normalized: (1/N) * sum W(w_m) = 1.

### WDAP Normal Equations (Eq. 51-56)

```
sum a_k * R_W(i-k) - sum a_k * R_hat_W(i-k) = 0,  0 <= i <= p
```

where:
- R_W(i) = (1/N) * sum W(w_m) * P(w_m) * cos(w_m * i)   (Eq. 52)
- R_hat_W(i) = (1/N) * sum W(w_m) * P_hat(w_m) * cos(w_m * i)  (Eq. 53)
- h_hat_W(-i) = (1/N) * sum W(w_m) * e^{-jw_m*i} / A(w_m)  (Eq. 55)

Solved with same iterative two-step procedure. Same convergence properties.

### Useful Weighting Function

For speech coding, emphasize lower harmonics:
```
W(w) = [1/(1 + w/w_c)]
```
with cutoff w_c corresponding to ~800 Hz (mel-scale-based weighting).

## Experimental Results

### Synthetic Vowels (Table I)

Formant estimation percent error |%| = (|F_hat - F|/F) * 100:

| Method | /er/ F1 | /er/ F2 | /er/ F3 | /er/ E_dB | /i/ F1 | /i/ F2 | /i/ F3 | /i/ E_dB | /u/ F1 | /u/ F2 | /u/ F3 | /u/ E_dB |
|--------|---------|---------|---------|-----------|--------|--------|--------|----------|--------|--------|--------|----------|
| LPC    | 7.0     | 2.3     | 2.6     | 1.0       | 6.6    | 0.8    | 0.7    | 1.1      | 6.3    | 2.3    | 1.0    | 0.9      |
| DAP    | 1.8     | 1.0     | 0.9     | 0.2       | 3.0    | 0.2    | 0.3    | 0.1      | 2.4    | 0.8    | 0.2    | 0.2      |
| WDAP   | 1.8     | 1.1     | 0.9     | 0.1       | 2.3    | 0.2    | 0.7    | 0.1      | 2.2    | 0.8    | 0.3    | 0.1      |

- DAP reduces formant estimation error by factor of 2-3x vs LP
- E_dB decreases by ~1 dB for all vowels
- WDAP further improves lower formants at expense of higher ones

### Real Speech

- For voiced speech: E_dB for DAP always less than LP (scatter plot, Fig. 7)
- Average E_dB decrease: 0.15 to 3.5 dB, mean 0.65 dB
- Convergence in 4-10 iterations typical for real speech segments
- For unvoiced speech: DAP and LP produce similar fits (many spectral points, aliasing negligible)

## Relevance to Klatt Synthesizer / Inverse Filtering

1. **Glottal flow estimation via inverse filtering:** DAP provides better vocal tract estimates than LP for voiced speech, especially at high pitch. Better vocal tract model = better glottal flow residual after inverse filtering.

2. **Formant tracking:** DAP gives more accurate formant frequencies and bandwidths than LP, particularly for F1 of high-pitched speakers (where LP has the most aliasing).

3. **Spectral envelope fitting:** When fitting an all-pole model to harmonic spectra (e.g., for analysis-synthesis), DAP produces envelopes that pass closer to harmonic peaks without the bias toward peaks that LP exhibits.

4. **The method operates on discrete spectral points** — it does not require equally-spaced or harmonically-related frequencies. This makes it suitable for spectra with missing or irregularly spaced harmonics.

## Key Equations Summary

| Equation | Purpose |
|----------|---------|
| (2)  | All-pole spectrum definition: P_hat(w) = 1/|A(w)|^2 |
| (5)  | Discrete autocorrelation: R(i) = (1/N) sum P(w_m) e^{jw_m*i} |
| (14) | Discrete I-S error measure |
| (20) | DAP correlation matching: R_hat(i) = R(i) |
| (21) | DAP model autocorrelation (discrete sampling) |
| (36) | Impulse response of inverse filter sampled at discrete frequencies |
| (41) | DAP nonlinear normal equations |
| (43) | Iterative update rule |
| (47) | Accelerated update with alpha parameter |
| (49) | Weighted I-S error measure |
| (56) | WDAP nonlinear normal equations |
