# Broad & Clermont 1987 — Implementation Notes

**Paper:** A methodology for modeling vowel formant contours in CVC context
**Authors:** David J. Broad, Frantz Clermont
**Journal:** J. Acoust. Soc. Am. 81(1), 155-165, January 1987
**DOI:** 10.1121/1.395025

## Core Concept

Models formant-frequency contours of vowels in CVC context through a series of progressively refined mathematical models. The fundamental idea is **superposition of CV and VC transitions**: a formant trajectory in a CVC syllable is the sum of an initial-consonant transition function, a final-consonant transition function, and a vowel target.

## Database

- Voiced plosives /b,d,g/ combined with 10 American English vowels /i,I,e,ae,a,backwards-c,u,U,Lambda,schwa/
- 30 VC' and 30 CV/d/ sequences (the "generating" script)
- Native male speaker, 3 repetitions of each
- 14th-order LPC autocorrelation analysis (Markel & Gray 1976), Hamming windowed 256-sample frames
- F1, F2, F3 tracked by hand in a text editor
- Signal: 5.0 kHz bandwidth, 10,000 16-bit samples/sec

## Time Normalization

Formants measured at N+2 = 13 equally spaced frames:
- First and last frames aligned with vowel onset/end
- First and last analysis frames discarded (unreliable boundary measurements)
- N = 11 interior frames used for modeling
- Duration D, frame width W, frame advance P
- D = (N+1)P + W  ... Eq. (2)
- Real-time scale: t' = t - D  ... Eq. (3)
- Center of frame n: t_n = Pn + (1/2)W  ... Eq. (4)

## Model I: Additive Model (Superposition)

### Formulation

The formant trajectory F_CVC(n) in discrete time is modeled as:

**F_CVC(n) = f_CV(n) + T_V + g_VC(n)**  ... Eq. (1)

Where:
- F is the vowel formant contour in context CVC'
- n is discrete time in frames
- f and g are initial- and final-consonant transition functions
- T_V is the vowel target (a constant)
- Transition functions represent perturbations of the vowel from its target

### Construction from Data

From VC' and CV/d/ utterances:

- **Vowel target:** T_V = F_V.(1) — the average onset value in VC' contours ... Eq. (5)
- **Final-consonant transition:** g_VC(n) = F_VC.(n) - T_V ... Eq. (6)
- **Initial-consonant transition:** f_CV(n) = F_CVd(n) - T_V - g_Vd(n) ... Eq. (7)
  - (Subtract the /d/ transition from the CV/d/ contour after removing the vowel target)

### Evaluation

Table I — RMS errors of additive model:

| Formant | s_rep (Hz) | s_min,min (Hz) | s_min (Hz) | s_res (Hz) | s_tot (Hz) |
|---------|-----------|----------------|-----------|-----------|-----------|
| F1 | 24 | 22 | 30 | 0 | 49 |
| F2 | 52 | 69 | 89 | 56 | 148 |
| F3 | 75 | 100 | 111 | 48 | 113 |

- s_rep = interrepetition variation (measurement noise floor)
- s_min = model error (ideal rms if model were exact for population means)
- F1 model error is 29% greater than minimum expectation
- F2 model error is only 11% greater than minimum
- F3 model explains almost none of the total variance but nonadditive effects don't account for much of it either

## Model II: Per-Consonant Similarity (Common-Contour)

### Formulation

The VC' contour is modeled as a **scaled version of a common contour shape**:

**F_VC(n) = L'_C + k'_C * g*(n)**  ... Eq. (15)

Where:
- L' is the consonant locus (baseline frequency for transitions to consonant C')
- g* is the common contour shape (shared across all vowels for a given consonant)
- k' is a scale factor (primed = final consonant; unprimed = initial consonant)
- k and k' are proportional to the target-locus distances T - L and T - L'

### Key Insight — Locus Concept

The "locus" L' is the consonant's characteristic frequency that formant transitions move toward. Defined following Delattre et al. (1955) as a frequency at which transitions begin/end. Contours are scaled around this baseline.

### Construction

