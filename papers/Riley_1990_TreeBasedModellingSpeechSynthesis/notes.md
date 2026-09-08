---
title: "Tree-Based Modelling for Speech Synthesis"
authors: "Michael D. Riley"
year: 1990
venue: "ESCA Workshop on Speech Synthesis, Autrans, France, September 25-28, 1990"
doi_url: "https://www.isca-archive.org/ssw_1990/riley90_ssw.html"
pages: "229-232"
affiliation: "AT&T Bell Laboratories, 600 Mountain Av, Rm 2D454, Murray Hill, NJ 07974"
note: "Read as a stand-in for Riley 1992, 'Tree-based modelling of segmental durations' (in Talking Machines: Theories, Models and Designs, Elsevier), which was not retrievable. This 1990 ESCA workshop paper is the precursor and carries the same duration-modelling method in compressed form. Anything the 1992 chapter adds (larger corpora, tree diagrams, listening tests) is NOT in this source."
---

# Tree-Based Modelling for Speech Synthesis

## Ingestion scope

Full paper. 4 pages (printed pages 229-232), scanned ISCA Archive copy; all content
below was read from the page images. The paper has no figures, no tables, and no
displayed equations. Section 2 (end-of-sentence detection) is a separate application
of the same CART machinery and is extracted in full even though the project's
interest is Section 3 (segment durations).

## One-Sentence Summary

Riley shows that a CART regression tree trained on 1500 hand-segmented utterances from
one male speaker, using segment context, stress, lexical position, and phrasing position
as features, predicts segmental duration with a 23 ms residual standard deviation versus
over 35 ms for the Bell Labs hand-written duration rules on the same data. *(p.231)*

## Problem Addressed

Segmental duration prediction is a major contributor to the unnaturalness of synthetic
speech. Common practice is to hand-write duration rules from exploratory analysis of
natural speech plus what sounds good when synthesized (Klatt 1976), and despite large
effort invested in such heuristic rule sets (Syrdal 1989), "natural-sounding durations
still eludes us." *(p.231)* Now that phonetically segmented databases of several thousand
sentences from a single speaker exist, a systematic statistical approach becomes
possible. *(p.231)*

The broader framing: problems that depend on a large number of interrelated variables
may overwhelm a human observer while remaining amenable to the right statistical
approach. *(p.229)*

## Key Contributions

- A CART **classification** tree for end-of-sentence detection (deciding whether a period
  in text ends a declarative sentence or belongs to an abbreviation), reaching 99.8%
  correct classification on the Brown corpus. *(p.229, p.230)*
- A CART **regression** tree for segmental duration prediction, trained on 1500 utterances
  of a single male speaker, giving residuals with a 23 ms standard deviation. *(p.229, p.231)*
- A phone-coding scheme that decomposes each of 48 phones into four multi-valued
  phonetic features (consonant manner, consonant place, "vowel manner", "vowel place")
  to keep the categorical-split search tractable. *(p.232)*
- An empirical claim that duration residual versus number of observations is nearly a
  straight line on a log-log plot, i.e. the method is data-intensive and improves with
  corpus size. *(p.232)*

## Why CART

Riley gives four properties of CART that suit synthesis problems *(p.229)*:

1. It statistically selects the most significant features involved.
2. It provides "honest" estimates of its performance.
3. It permits both categorical (e.g. "nasal", "stop") and continuous (e.g. segmental
   duration) features to be considered.
4. It allows human interpretation and exploration of the result.

The result of CART is "a binary decision tree whose branches are labelled with binary
cuts on the continuous features and with binary partitions on the categorical features
and whose terminal nodes are labelled with continuous predictions (*regression tree*) or
categorical predictions (*classification tree*)." *(p.229)*

The paper explicitly declines to describe the theory and defers to Breiman et al. 1984:
"Space does not permit much description of the theory." *(p.229)*

## Study Design

- **Type:** Two applied machine-learning experiments (supervised tree induction), no
  human-subject listening test reported numerically.
