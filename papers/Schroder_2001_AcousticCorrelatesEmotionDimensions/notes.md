---
title: "Acoustic Correlates of Emotion Dimensions in View of Speech Synthesis"
authors: "Marc Schröder, Roddy Cowie, Ellen Douglas-Cowie, Machiel Westerdijk, Stan Gielen"
year: 2001
venue: "Eurospeech 2001 - Scandinavia (7th European Conference on Speech Communication and Technology), Aalborg, Denmark"
doi_url: "https://doi.org/10.21437/Eurospeech.2001-34"
pages: "4"
affiliations: "DFKI Saarbrücken and Institute of Phonetics, University of the Saarland, Germany; Queen's University Belfast, Northern Ireland; University of Nijmegen, The Netherlands"
---

# Acoustic Correlates of Emotion Dimensions in View of Speech Synthesis

> **IDENTITY NOTE — WRONG PAPER RETRIEVED (read first).**
> The directory name and the pre-existing `metadata.json` claimed this was
> Schröder (2001), *"Emotional Speech Synthesis: A Review"*, DOI
> `10.21437/Eurospeech.2001-150`. The PDF actually stored at `paper.pdf` is a
> **different Schröder 2001 Eurospeech paper**: *"Acoustic Correlates of Emotion
> Dimensions in View of Speech Synthesis"*, DOI `10.21437/Eurospeech.2001-34`,
> co-authored with Cowie, Douglas-Cowie, Westerdijk and Gielen. The DOI stamp in
> the left margin of page 1 reads `10.21437/Eurospeech.2001-34`.
> The two are companion papers in the same proceedings volume: this paper cites
> the review as reference **[14]** ("Schröder, M., Emotional Speech Synthesis: A
> Review, *this volume*").
> These notes describe the PDF that is actually present. **The review paper has
> not been retrieved and still needs to be fetched separately.**
> Consequence for the requester: this paper is *not* a survey of emotional
> synthesis systems. It contains no system-by-system survey and no evaluation
> results for synthesizers. It does, however, contain something arguably more
> directly useful: **a complete, numeric, closed-form rule set mapping a
> 3-dimensional emotion space onto nine synthesizer-settable acoustic
> parameters, separately for female and male voices.**

## One-Sentence Summary

The paper derives quadratic linear-regression rules that predict nine
synthesizer-controllable acoustic variables (F0 median, F0 range, tune duration,
pause duration, F0 rise and fall steepness, median and range intensity, spectral
slope) directly from a speaker's position in the 3-dimensional
activation / evaluation / power emotion space, fitted on ~5500 data points of
spontaneous emotional speech, with all coefficients tabulated so the rules can be
dropped into a synthesizer as-is *(p.1-4)*.

## Problem Addressed

Emotional speech synthesis to date had concentrated on a small number of
discrete, extreme emotion categories, aiming for maximally distinguishable
prosodic profiles *(p.1)*. Applications instead need **weak** emotions and
**gradual change of emotional tone over time** *(p.1)*. Both become possible if
emotions are represented on continuous dimensions and if acoustic correlates of
those dimensions can be found. The paper searches a database of spontaneous
emotional speech for systematic correspondences between perceptually determined
positions on emotion dimensions and acoustic variables relevant to speech
synthesis *(p.1)*.

## Key Contributions

- Correlation and regression analysis of a large naturalistic emotional speech
  corpus against three emotion dimensions, establishing that nearly all acoustic
  variables correlate substantially with emotion dimensions *(p.2)*.
- **Tables 1 and 2**: complete quadratic regression coefficient sets for nine
  acoustic variables, separately for female and male speech — directly usable as
  synthesis rules *(p.4)*.
- **Table 3**: positions of five emotion categories (neutral, sad, angry, afraid,
  happy) in the activation/evaluation/power space, providing the bridge from
  categorical emotion labels to the continuous rule input *(p.3)*.
- A **stepwise rule-application method** that decomposes an emotion's acoustic
  profile into contributions from each dimension, distinguishing general
  emotional effects from emotion-specific specialised effects *(p.3)*.
- Verification that the regression predictions broadly agree with the published
  literature on discrete emotion acoustics, plus explicit identification of three
  points where they disagree *(p.2)*.

## Study Design

- **Type:** Corpus correlation / linear-regression study on a naturalistic
  (non-acted) emotional speech database.
- **Corpus:** Belfast Naturalistic Emotion Database — audio-visual recordings of
  **100 English speakers** showing relatively spontaneous emotion; material is TV
  chat-show and religious-program recordings plus studio-recorded interviews.
  Described as the largest collection of natural emotional speech available in
  terms of scale and range of emotions. **About 85% of speakers are female**
  *(p.1)*.
- **Emotion annotation:** perceptual, using the **FEELTRACE** tool. After a
  training phase, raters locate the emotional tone of a clip continuously over
  time in the 2-dimensional activation-evaluation space. Each clip is
  additionally labelled with a word from the **Basic English Emotion Vocabulary
  (BEEVer)**; the prior characterisation of those words supplies the **power**
  value. Result: each clip is positioned on three dimensions, with activation and
  evaluation varying over time and power static *(p.1)*.
- **Acoustic analysis:** semi-automatic, using the **ASSESS** system. ASSESS
  builds a simplified core representation of the signal from mainly the F0 and
  intensity contours, identifies 'landmarks' (peaks and troughs in the contours,
  boundaries of pauses and fricatives), and measures the 'pieces' between
  landmarks to give 'piecewise' variables describing contour behaviour over time.
  Variables are summarised as statistics covering central tendency, spread and
  key centiles. Additional measures cover 'tunes' and spectral properties *(p.1)*.
- **Unit of analysis:** the **'tune'** — a segment of the pitch contour bounded at
  either end by a pause of **180 ms or more** (i.e. an inter-pause stretch)
  *(p.1, p.2)*.
- **Data volume:** dimensional ratings on scales from **-100 to +100** aligned
  with the acoustic analysis of individual tunes within each clip, giving
  **ca. 5500 data points** total: **ca. 4700 female**, **ca. 850 male** *(p.2)*.
- **Statistics:** correlation and linear regression in **SPSS**, run separately
  for male and female speakers. Independent variables: A, E, P and their squares
  A², E², P². Dependent variable: each selected acoustic variable in turn *(p.2)*.
- **Significance threshold:** only correlations significant at **p < .05 or
  better** were considered for interpretation *(p.2)*.

## Acoustic Variables Selected for Synthesis Relevance

The selection criterion was explicitly *"those which can be set in speech
synthesis systems"* and for which corresponding ASSESS variables exist *(p.1)*.
**26 variables in total were selected** *(p.2)*, grouped as:

**Intonation** *(p.1)*
- global settings: F0 mean and F0 range
- accent structure: number of F0 maxima / minima per time unit; duration,
  magnitude and steepness of F0 rises and falls

**Tempo** *(p.1)*
- duration of pauses
- articulation tempo

**Intensity** *(p.2)*
- global settings: intensity mean and intensity range
- a simple measure of dynamics: the difference between mean intensity for
  intensity maxima and overall mean intensity

**Voice quality** *(p.2)*
- spectral slope
- approximations of the **Hammarberg indices** — Hammarberg et al. showed voice
  quality differences relate to differences in maximum intensity in each of three
  spectral bands; the measures here reflect those differences in the simplest
  possible way, ignoring coefficients and additional pitch-related variables
  *(footnote 3, p.2)*.

Explicit note on intensity: finer-grained intensity descriptions comparable to
those for F0 were available from ASSESS but were **deliberately not used, because
speech synthesis systems do not usually allow the same degree of control over
intensity as over F0** *(footnote 2, p.2)*.

## Key Equations / Statistical Models

The regression model form, for each acoustic variable, is quadratic in each of
the three emotion dimensions with no cross terms:

$$
V = c_0 + c_A A + c_{A^2} A^2 + c_E E + c_{E^2} E^2 + c_P P + c_{P^2} P^2
$$

Where:
- $V$ = the predicted acoustic variable, in the unit given in Tables 1 and 2
- $A$ = activation, dimensionless, scale -100 to +100
- $E$ = evaluation, dimensionless, scale -100 to +100
- $P$ = power (dominance/submission), dimensionless, scale -100 to +100
- $c_0$ = constant term, equal to the neutral-speech value (A=E=P=0)
- remaining $c_x$ = regression coefficients from Table 1 (female) or Table 2
  (male); a blank cell means that term was not significant and its coefficient is
  zero
*(p.2, p.4)*

**Worked example given by the authors (female speech, 'angry' at A=34.6,
E=-34.9, P=-33.7):**

$$
F0_{median} = 193.4 + 0.357 A + 0.00439 A^2 + 0.00245 E^2 - 0.215 P + 0.00096 P^2 = 222.3 \text{ Hz}
$$
Where: the neutral value is the constant, 193.4 Hz; the anger position raises
predicted median F0 to 222.3 Hz *(footnote 4, p.3)*.

**Critical caveat on using subsets of the coefficients.** The regression
coefficients for different independent variables influence each other, so the set
of coefficients obtained is **optimal only in precisely this combination**. If a
synthesis input specifies activation and evaluation but not power, it would
**not** be optimal to use the coefficients calculated here *(p.2)*. Any
implementation that wants a 2-dimensional (A/E-only) controller must refit rather
than zero out the P terms.

## Parameters

### Table 1 — Linear regression coefficients, FEMALE speech *(p.4)*

Blank cell = term not significant, treat as 0.

| Name | Symbol | Units | Default (constant, neutral) | Range | Page | Notes |
|------|--------|-------|------|-------|------|-------|
| F0 median | F0med | Hz | 193.4 | — | 4 | A +0.357; A² +0.00439; E —; E² +0.00245; P −0.215; P² +0.000957 |
| F0 range | F0rng | Hz | 27.84 | — | 4 | A +0.225; A² +0.00186; E −0.0420; E² —; P −0.0472; P² — |
| 'tune' duration | — | sec | 1.405 | — | 4 | A +0.00418; all other terms n.s. |
| pause duration | — | sec | 0.407 | — | 4 | A −0.00119; E² +0.0000143; all other terms n.s. |
| Median steepness of F0 rises | — | Hz/sec | 74.62 | — | 4 | A +0.338; A² +0.00320; P −0.231; others n.s. |
| Median steepness of F0 falls | — | Hz/sec | 83.89 | — | 4 | A +0.434; A² +0.00440; E −0.125; P −0.228; others n.s. |
| Median intensity | — | cB | 529.1 | — | 4 | A +0.0981; A² +0.00197; E −0.0735; E² +0.00183; P −0.105; P² −0.00513 |
| Range intensity | — | cB | 99.83 | — | 4 | A +0.119; A² —; E −0.0696; E² −0.00107; P −0.0742; P² — |
| Spectral slope, non-fricatives | — | dB/oct | −7.532 | — | 4 | A +0.0110; A² +0.000184; E —; E² +0.0000659; P —; P² −0.0000568 |

### Table 2 — Linear regression coefficients, MALE speech *(p.4)*

| Name | Symbol | Units | Default (constant, neutral) | Range | Page | Notes |
|------|--------|-------|------|-------|------|-------|
| F0 median | F0med | Hz | 140.3 | — | 4 | A +0.452; A² +0.00824; E —; E² −0.00243; P −0.194; P² — |
| F0 range | F0rng | Hz | 21.57 | — | 4 | A +0.248; all other terms n.s. |
| 'tune' duration | — | sec | 1.417 | — | 4 | A +0.0107; all other terms n.s. |
| pause duration | — | sec | 0.377 | — | 4 | A −0.00139; E −0.00123; E² +0.0000655; P² −0.0000332 |
| Median steepness of F0 rises | — | Hz/sec | 60.73 | — | 4 | A +0.469; E² +0.00420; others n.s. |
| Median steepness of F0 falls | — | Hz/sec | 60.99 | — | 4 | A +0.383; E −0.168; E² +0.00336; others n.s. |
| Median intensity | — | cB | 520.2 | — | 4 | A +0.305; E −0.231; P +0.185; others n.s. |
| Range intensity | — | cB | 103.8 | — | 4 | E² −0.00421 only; A term n.s. |
| Spectral slope, non-fricatives | — | dB/oct | −7.923 | — | 4 | A +0.00993; A² +0.000206; E +0.000476; E² −0.000102; P −0.00890; P² +0.000221 |

### Table 3 — Emotion category positions in the 3-D emotion space *(p.3)*

Positions are mean FEELTRACE positions for clips assigned that verbal emotion
label by the same rater (activation, evaluation); power is the value associated
with the verbal label in the BEEVer study. Scale −100 to +100.

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Neutral, activation | A | — | 0 | −100–100 | 3 | reference point; gives the constant terms |
| Neutral, evaluation | E | — | 0 | −100–100 | 3 | |
| Neutral, power | P | — | 0 | −100–100 | 3 | |
| Sad, activation | A | — | −8.5 | −100–100 | 3 | slightly deactivated |
| Sad, evaluation | E | — | −42.9 | −100–100 | 3 | strongly negative |
| Sad, power | P | — | −55.3 | −100–100 | 3 | strongly submissive |
| Angry, activation | A | — | 34.6 | −100–100 | 3 | |
| Angry, evaluation | E | — | −34.9 | −100–100 | 3 | |
| Angry, power | P | — | −33.7 | −100–100 | 3 | |
| Afraid, activation | A | — | 31.1 | −100–100 | 3 | close to anger on A |
| Afraid, evaluation | E | — | −27.1 | −100–100 | 3 | close to anger on E |
| Afraid, power | P | — | −79.4 | −100–100 | 3 | the dimension that separates fear from anger |
| Happy, activation | A | — | 28.9 | −100–100 | 3 | |
| Happy, evaluation | E | — | 39.8 | −100–100 | 3 | only positive-evaluation entry |
| Happy, power | P | — | 12.5 | −100–100 | 3 | only positive-power entry |

### Other quantities

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Speakers in database | — | count | 100 | — | 1 | English, relatively spontaneous emotion |
| Female speaker proportion | — | % | 85 | — | 1 | drives the female/male data imbalance |
| Emotion dimension scale | — | — | — | −100–100 | 2 | FEELTRACE / BEEVer rating scale |
| Tune boundary pause threshold | — | ms | 180 | — | 1 | a 'tune' is bounded by pauses ≥180 ms |
| Acoustic variables selected | — | count | 26 | — | 2 | of which 9 are tabulated as rules |
| Total data points | N | count | ~5500 | — | 2 | one per tune |
| Female data points | N | count | ~4700 | — | 2 | |
| Male data points | N | count | ~850 | — | 2 | ~5× fewer than female |
| Significance threshold | p | — | 0.05 | — | 2 | only p<.05 correlations interpreted |

## Effect Sizes / Key Quantitative Results

The paper reports **regression coefficients rather than correlation magnitudes,
confidence intervals, R² values, or p-values per coefficient**. The coefficient
tables above are the quantitative result. Directional findings, all *(p.2)*:

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Any systematic emotion-acoustic correlation | null hypothesis test | rejected | — | <.05 | all speakers | 2 |
| Activation → F0 mean | sign of correlation | positive | — | <.05 | both sexes | 2 |
| Activation → F0 range | sign of correlation | positive | — | <.05 | both sexes | 2 |
| Activation → phrase (tune) length | sign of correlation | positive (longer) | — | <.05 | both sexes | 2 |
| Activation → pause duration | sign of correlation | negative (shorter) | — | <.05 | both sexes | 2 |
| Activation → F0 rise/fall magnitude and steepness | sign of correlation | positive (larger, faster) | — | <.05 | both sexes | 2 |
| Activation → intensity | sign of correlation | positive | — | <.05 | both sexes | 2 |
| Activation → spectral slope | sign of correlation | flatter slope | — | <.05 | both sexes | 2 |
| Evaluation (negative) → pause duration | sign of correlation | longer pauses | — | <.05 | both sexes | 2 |
| Evaluation (negative) → F0 fall speed | sign of correlation | faster falls | — | <.05 | both sexes | 2 |
| Evaluation (negative) → intensity | sign of correlation | increased | — | <.05 | both sexes | 2 |
| Evaluation (negative) → intensity maxima prominence | sign of correlation | more prominent | — | <.05 | both sexes | 2 |
| Power (high) → F0 mean | sign of correlation | negative (lower F0) | — | <.05 | both sexes | 2 |
| Power (high) → F0 rise/fall steepness | sign of correlation | less steep | — | <.05 | female only | 2 |
| Power (high) → F0 fall magnitude | sign of correlation | smaller | — | <.05 | female only | 2 |
| Power (high) → intensity | sign of correlation | reduced | — | <.05 | female | 2 |
| Power (high) → intensity | sign of correlation | increased | — | <.05 | male | 2 |
| Predicted median F0, angry, female | Hz | 222.3 | — | — | vs. 193.4 Hz neutral, +28.9 Hz | 3 |

Ranking of dimension strength: **activation produced the most numerous and
strongest correlations**; **evaluation correlations were less numerous and less
strong, but systematic**; power correlations were fewest and partly sex-specific
*(p.2)*. More significant correlations were found for female than for male speech
because the female sample was about five times larger *(p.2)*.

## Methods & Implementation Details

- Rule application is a straight arithmetic evaluation of the quadratic
  polynomial per acoustic variable; nine independent polynomials, no coupling
  between output variables *(p.4)*.
- Two separate coefficient sets are required, keyed on speaker sex. There is no
  unified model *(p.4)*.
- Squared terms were included specifically to allow modelling of **simple
  non-linear behaviour** in the emotion-to-acoustics mapping *(p.2)*.
- **Stepwise rule application** for decomposing an emotion into dimension
  contributions *(p.3)*:
  1. Compute the acoustic correlates of the **activation and evaluation** levels
     alone (holding P at its neutral value). For anger and fear these are nearly
     equal, and this step yields increased F0 median and range vs. neutral,
     steeper F0 rises and falls, increased intensity, and a flatter spectral
     slope.
  2. Apply the **power** rules using each emotion's own power value. Fear's power
     is more extreme (−79.4 vs anger's −33.7), so the power effects for fear are
     stronger.
  3. The residual difference from the literature-reported profile for that emotion
     is attributed to emotion-specific specialised properties not captured by the
     three dimensions.
- Because power is negative for both anger and fear, and F0 median has a negative
  P coefficient, step 2 produces an **even higher F0 median for fear than for
  anger**; a slightly higher F0 range for female voices; even steeper F0 rises
  and falls for female voices; and a lower intensity *(p.3)*.
- Limitations of the ASSESS front end that constrain what could be modelled: no
  phone boundaries are detected, so only approximate measures of articulation
  tempo are available (length of tunes, number of intensity peaks per second,
  number of fricative stretches per second). Location of pauses relative to
  sentence structure, and articulation precision, are **not available at all**,
  because they need linguistic information ASSESS does not have *(p.2)*.
- Intensity units are **cB (centibels)** in the tables; spectral slope is in
  **dB/octave**, measured over non-fricative material *(p.4)*.

## Figures of Interest

The paper contains **no figures**, only three tables.
- **Table 1 (p.4):** female-speech regression coefficients, nine acoustic
  variables × seven coefficient columns. This is the primary implementable
  artefact.
- **Table 2 (p.4):** male-speech regression coefficients, same layout. Notably
  sparser — many terms are not significant, reflecting the ~850-point sample.
- **Table 3 (p.3):** emotion category coordinates for neutral, sad, angry,
  afraid, happy.

## Results Summary

Nearly all acoustic variables show substantial correlations with the emotion
dimensions; the null hypothesis of no systematic correlation is rejected *(p.2)*.
Activation dominates: active emotion means higher F0 mean and range, longer
phrases, shorter pauses, larger and faster F0 rises and falls, increased
intensity, and a flatter spectral slope *(p.2)*. Negative evaluation means longer
pauses, faster F0 falls, increased intensity, and more prominent intensity maxima
*(p.2)*. Higher power means lower F0 mean for both sexes; for females also
shallower F0 rises and falls, smaller-magnitude F0 falls, and reduced intensity,
whereas for males intensity is increased *(p.2)*. The regression coefficients
give predictions that broadly agree with the published acoustic profiles of
discrete emotions *(p.3, p.4)*. The corpus is heterogeneous and naturalistic, so
finding numerous correlations at all is itself a notable result *(p.3)*.

## Limitations

- ASSESS cannot detect phone boundaries, so articulation tempo is only
  approximated and articulation precision is unavailable; pause placement
  relative to sentence structure is likewise unavailable *(p.2)*.
- Fine-grained intensity control was deliberately excluded because synthesizers
  do not offer intensity control comparable to F0 control *(footnote 2, p.2)*.
- The male model rests on ~850 data points against ~4700 for female, so fewer
  correlations reach significance for male speech; the male coefficient table is
  correspondingly sparse *(p.2)*.
- The coefficient sets are jointly optimal only as complete sets. Dropping a
  dimension from the input invalidates the remaining coefficients *(p.2)*.
- The three dimensions are **not expected to capture all relevant characteristics
  of emotions**. Emotion words such as 'worrying' or 'loving' include highly
  specialised properties which may have acoustic effects that a three-dimensional
  description cannot account for *(p.3)*.
- Power is static per clip while activation and evaluation vary over time, an
  asymmetry inherited from the annotation scheme *(p.1)*.
- The database is 85% female, so the corpus is unbalanced by sex *(p.1)*.
- Very few comparable studies exist (database scale and naturalness), limiting
  external validation *(p.2)*.
- The synthesis implementation itself is future work; **no synthesis system was
  built and no perceptual evaluation was run in this paper** *(p.3)*.

## Arguments Against Prior Work

- Prior emotional speech synthesis has concentrated on a **small number of
  discrete, extreme emotion categories**, aiming for maximally distinguishable
  prosodic profiles. This cannot model weak emotions or gradual change of
  emotional tone over time, both of which applications need *(p.1)*.
- Against **Pereira [12]** (two actors, two sentences, several emotional states):
  agreement on activation correlating positively with F0 mean, F0 range and mean
  intensity; agreement that evaluation correlations are weaker; agreement that
  power correlates positively with mean intensity for male speech. **Disagreement
  on two points**: for female speech this study finds a weak *negative*
  correlation of power to mean intensity where Pereira finds positive; and
  Pereira's reported positive correlations of power to F0 mean and range for male
  speech **cannot be confirmed** from this data *(p.2)*.
- Against **Banse & Scherer [1]**: agreement that "intense" emotions (despair, hot
  anger, panic fear, elation) show the highest F0 mean and mean energy, when
  "intense" is read as high activation. **Disagreement**: Banse & Scherer's
  observation that low coping potential (low power) leads to a high energy
  proportion in low frequency bands, i.e. a steep negative spectral slope,
  **cannot be found in this data — the opposite holds**: low power is accompanied
  by a *flatter* spectral slope for both female and male speakers *(p.2)*.
- **Supporting** Ohala's frequency code [11], by which dominance (high power) is
  signalled through low F0: confirmed, power correlates negatively with F0 median
  for both female and male speakers *(p.2)*.

## Design Rationale

- **Dimensional rather than categorical emotion representation** was chosen
  because dimensions give a taxonomy allowing simple distance measures between
  emotion categories *and* a continuous framework for representing gradual,
  non-extreme emotional states *(p.1)*.
- **Three dimensions** (activation, evaluation, power), acknowledged not to
  capture all aspects of an emotional state, are accepted as a deliberate
  simplification for the sake of that continuity *(p.1, p.3)*.
- **Acoustic variable selection was driven by synthesizer controllability**, not
  by what the analysis tool could best measure: only variables that can be set in
  speech synthesis systems and for which ASSESS equivalents exist were retained
  *(p.1)*.
- **Squared terms** were added specifically to permit simple non-linear behaviour
  in the mapping *(p.2)*.
- **Separate male and female models** rather than a pooled model with a sex
  covariate, justified by genuinely opposite-signed effects (power → intensity)
  between the sexes *(p.2)*.
- **Naturalistic corpus over acted portrayals**, giving a scale and range of
  emotions the acted literature lacks, at the cost of heterogeneity *(p.1, p.3)*.
- The stepwise application method exists to **separate general emotional
  properties from specialised ones**, so that a residual mismatch with the
  literature is diagnostic rather than merely an error *(p.3)*.

## Testable Properties

- Setting A=E=P=0 must reproduce the constant column exactly: female median F0
  193.4 Hz, F0 range 27.84 Hz, tune duration 1.405 s, pause duration 0.407 s,
  rise steepness 74.62 Hz/s, fall steepness 83.89 Hz/s, median intensity 529.1 cB,
  range intensity 99.83 cB, spectral slope −7.532 dB/oct *(p.4)*.
- Setting A=E=P=0 for male must give median F0 140.3 Hz, F0 range 21.57 Hz, tune
  duration 1.417 s, pause duration 0.377 s, rise steepness 60.73 Hz/s, fall
  steepness 60.99 Hz/s, median intensity 520.2 cB, range intensity 103.8 cB,
  spectral slope −7.923 dB/oct *(p.4)*.
- Female 'angry' (A=34.6, E=−34.9, P=−33.7) must yield median F0 = 222.3 Hz
  *(footnote 4, p.3)*.
- Increasing activation must monotonically increase F0 median, F0 range, tune
  duration, F0 rise steepness, F0 fall steepness, median intensity and spectral
  slope, and must decrease pause duration, over the region where the linear term
  dominates *(p.2, p.4)*.
- Increasing power must decrease F0 median for both sexes *(p.2, p.4)*.
- Increasing power must decrease median intensity for female speech and increase
  it for male speech; the sign of the P coefficient on median intensity must
  differ between Table 1 (−0.105) and Table 2 (+0.185) *(p.2, p.4)*.
- Predicted median F0 for 'afraid' must exceed that for 'angry', because fear's
  power (−79.4) is more extreme than anger's (−33.7) and the P coefficient on F0
  median is negative *(p.3)*.
- Predicted intensity for 'afraid' must be lower than for 'angry' *(p.3)*.
- Low power must produce a **flatter** spectral slope, not a steeper one; this is
  the point where the model contradicts Banse & Scherer *(p.2)*.
- Zeroing the P terms while keeping the A and E terms is **invalid** and must not
  be treated as a supported 2-dimensional mode *(p.2)*.
- A dimension-only model must fail to reproduce specialised emotion words such as
  'worrying' or 'loving'; residual mismatch there is expected, not a bug *(p.3)*.

## Relevance to Project

Very high, and higher than the review paper would have been for the specific
purpose of **emotion control by rule in a formant/source-filter synthesizer**.
Concretely:

- **Direct drop-in rule set.** Nine polynomials, 63 numbers per sex, mapping a
  3-vector to synthesizer settings. Six of the nine outputs (F0 median, F0 range,
  F0 rise steepness, F0 fall steepness, median intensity, range intensity) map
  onto a Klatt-family synthesizer's prosody layer without translation. Pause and
  tune duration map onto the timing layer.
- **Spectral slope is the voice-quality hook.** In a source-filter synthesizer,
  spectral slope in dB/octave over non-fricative material corresponds to the
  glottal source tilt parameter (Klatt's TILT, or the spectral tilt of the LF /
  KLGLOTT88 source). The model gives it a numeric emotion dependence:
  female −7.532 dB/oct at neutral, moving flatter with activation
  (+0.0110/unit A). That gives a principled, continuous mapping from emotion to
  source tilt rather than the usual hand-tuned per-emotion presets.
- **Continuous control, not presets.** The main architectural payoff: emotion
  becomes a 3-float control vector rather than an enum of emotion presets, with
  weak emotions and smooth interpolation for free.
- **Table 3 is the compatibility shim.** A categorical API (`speak(text,
  emotion="angry")`) can be implemented on top of the continuous engine by
  looking up the category's coordinates in Table 3 and running the rules.
- **Constants are neutral-voice defaults.** Female 193.4 Hz / male 140.3 Hz
  median F0 and the corresponding ranges (27.84 / 21.57 Hz) are usable as
  naturalistic neutral baselines, notably narrower than typical synthetic
  defaults.
- **Caveats to carry into the implementation.** Intensity is in centibels and the
  corpus is TV/interview audio with uncontrolled recording gain, so absolute
  intensity values are unlikely to transfer; use the *deltas* from the constant,
  not the absolutes. Requires a speaker-sex switch. The coefficients are valid
  only as complete sets, so a 2-dimensional controller needs its own fit.
- **What this paper does not give:** no survey of emotional synthesis systems, no
  voice-quality parameters beyond spectral slope (no breathiness, no jitter, no
  open quotient), no formant-level correlates, no evaluation results. For those,
  the actual review paper (`Eurospeech.2001-150`) and Murray & Arnott [10] are
  the sources to fetch.

## Open Questions

- [ ] The companion review paper, Schröder "Emotional Speech Synthesis: A Review"
      (Eurospeech 2001, DOI `10.21437/Eurospeech.2001-150`), reference [14] here,
      still needs to be retrieved. That is the paper that actually surveys systems
      and evaluations.
- [ ] No R², no per-coefficient significance values, and no residual variance are
      reported, so the predictive quality of each polynomial is unknown from this
      paper alone.
- [ ] Absolute intensity in cB is not calibrated against any reference level;
      transferring median intensity 529.1 cB to a synthesizer requires an
      unspecified mapping.
- [ ] The ASSESS 'spectral slope non-frics.' definition (frequency band, fitting
      method) is not given here; needs Cowie, Sawey & Douglas-Cowie [6].
- [ ] The remaining 17 of the 26 selected acoustic variables are never tabulated.
- [ ] The Hammarberg-index approximations were computed but do not appear in the
      coefficient tables; their emotion dependence is unreported.
- [ ] Whether the rules survive perceptual evaluation in an actual synthesizer is
      explicitly left as future work.
- [ ] No mechanism is given for handling activation and evaluation varying over
      time within an utterance while power stays static.

## Related Work Worth Reading

- **[14] Schröder, M., "Emotional Speech Synthesis: A Review", Eurospeech 2001
  (this volume)** — the companion survey; the paper that was actually requested.
- **[10] Murray, I. R., & Arnott, J. L., "Toward the simulation of emotion in
  synthetic speech: A review of the literature on human vocal emotion",
  JASA 93(2), 1993, p. 1097-1108** — the standard source of per-emotion acoustic
  profiles this paper repeatedly compares against; the direct rule-table
  reference for a by-rule emotional synthesizer.
- **[1] Banse, R., & Scherer, K. R., "Acoustic Profiles in Vocal Emotion
  Expression", J. Pers. Soc. Psy. 70(3), 1996, p. 614-636** — the main acted-
  corpus reference; contradicted here on the power/spectral-slope relation.
- **[6] Cowie, R., Sawey, M., & Douglas-Cowie, E., "A new speech analysis system:
  ASSESS", ICPhS 1995, Stockholm, 3, p. 278-281** — needed to pin down the exact
  definitions of the acoustic variables in Tables 1 and 2.
- **[9] Hammarberg, B., et al., "Perceptual and acoustic correlates of abnormal
  voice quality", Acta Otolaryngologica 90, 1980, p. 441-451** — the voice-quality
  spectral-band measures.
- **[4] Cowie, R., et al., "FEELTRACE: An Instrument for Recording Perceived
  Emotion in Real Time", ISCA Workshop on Speech & Emotion 2000, p. 19-24** — the
  annotation instrument defining the activation/evaluation scales.
- **[11] Ohala, J. J., "The frequency code underlies the sound-symbolic use of
  voice pitch", in *Sound Symbolism*, 1994, p. 325-347** — the theoretical account
  of the power/F0 relation confirmed here.

## Collection Cross-References

### Already in Collection
- [Acoustic Profiles in Vocal Emotion Expression](../Banse_1996_VocalEmotionAcousticProfiles/notes.md) - cited as ref [1]; this paper contradicts Banse & Scherer on the power/spectral-slope relation, so both are needed to adjudicate.
- [Murray & Arnott 1993 - Implementation Notes](../Murray_1993_SimulationEmotionSyntheticSpeech/notes.md) - cited as ref [10], the canonical review of human vocal emotion correlates and the source of the per-emotion acoustic profiles this paper's rules are validated against.
- [Hammarberg et al. 1980 - Perceptual and Acoustic Correlates of Abnormal Voice Qualities](../Hammarberg_1980_PerceptualAcousticCorrelatesVoice/notes.md) - cited as ref [9] for the three-spectral-band voice-quality measures this paper approximates, relevant to mapping emotion onto glottal source parameters.
- [Emotional Speech Synthesis: A Review](../Schroder_2001_EmotionalSpeechSynthesisReview/notes.md) - companion paper by the same author (ref [14], "this volume"), published the same year at the same conference; that review surveys discrete-category rule sets with measured recognition rates, while this paper supplies the continuous activation/evaluation/power dimensional mapping the review only gestures at via FEELTRACE.

### New Leads (Not Yet in Collection)
- Cowie, R., Douglas-Cowie, E., Savvidou, S., McMahon, E., Sawey, M. & Schröder, M. (2000) - "FEELTRACE: An Instrument for Recording Perceived Emotion in Real Time" - the real-time dimensional annotation tool underlying this paper's activation/evaluation/power ratings.
- Cowie, R., Sawey, M. & Douglas-Cowie, E. (1995) - "A new speech analysis system: ASSESS" - required to pin down the operational definitions of the nine acoustic variables in this paper's Tables 1 and 2.
- Ohala, J.J. (1994) - "The frequency code underlies the sound-symbolic use of voice pitch" - theoretical grounding for the pitch/emotion-dimension mapping.

### Cited By (in Collection)
- [Emotional Speech Synthesis: A Review](../Schroder_2001_EmotionalSpeechSynthesisReview/notes.md) - the companion review already lists this paper in its own Conceptual Links (mutual cross-reference already in place).

### Conceptual Links (not citation-based)
- [Beyond Arousal: Valence and Potency/Control Cues in the Vocal Expression of Emotion](../Goudbeek_2010_ValencePotencyVocalEmotion/notes.md) - Strong. Goudbeek maps the same activation/evaluation(-power) dimensional space from the perception side, over a decade later; both find arousal/activation carried by prosodic parameters (pitch, tempo, intensity) while valence/evaluation needs additional spectral cues, converging from production (this paper) and perception (Goudbeek) on the same dimensional-emotion framework.