1. **Finding g*:** Average VC' data over vowels, find L' and k' by fitting Eq. (15) averaged over n
2. **Locus estimation:** For a given frame n, F_VC(n) vs F_VC_bar should lie on a line with slope g*(n) — Eq. (20)
3. **Iterative fit:** Construct g* from slope of Eq. (20), estimate L' by Eq. (21), then recompute g* to fit: F_VC(n) - L'_C = g*(n)[F_VC_bar - L'_C] ... Eq. (22)

### Evaluation

Table II — Errors of common-contour model:

| Formant | s_VC min (Hz) | s_CV real (Hz) | s_CV real (Hz) | est (Hz) | s_CVC real (Hz) |
|---------|--------------|---------------|---------------|---------|----------------|
| F1 | 13 | 15 | 21 | 35 | 35 |
| F2 | 28 | 33 | 36 | 91 | 98 |
| F3 | 41 | 36 | 55 | 111 | 116 |

## Model III: Target-Locus Scaling

### Formulation

Scale factors k and k' from Eq. (15) can be expressed as consonant-dependent constants times the target-locus distance:

- k_CV = mu_C * (T_V - L_C) ... Eq. (25)
- k'_VC = mu'_C * (T_V - L'_C) ... Eq. (26)

The transition functions then become:

- **f_CV(n) = (T_V - L_C) * [mu_C * f_hat(n) - 1]** ... Eq. (27)
- **g_VC(n) = (T_V - L'_C) * [mu'_C * g_hat(n) - 1]** ... Eq. (28)

Where mu and mu' are consonant-dependent proportionality constants.

### Key Result

The scale factors (k_CV, k'_VC) are proportional to the target-locus differences. This is similar to the formulation of Lindblom (1963) and Ohman (1967).

## Model IVa: Duration-Independent Exponentiality

### Formulation — Exponential Transition Functions

The contour shape g*(n) is well fit by exponentials (Prony's method):

**g*(n) = v'_C^{-1} * [1 + kappa'_C * exp(b'_C * n)]** ... Eq. (32)

Where v'_C, kappa'_C, and b'_C are constants.

Combined with target-locus scaling, the transition functions become:

- **f_CV(t) = kappa_C * (T_V - L_C) * exp(-beta_C * t)** ... Eq. (38)
- **g_VC(t') = kappa'_C * (T_V - L'_C) * exp[-beta'_C * (-t')]** ... Eq. (39)

Where beta and beta' are reciprocal time constants (rad/s), and kappa, kappa' are exponential scale factors.

### Asymptote-as-Target

The vowel target T_V emerges as the **asymptote** of the exponential decay:

T_V = k'_VC * v'_C^{-1} + L'_C ... Eq. (33)
=> k'_VC = v'_C * (T_V - L'_C) ... Eq. (34)

Target-locus scaling is a **corollary** of defining the target as the exponential asymptote.

### Exponential Duration Effect

In the special case where initial and final consonants share the same L, beta, and kappa:

**F(1/2 D) = T + 2*kappa*(T - L)*exp(-1/2 * beta * D)** ... Eq. (40)

This predicts an exponentially decaying context effect with increasing vowel duration, consistent with Lindblom's (1963) findings on vowel reduction.

## Model IVb: Duration-Dependent Exponentiality (Real-Time Scale)

### Formulation

Recovers real-time scales by using actual vowel duration:

- f_CV(t) defined forward from real time t = 0
- g_VC(t') defined backward from real time t' = 0
- f truncated at t = D, g truncated at t' = -D
- Superposition yields the CVC contour on a real-time scale (Fig. 10)

### Construction

1. Estimate v'_C for each C' using Eq. (32) fit
2. Use these to get vowel targets T_V via Eq. (33)
3. Estimate kappa'_C and b'_C from Eq. (32) fits
4. Compute real-time transition shapes g*(t') over fixed interval -150 < t' < -50 ms, every 10 ms
5. Fit exponentials to these real-time shapes

### Key Model Parameters (Table VI)

**(a) Consonant Loci (kHz):**

| Formant | L_b | L'_b | L_d | L'_d | L_g | L'_g |
|---------|-----|------|-----|------|-----|------|
| F1 | 0.305 | 0.462 | 0.590 | 0.723 | 0.589 | 0.321 |
| F2 | ... | 2.276 | 2.064 | 1.958 | 1.017 | 1.105 |
| F3 | 3.441 | 2.795 | 2.605 | 2.486 | 2.427 | 2.498 |

Note: F1 loci are consistent with F1 being negative (L_g for F1 is negative in earlier models), representing the case where F1 approaches its minimum (near 200-300 Hz) at consonant closure.

**(b) Reciprocal Time Constants beta (rad/s):**

| Formant | beta_b | beta'_b | beta_d | beta'_d | beta_g | beta'_g |
|---------|--------|---------|--------|---------|--------|---------|
| F1 | 4.5 | 1.0 | 14.1 | -6.1 | 10.9 | 2.6 |
| F2 | -0.4 | 8.6 | 11.0 | 11.9 | 7.3 | 8.1 |
| F3 | 0.3 | 7.2 | 10.9 | -10.9 | 3.3 | -17.0 |

**(c) Exponential Scale Factors kappa:**

| Formant | kappa_b | kappa'_b | kappa_d | kappa'_d | kappa_g | kappa'_g |
|---------|---------|----------|---------|----------|---------|----------|
| F1 | -0.1788 | 0.0460 | -0.7163 | -0.0067 | -0.6665 | -0.2216 |
| F2 | -0.1291 | -0.6920 | -0.6735 | -0.9034 | -0.3265 | -0.2020 |
| F3 | -0.0991 | -0.0507 | -0.4882 | 0.0036 | -0.1085 | -0.0007 |

**(d) Target-Locus Proportionalities v:**

| Formant | v_b | v'_b | v_d | v'_d | v_g | v'_g |
|---------|-----|------|-----|------|-----|------|
| F1 | 0.891 | 1.028 | 0.807 | 0.988 | 0.765 | 0.841 |
| F2 | 0.866 | 0.698 | 0.780 | 0.706 | 0.863 | 0.907 |
| F3 | 0.911 | 0.989 | 0.848 | 0.998 | 0.922 | 0.997 |

**(e) Vowel Targets T_V (kHz):**

| Formant | T_b | T_d | T_g | T'_b | T'_d | T'_g |
|---------|-----|-----|-----|------|------|------|
| F1 | 0.629 | 0.487 | 0.481 | 0.321 | 0.629 | 0.487 |
| F2 | 1.244 | 1.280 | 1.047 | 1.105 | 1.244 | 1.280 |
| F3 | 2.479 | 1.706 | 2.384 | 2.479 | 2.479 | 1.706 |

## Implementation Relevance for Klatt Synthesizer

### Direct Application

The exponential transition model (Model IVb, Eqs. 38-39) provides a principled way to compute formant trajectories in CVC context:

1. **Given:** consonant loci L_C, vowel targets T_V, reciprocal time constants beta_C, scale factors kappa_C
2. **Compute:** f_CV(t) = kappa_C * (T_V - L_C) * exp(-beta_C * t) for the CV transition
3. **Compute:** g_VC(t') = kappa'_C * (T_V - L'_C) * exp(-beta'_C * t') for the VC transition (backward from vowel end)
4. **Superpose:** F_CVC(t) = f_CV(t) + T_V + g_VC(t)
5. **Truncate** f at duration D (vowel end), g at -D (vowel start)

### Key Design Decisions

- **Superposition principle:** CV and VC transitions are independent and additive. This means consonant effects can be stored separately and combined at runtime.
- **Locus-based scaling:** Transition magnitude is proportional to (T_V - L_C). This allows parameterizing transitions by just the consonant locus and a shape function.
- **Exponential decay:** Transition shapes are exponential, so they can be implemented as simple exp() calls. The time constant beta controls transition speed.
- **Duration dependence:** Longer vowels allow transitions to complete more fully; shorter vowels show more coarticulation (undershoot). This falls out naturally from the exponential model — at short durations, transitions don't decay to zero before the next consonant begins.

### Limitations Noted

- /i/ excluded from F2 analysis (F2 transitions too flat, consonant influence minimal)
- /u/ also complicates the V/b/ and V/g/ models for F2
- Duration effects are attenuated in this data (speaking rate not varied)
- Only voiced plosives /b,d,g/ tested; other consonant classes need separate treatment
- The model does not account for nonadditive C-C' interactions

## Connection to Other Work

- **Lindblom (1963):** Exponential duration effect (Eq. 40) follows from Lindblom's vowel reduction findings
- **Ohman (1967):** Numerical coarticulation model — similar superposition concept
- **Delattre et al. (1955):** Consonant locus concept
- **Stevens & House (1963):** Perturbation of vowels by consonant context
- **Broad & Fertig (1970):** Earlier additive model work on formant trajectories
- **Schouten & Pols (1979a,b, 1981):** Spectral study of coarticulation, locus measurements