- **Task 1 population:** the tagged Brown corpus, ~1 million words, used for
  end-of-sentence classification; word probabilities computed from a separate 25-million-word
  AP news text database. *(p.230)*
- **Task 2 population:** 1500 utterances of a **single male speaker**, hand-segmented and
  hand-labelled. Stress and phrasing labels were not hand-annotated: they came from the
  predictions of the then-current Bell Labs text-to-speech synthesizer applied to the
  orthographic transcription. *(p.231)*
- **Primary endpoint task 1:** percent correct classification of end-stop vs not-end-stop.
- **Primary endpoint task 2:** standard deviation of the duration prediction residual, in
  milliseconds.
- **Comparator task 2:** the current (hand-derived, heuristic) Bell Labs duration rules
  applied to the same data. *(p.231)*
- **Perceptual comparison:** informal only. "The quality of the synthesis using
  tree-derived durations compares favorably with the heuristically-derived durations,
  but is not strikingly better." No listener counts, scale, or statistics are given. *(p.231)*

## Methodology

### Application 1: End-of-sentence detection

Motivation. A period must end a declarative sentence by convention, but also occurs in
abbreviations, and abbreviations can occur at the end of a sentence. In the tagged Brown
corpus of a million words, about **90% of periods occur at the end of sentences, 10% at
the end of abbreviations, and about 1/2% at both**; declaring every period an end-stop is
therefore wrong about 10% of the time. *(p.230)* The two-spaces-after-an-end-stop
convention is often ignored and in some sources (AP news) never obeyed, so surface
whitespace is not usable. *(p.230)*

Feature set for the classification tree *(p.230)*:

1. Prob[word with "." occurs at end of sentence]
2. Prob[word after "." occurs at beginning of sentence]
3. Length of word with "."
4. Length of word after "."
5. Case of word with ".": Upper, Lower, Cap, Numbers
6. Case of word after ".": Upper, Lower, Cap, Numbers
7. Punctuation after "." (if any)
8. Abbreviation class of word with "." — e.g. month name, unit-of-measure, title,
   address name, etc.

The feature choice "was based on what humans appear to use (at least when constrained to
looking at a few words around the '.')." *(p.230)*

The two word probabilities were computed from 25 million words of AP news, a much larger
and independent text database. In fact those probabilities were for **beginning and end
of paragraphs**, because paragraph boundaries are explicitly marked in the AP data while
sentence ends are not — a deliberate proxy. *(p.230)*

Result: 99.8% accuracy identifying whether a word ending in "." is at the end of a
declarative sentence in the Brown corpus. The majority of errors are difficult cases,
e.g. a sentence that ends with "Mrs." or one that begins with a numeral. *(p.230)*

Four lessons Riley draws from this example *(p.230)*:

1. It is a simple example of CART used for **classification**: the prediction is
   categorical, "end-stop" or "not an end-stop".
2. High performance follows from careful choice of the feature set. "The researcher's
   role is to use his insight and analysis of the problem to select an appropriate
   feature set. The classification algorithm's role is to try to provide a weighting of
   these various features that gives the minimum error."
3. Even simple-minded features work for a very large percentage of cases. Cases that
   seem to require understanding sentence meaning exist but are rare.
4. The procedure is rapid: once the data are collected, the actual statistical analysis
   takes only a few minutes of CPU time.

### Application 2: Segment duration modelling

Riley states the central design decision plainly: "Taking this approach, the most
important decision is in selecting the feature set. The set used here was chosen both
from what seemed to be important factors and from what could be readily computed."
*(p.231)*

Feature set for the duration regression tree *(p.231)*:

- **Segment Context:** three segments to the left; the segment to predict; three segments
  to the right (a **7-segment window**).
- **Stress:** 0, 1, 2.
- **Lexical Position:**
  - Segment count from start of word
  - Segment count from end of word
  - Vowel count from start of word
  - Vowel count from end of word
- **Phrasing Position:**
  - Word count from start of phrase
  - Word count from end of phrase

That is 7 segment-identity slots (each expanded into 4 phonetic sub-features, see below)
plus stress plus 4 lexical-position counters plus 2 phrasing-position counters.

Training data: 1500 utterances, single male speaker, hand-segmented and labelled. Stress
and phrasing came from Bell Labs TTS predictions over the orthographic transcription,
not from hand annotation. *(p.231)*

### Phone coding (the categorical-cardinality problem)

A reasonable phone set has many dozens of phones; **48 phones** were used here. If each
segment position were a single categorical feature, about **2^48 binary partitions**
would have to be considered for that variable at each node, which is impractical (Riley
cites Breiman et al. p. 29). *(p.232)*

Chou (1988, cited in text as [Chou 1987]) proposes k-means clustering to find
sub-optimal but good partitions in linear time. *(p.232)*

**The solution adopted here** is to classify each phone in terms of **4 features**, each
taking on about a dozen values *(p.232)*:

| Feature | Example values |
|---------|----------------|
| consonant manner | voiced fricative, unvoiced stop, nasal, etc. |
| consonant place | bilabial, dental, velar, etc. |
| "vowel manner" | monophthong, diphthong, glide, liquid, etc. |
| "vowel place" | front-low, central-mid-high, back-high, etc. |

Any of the four can take the value **n/a** when it does not apply; e.g. for a vowel,
consonant manner and consonant place are both n/a. "In this way, every segment is
decomposed into four multi-valued features that have acceptable complexity to the
classification scheme and that have some phonetic justification." *(p.232)*

Note the typo in the source: the paper writes "Consonant manner takes on values such as
bilabial, dental, velar" for what is evidently consonant **place**. *(p.232)*

### Splitting criterion, stopping rule, tree size

**Not reported.** The paper gives no impurity/deviance function, no pruning rule, no
cross-validation scheme, no node-count or depth for either tree, and no tree diagram. It
delegates entirely to Breiman et al. 1984 ("Space does not permit much description of the
theory"). *(p.229)* The only algorithmic property stated is complexity:

$$
T_{\text{grow}} \propto N \log N
$$

Where: $T_{\text{grow}}$ is tree-growing computation time and $N$ is the number of
observations. Riley uses this to argue much larger datasets can easily be handled. *(p.231)*

Reader's note for implementation: standard CART regression as in Breiman et al. 1984
splits on least-squares deviance (within-node sum of squared deviations from the node
mean) and predicts the node mean at each leaf, with cost-complexity pruning selected by
cross-validation. That is the natural reading of "regression tree" here, but the paper
does not state it, so treat it as inference, not as a claim of this paper.

## Key Equations

$$
\sigma_{\text{residual}}^{\text{tree}} = 23\ \text{ms}
$$
Where: $\sigma_{\text{residual}}$ is the standard deviation of the segmental-duration
prediction residual (predicted minus observed duration) on the 1500-utterance
single-speaker database. *(p.229, p.231)*

$$
\sigma_{\text{residual}}^{\text{rules}} > 35\ \text{ms}
$$
Where: the same residual standard deviation for the then-current hand-derived Bell Labs
duration rules applied to the same data. *(p.231)*

$$
\log(\sigma_{\text{residual}}) \approx a - b \log(N)
$$
Where: $N$ is the number of training observations. Riley reports only that "the plot of
duration residual vs. number of observations is nearly a straight line on a log-log
plot" when trees are grown on subsets of the data; the slope $b$ and intercept $a$ are
**not given**, and no such plot is printed in the paper. *(p.232)*

## Parameters

### Duration model (Section 3)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Training utterances | - | utterances | 1500 | - | 231 | Single male speaker, hand-segmented and labelled |
| Speakers in duration corpus | - | speakers | 1 | - | 231 | Male |
| Segment context window | - | segments | 7 | - | 231 | 3 left + target + 3 right; "easily made larger" (p.232) |
| Segments to left | - | segments | 3 | - | 231 | |
| Segments to right | - | segments | 3 | - | 231 | |
| Stress level | - | - | - | 0-2 | 231 | Three-valued categorical; predicted by Bell Labs TTS, not hand-labelled |
| Lexical position counters | - | count | 4 | - | 231 | Segment-from-start, segment-from-end, vowel-from-start, vowel-from-end |
| Phrasing position counters | - | count | 2 | - | 231 | Word-from-start-of-phrase, word-from-end-of-phrase |
| Phone inventory size | - | phones | 48 | - | 232 | |
| Naive categorical partitions per segment slot | - | partitions | 2^48 | - | 232 | Why the raw phone identity is not usable as a single feature |
| Phonetic decomposition features per phone | - | features | 4 | - | 232 | consonant manner, consonant place, vowel manner, vowel place |
| Values per phonetic feature | - | values | ~12 | - | 232 | "about a dozen values"; plus n/a |
| Duration residual SD, tree | - | ms | 23 | - | 229, 231 | Standard deviation of residuals |
| Duration residual SD, hand rules | - | ms | >35 | - | 231 | Same data, current Bell Labs rules |
| Tree-growing time complexity | - | - | N log N | - | 231 | In number of observations |

### End-of-sentence model (Section 2)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Classification accuracy | - | % | 99.8 | - | 229, 230 | Brown corpus |
| Brown corpus size | - | words | ~1,000,000 | - | 230 | Tagged |
| AP news probability corpus size | - | words | 25,000,000 | - | 230 | Independent; used for the two word probabilities |
| Periods ending sentences | - | % | 90 | - | 230 | Brown corpus |
| Periods ending abbreviations | - | % | 10 | - | 230 | Brown corpus |
| Periods that are both | - | % | 0.5 | - | 230 | Brown corpus |
| Baseline error, always-end-stop | - | % | 10 | - | 230 | Declaring every period an end-stop |
| Features in classification tree | - | features | 8 | - | 230 | Listed in Methodology |
| Case categories | - | - | 4 | - | 230 | Upper, Lower, Cap, Numbers |
| Analysis CPU time | - | minutes | "a few" | - | 230 | Once data are collected |

## Effect Sizes / Key Quantitative Results

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Segmental duration prediction | Residual SD | 23 ms | not reported | not reported | 1500 utterances, one male speaker | 231 |
| Segmental duration prediction, baseline | Residual SD | >35 ms | not reported | not reported | Same data, hand-derived Bell Labs rules | 231 |
| Relative residual reduction | SD ratio | ~0.66 (23/35) | not reported | not reported | Derived by this reader from the two figures above | 231 |
| End-of-sentence detection | Accuracy | 99.8% | not reported | not reported | Brown corpus | 230 |
| End-of-sentence detection, baseline | Accuracy | ~90% | - | - | Always predict end-stop | 230 |
| Perceived synthesis quality | Informal judgement | "compares favorably... but is not strikingly better" | - | - | No listening-test protocol reported | 231 |

No confidence intervals, standard errors, significance tests, or listener counts appear
anywhere in the paper.

## Methods & Implementation Details

- Grow a binary CART tree; branches carry binary cuts on continuous features and binary
  partitions on categorical features; leaves carry a continuous prediction for regression
  or a class label for classification. *(p.229)*
- For duration, the target variable is the segment duration and the tree is a regression
  tree. *(p.232)*
- Compute the segment-context features over a sliding 7-segment window centred on the
  segment being predicted. *(p.231)*
- Expand each of the 7 segment slots into the 4 phonetic features rather than a single
  48-valued categorical; use n/a for inapplicable features. *(p.232)*
- Stress and phrase-position features can be taken from the front end's own predictions
  rather than from hand annotation, which is what Riley did. This means the duration
  model is trained on the same (possibly wrong) symbolic input it will see at run time.
  *(p.231)*
- Word probabilities for end-of-sentence detection may be estimated from paragraph
  boundaries in a corpus where sentence boundaries are unmarked. *(p.230)*
- Tree growing is O(N log N) in observations, so scaling the corpus is cheap. *(p.231)*
- Tree building and evaluation are rapid once data are collected and candidate features
  specified, so the technique "can readily be applied to other feature sets, to other
  languages, to other speakers and speaking rates." *(p.232)*

## Figures of Interest

None. The paper contains no figures and no tables. The log-log residual-versus-data-size
relationship is asserted in prose only. *(p.232)*

## Results Summary

The duration regression tree cut the residual standard deviation from over 35 ms
(hand-written rules) to 23 ms on the same 1500-utterance single-speaker data. *(p.231)*
Perceptually the improvement did not track the numbers: synthesis with tree-derived
durations "compares favorably with the heuristically-derived durations, but is not
strikingly better." *(p.231)*

Riley's own diagnosis of that gap is the most useful part of the paper for an
implementer: the tree "predicts most segment durations more accurately than the
hand-derived rules" but "also has more variability in its predictions than the 'flatter',
simpler current rule set. The result is occasional predictions that are poor mixed with
many good predictions." The poor predictions occur either where there is insufficient
training data for that context, or where the feature set lacks predictive power for that
context. *(p.231)*

The end-of-sentence classifier reached 99.8% on the Brown corpus against a ~90%
always-end-stop baseline, with residual errors on genuinely hard cases such as a sentence
ending in "Mrs." or beginning with a numeral. *(p.230)*

## Limitations

- **Corpus too small.** "The current database of 1500 (short) sentences is probably much
  too small to be able to generalize to other contexts well." *(p.231)*
- **Sentences are short.** The parenthetical "(short)" is the only characterization of
  utterance length given; no duration or word-count statistics for the corpus appear. *(p.231)*
- **Variance, not just bias, matters perceptually.** The tree's higher prediction
  variance offsets its lower mean error; occasional bad predictions are audible in a way
  the flatter rule set's uniform mediocrity is not. *(p.231)*
- **Sparse-context failure.** Poor predictions arise where training data for a context is
  insufficient. *(p.231)*
- **Feature-set failure.** Poor predictions also arise where the chosen features simply
  lack predictive power for that context. *(p.231)*
- **Single speaker, single language, single speaking rate.** Generalization to other
  speakers, rates, and languages is stated as future applicability, not demonstrated. *(p.232)*
- **Asymptote unknown.** "Of course, eventually an asymptote will be reached, but it is
  not clear when." *(p.232)*
- **Stress and phrasing are machine-predicted**, so the duration model inherits the front
  end's symbolic errors. *(p.231)*
- **Method underspecified.** No splitting criterion, pruning rule, cross-validation
  scheme, or tree size is reported for either tree.
- **No formal perceptual evaluation.** The synthesis comparison is a single informal
  sentence. *(p.231)*

## Arguments Against Prior Work

- Against hand-written duration rules (Klatt 1976; Syrdal 1989): "Although much effort has
  gone into some sets of these heuristically-derived rules, natural-sounding durations
  still eludes us." The evidence offered is the residual comparison: >35 ms for the
  current rules versus 23 ms for the tree on identical data. *(p.231)*
- Against relying on hand analysis generally: problems depending on many interrelated
  variables "may overwhelm a human observer but [are] still amenable to the right
  statistical approach." *(p.229)*
- Against surface typographic cues for sentence segmentation: the two-spaces-after-a-period
  convention "is often ignored and in some text sources never obeyed (e.g., the AP news)."
  *(p.230)*
- Against the naive always-end-stop heuristic: wrong about 10% of the time on Brown. *(p.230)*
- Against treating a phone as one categorical variable in CART: ~2^48 candidate binary
  partitions per node, "clearly making this approach impractical." *(p.232)*
- Against Chou's k-means partition search as the chosen remedy: Riley acknowledges it
  finds "sub-optimal, but good" partitions in linear time, then adopts the phonetic
  4-feature decomposition instead, on the grounds that it has "acceptable complexity"
  *and* "some phonetic justification." *(p.232)*

## Design Rationale

- **Trees over regression/rules** because the duration problem mixes categorical and
  continuous factors, and CART handles both, selects features itself, gives honest
  performance estimates, and stays human-interpretable. *(p.229, p.231)*
- **Feature-set selection is the researcher's job, not the algorithm's.** "The
  researcher's role is to use his insight and analysis of the problem to select an
  appropriate feature set. The classification algorithm's role is to try to provide a
  weighting of these various features that gives the minimum error." *(p.230)*
- **Features chosen for computability as well as importance:** "chosen both from what
  seemed to be important factors and from what could be readily computed." *(p.231)*
- **Phonetic feature decomposition over k-means clustering** for the phone-identity
  variable, trading optimality for tractability plus phonetic interpretability. *(p.232)*
- **n/a as a first-class feature value** so that the same four-slot encoding covers both
  consonants and vowels without separate models. *(p.232)*
- **Paragraph boundaries as a proxy for sentence boundaries** when estimating word
  probabilities from an unlabelled but much larger corpus. *(p.230)*
- **A wide segment window (7) is deliberate and extensible**: with enough data, a large
  window lets the model "begin to incorporate facts about particular words (in context)"
  — i.e. the tree drifts from a phonetic model toward a lexical one as data grows. *(p.232)*

## Testable Properties

- A CART regression tree over this feature set achieves residual SD ≈ 23 ms on
  1500 single-speaker utterances. *(p.231)*
- Hand-derived duration rules on the same data give residual SD > 35 ms, so the tree
  must beat the rule baseline on squared error. *(p.231)*
- Tree-predicted durations have **higher variance** than rule-predicted durations, even
  while having lower mean error. Any reimplementation should reproduce both halves of
  this, not just the error reduction. *(p.231)*
- Prediction error degrades in contexts with sparse training coverage; error should be
  measurable as a function of leaf sample count. *(p.231)*
- Duration residual versus number of observations is approximately linear on a log-log
  plot, i.e. residual falls as a power law in corpus size, with no visible asymptote at
  1500 utterances. *(p.232)*
- Tree-growing time scales as N log N in the number of observations. *(p.231)*
- Encoding a 48-phone inventory as a single categorical feature requires ~2^48 candidate
  partitions per node; the 4-feature decomposition with ~12 values each must reduce this
  to a tractable search. *(p.232)*
- An 8-feature classification tree over lexical/orthographic context achieves 99.8%
  end-of-sentence accuracy on Brown against a ~90% baseline. *(p.230)*
- Stress is a 3-valued feature (0, 1, 2) in this model. *(p.231)*

## Relevance to Project

This is the origin point of the data-driven segmental duration model that later became
standard in Festival and every CART-duration TTS front end. For a formant/source-filter
synthesizer that needs a segmental duration model, it supplies:

1. **A concrete, reproducible feature vector** for duration prediction: 7-segment
   phonetic window, stress 0/1/2, four lexical-position counters, two phrase-position
   counters. This is small enough to compute in a rule-based front end and is exactly the
   feature set Festival's duration trees descend from. *(p.231)*
2. **The phone-encoding trick.** Decomposing each phone into consonant manner, consonant
   place, vowel manner, vowel place with n/a fill is directly reusable and is the piece
   most often omitted from later summaries. It keeps categorical splits tractable and
   yields interpretable trees. *(p.232)*
3. **A calibrated accuracy target.** 23 ms residual SD for a tree, >35 ms for Klatt-style
   hand rules, on a single-speaker corpus. A duration model in this project can be
   benchmarked against these numbers directly.
4. **The key warning for a rule-based synthesizer.** Riley found that beating hand rules
   on RMS error did *not* produce strikingly better-sounding speech, because the
   statistical model's occasional bad predictions are more damaging than the rule set's
   uniform flatness. If the project keeps Klatt-style duration rules, this is the
   strongest available argument that the rules are not the main perceptual bottleneck at
   this corpus scale.
5. **A scaling law.** Residual falls as a power law in corpus size, so a tree trained on a
   small in-house corpus should be expected to underperform, predictably.

Riley 1992 (Talking Machines chapter) is the more commonly cited version of this work and
was not retrievable for this collection. This 1990 workshop paper is its precursor and
covers the same method; readers wanting tree diagrams, larger corpora, or formal listening
tests will not find them here.

## Open Questions

- [ ] What splitting criterion and pruning rule were used? The paper defers entirely to
      Breiman et al. 1984 and never states them.
- [ ] How large was the duration tree (nodes, depth, leaves)? Not reported.
- [ ] Were durations predicted in raw milliseconds, log-duration, or z-scored per phone?
      The paper says only "the prediction is the segmental duration". *(p.232)*
- [ ] How was the 23 ms residual estimated — resubstitution, held-out, or cross-validation?
      "Honest estimates" are claimed as a CART property *(p.229)* but the evaluation
      protocol is not described.
- [ ] What is the slope of the log-log residual-versus-data-size line? Never given.
- [ ] Are the 48 phones a specific published inventory (e.g. the TIMIT-derived Bell Labs
      set)? TIMIT is mentioned in the introduction *(p.229)* but not identified as the
      duration corpus.
- [ ] How were the phrase boundaries defined that the two phrase-position counters index?
- [ ] Does the Riley 1992 chapter report the tree structure and a formal listening test?
      Unresolvable from this source.

## Related Work Worth Reading

- **Breiman, L., et al. 1984. Classification and Regression Trees.** The method reference;
  Riley cites p. 29 specifically for the categorical-partition blowup. Essential if
  implementing the tree induction rather than using a library.
- **Klatt, D. 1976. Linguistic uses of segmental duration in English.** JASA 59:1208-1221.
  The hand-rule baseline this paper measures itself against, and the canonical duration
  rule set for a Klatt-style synthesizer.
- **Van Santen, J. and Olive, J. 1990. The analysis of contextual effect on segmental
  duration.** Computer Speech and Language 4. The competing systematic (sums-of-products)
  approach to the same problem from the same lab.
- **Chou, P. 1988 (cited in text as 1987). Applications of information theory to pattern
  recognition and the design of decision trees and trellises.** Stanford PhD thesis. The
  k-means solution to high-cardinality categorical splits that Riley considered and did
  not adopt.
- **Syrdal, A. 1989. Improved duration rules for text-to-speech synthesis.** JASA 85:S43.
  The state of the art in hand-derived rules at the time.
- **Riley, M. 1989. Statistical tree-based modeling of phonetic segment durations.** JASA
  85:S44. Riley's own earlier abstract on this work.

## Quotes Worth Preserving

- "Inappropriate duration modelling contributes much to the unnatural quality of synthetic
  speech." *(p.231)*
- "Although much effort has gone into some sets of these heuristically-derived rules,
  natural-sounding durations still eludes us." *(p.231)*
- "Taking this approach, the most important decision is in selecting the feature set."
  *(p.231)*
- "The quality of the synthesis using tree-derived durations compares favorably with the
  heuristically-derived durations, but is not strikingly better. This is probably because
  although the tree approach predicts most segment durations more accurately than the
  hand-derived rules, it also has more variability in its predictions than the 'flatter',
  simpler current rule set." *(p.231)*
- "The researcher's role is to use his insight and analysis of the problem to select an
  appropriate feature set. The classification algorithm's role is to try to provide a
  weighting of these various features that gives the minimum error." *(p.230)*
- "In this way, every segment is decomposed into four multi-valued features that have
  acceptable complexity to the classification scheme and that have some phonetic
  justification." *(p.232)*
- "The more data we collect, the better the performance. Of course, eventually an
  asymptote will be reached, but it is not clear when." *(p.232)*

---

*Provenance: read from `pngs/page-000.png` through `pngs/page-003.png` (4 pages, printed
pages 229-232) rendered at 200 dpi from `paper.pdf`. The PDF is a scanned ISCA Archive
copy with an unusable text layer; all extraction is from the page images.*

---

## Collection Cross-References

### Already in Collection
- [Linguistic Uses of Segmental Duration in English: Acoustic and Perceptual Evidence](../Klatt_1976_SegmentalDuration/notes.md) - the hand-derived duration rule set Riley measures the tree model against (>35 ms residual SD vs. 23 ms for the tree).

### New Leads (Not Yet in Collection)
- Breiman, L., Friedman, J.H., Olshen, R.A., and Stone, C.J. 1984. *Classification and Regression Trees.* Wadsworth & Brooks - the complete CART method reference; Riley defers all splitting/pruning theory to this book and cites it for the 2^48 categorical-partition blowup.
- Chou, P. 1988. *Applications of information theory to pattern recognition and the design of decision trees and trellises.* Stanford PhD thesis - the k-means approach to high-cardinality categorical splitting that Riley considered and rejected in favor of the phonetic 4-feature decomposition.
- Syrdal, A. 1989. "Improved duration rules for text-to-speech synthesis." JASA 85:S43 - the best hand-derived duration rules of the period, cited alongside Klatt 1976 as the heuristic tradition the tree model outperforms.
- Van Santen, J. and Olive, J. 1990. "The analysis of contextual effect on segmental duration." Computer Speech and Language 4 - the contemporaneous sums-of-products alternative to trees for duration prediction, from the same lab. Not itself in the collection, but its direct successors are - see Conceptual Links below.
- Riley, M. 1989. "Statistical tree-based modeling of phonetic segment durations." JASA 85:S44 - Riley's own earlier abstract on this work; likely low yield.

### Conceptual Links (not citation-based)
- [Quantitative Modeling of Segmental Duration](../vanSanten_1993_SegmentalDuration/notes.md) - the competing sums-of-products framework for the same duration-prediction problem: instead of a CART tree that automatically selects context features, van Santen hand-designs multiplicative factor models with explicit interaction terms. Both papers attack context-dependent segmental duration and both report residual/correlation improvements over Klatt-style hand rules. (Strong)
- [Assignment of Segmental Duration in Text-to-Speech Synthesis](../vanSanten_1994_SegmentalDurationTTS/notes.md) - the mature journal-length version of the sums-of-products approach; its own notes explicitly compare against "Riley (1992) - Tree-based modeling for speech synthesis (CART approach compared against)". Direct rival-method relationship on the same task. (Strong)
- [Consonant Duration in American English](../Umeda_1977_ConsonantDurationAmericanEnglish/notes.md) - Umeda's empirical argument that a fixed-constant duration model cannot work because different consonants need different, context-specific adjustment constants is exactly the phenomenon Riley's tree discovers automatically via context splits rather than by hand. (Moderate)
- [Segment Durations in a Syllable Frame](../Campbell_Isard_1991_SegmentDurationsSyllable/notes.md) - a contemporaneous data-driven duration model (neural network + z-score elasticity at the syllable level) attacking the same problem — natural-sounding duration prediction — with a different statistical architecture and a different level of description (syllable-frame elasticity vs. segment-level CART). (Moderate)
- [Bartkova & Sorin (1987) - A Model of Segmental Duration for Speech Synthesis in French](../Bartkova_1987_ModelSegmentalDurationFrench/notes.md) - a multiplicative, hand-structured duration model for French; same problem (context-dependent segmental duration) and same speaker-independent/speaker-dependent factoring intuition, but built by hand rather than learned, and for a different language. (Moderate)

### Cited By (in Collection)
- [Models of Speech Synthesis](../Carlson_1995_ModelsOfSpeechSynthesis/notes.md) - lists this paper in its reference list (ref. 62) among contemporaneous ESCA 1990 workshop duration/synthesis papers.
- [Quantitative Modeling of Segmental Duration](../vanSanten_1993_SegmentalDuration/notes.md) - cites the Riley 1992 chapter (the fuller version of this workshop paper) in its reference list.
- [Assignment of Segmental Duration in Text-to-Speech Synthesis](../vanSanten_1994_SegmentalDurationTTS/notes.md) - cites and directly compares its sums-of-products model against this paper's CART approach, per its own Related Work notes ("Riley (1992) - Tree-based modeling for speech synthesis (CART approach compared against)").
