---
title: "Joint-Sequence Models for Grapheme-to-Phoneme Conversion"
authors: "Maximilian Bisani, Hermann Ney"
year: 2008
venue: "Speech Communication, vol. 50, no. 5, pp. 434-451"
doi_url: "10.1016/j.specom.2008.01.002"
pages: "434-451"
affiliation: "Lehrstuhl für Informatik VI, RWTH Aachen University, Ahornstraße 55, D-52056 Aachen, Germany"
note: "HAL preprint hal-00499203, accepted manuscript version. Software (Sequitur G2P) released open source."
---

# Joint-Sequence Models for Grapheme-to-Phoneme Conversion

> **Page numbering.** Citations `*(p.N)*` refer to the **printed page numbers** stamped
> at the foot of each page of the accepted manuscript (printed p.1 = PDF page image
> `page-002.png`; PDF index = printed page + 1).

## One-Sentence Summary
A complete, self-contained specification of the joint-sequence (graphone / joint
multigram) model for grapheme-to-phoneme conversion — the M-gram model over joint
letter/phoneme units, its EM training with a novel discounted-EM estimation
algorithm that integrates Kneser-Ney-style smoothing directly into the EM loop, the
A*/Dijkstra decoding search, n-best generation with posterior confidence measures,
and an exhaustive experimental study of every model-size and approximation knob,
released as the open-source Sequitur G2P tool. *(p.1)*

## Problem Addressed
Text-to-speech and speech recognition front-ends need pronunciations for arbitrary
words. Dictionary look-up has finite coverage and large storage cost; hand-written
rule systems are laborious, require linguistic expertise, and still fail on
exceptional words. Data-driven G2P must decide how "analogy" is implemented
algorithmically, and prior data-driven work either took locally-optimal per-letter
decisions (neural nets, decision trees) or lacked a principled probabilistic
foundation (pronunciation by analogy). *(pp.2-6)*

## Key Contributions
- A coherent G2P approach founded on statistical decision theory (Bayes decision rule
  minimizing word error). *(p.2)*
- Systematic study of parameters and variations not comprehensively addressed before:
  alignment schemata (1-to-n, m-to-n, 0/1-to-0/1), model smoothing, maximum
  approximation in training and in application. *(p.2)*
- A novel model estimation technique: **discounted EM** with bottom-up model
  construction, integrating absolute discounting / marginal-preserving (Kneser-Ney)
  smoothing into the EM re-estimation loop rather than applying smoothing as a
  separate post-step. *(p.2, pp.12-14)*
- Demonstrates accuracy better than or on par with all previously published results on
  several standard test sets. *(p.2)*
- Free, open-source implementation. *(p.16)*

---

## 2. Review of prior G2P techniques (taxonomy)

### 2.0 Framing *(pp.2-4)*
- **Dictionary look-up.** Effective but: hand-building >100,000 entries is costly;
  storage problematic on embedded/mobile devices; finite coverage while TTS must
  handle arbitrary words. *(p.3)*
- **Rule-based conversion.** Formulated in the framework of finite-state automata
  (Kaplan and Kay, 1994); often paired with an exception dictionary. Two drawbacks:
  rule design is hard and needs specific linguistic skills; irregularities need
  exception rules/lists, and rule interdependence forces designers to cross-check all
  cases. Still mistakes on exceptional words not anticipated. *(p.3)*
- **Data-driven.** Trades rule design for the simpler task of providing example
  pronunciations; native speakers can judge/write single pronunciations more easily
  than general spelling rules. *(p.3)*
- **Two partly competing goals in data-driven G2P**: *lexicon compression* (minimize
  error on **seen** data with a compact model) vs *generalization* (minimize error on
  **unseen** data). *(p.3)*
- Training pronunciations should **exemplify the rules** of the language — the opposite
  of a rule-system exception list. Training only on exceptional words would defy any
  analogy-based approach. In practice frequency-ordered dictionaries work because
  exemplary patterns prevail. The data-driven approach *mitigates the rule/exception
  distinction*. Training data should be representative of the application domain.
  *(pp.3-4)*

### 2.1 Techniques based on local classification *(pp.4-5)*
- Presuppose (or separately create) an alignment where **each alignment item comprises
  exactly one letter**, and 0, 1, or >1 phonemes. Called **1-to-n alignment**. *(p.4)*
- Worked example *(p.4)*:

  ```
  "mixing"  =  m    i    x     i    n    g
  [mɪksɪŋ]     [m]  [ɪ]  [ks]  [ɪ]  [ŋ]  —
  ```

- Alignments created by hand-crafted rules, by dynamic-programming search with
  predefined constraints/costs, or by iterative estimation of alignment probabilities
  (as in sec. 3.2). In this family the alignment problem is **not part of the
  transcription method**. *(p.4)*
- Input processed sequentially (e.g. left to right); for each input character a
  possibly-empty phoneme sequence is chosen from a small set of **allowables**;
  prediction uses the context of the current letter. Because the decision at each
  position is taken before proceeding, this family is called **local classification**.
  Not optimal decision-theoretically, but avoids a global search. *(p.4)*
- **Neural networks:** Sejnowski and Rosenberg (1987) (NETtalk) and McCulloch et al.
  (1987): three-layer network, input a context window of ±3 letters, orthogonal
  (one-hot) input representation per letter type, output layer represents the predicted
  phoneme by **articulatory features**. Jensen and Riis (2000) and Häkkinen et al.
  (2003) improve with more sophisticated letter codebook representations in the input
  layer. *(p.4)*
- **Decision trees:**
  - Torkkola (1993): *dynamically expanding context*, decision tree over an
    **asymmetrical** window around the current letter. *(p.5)*
  - Daelemans and van den Bosch (1996): IG-Tree, information-gain criterion, questions
    only about surrounding letters, information gain computed **once** per attribute.
    *(p.5)*
  - Andersen et al. (1996): binary decision trees with the **Gini** criterion;
    questions about letters **five positions** left and right; plus membership tests in
    **10 graphemic classes**. *(p.5)*
  - Pagel et al. (1998): information gain **recomputed at each node split**; three
    preceding and three following letters, plus **three following phonemes**, which
    requires processing the word **right to left**; POS questions also help. *(p.5)*
  - Suontausta and Häkkinen (2000); Häkkinen et al. (2003): information-gain trees;
    questions include up to **four** preceding and four following letters, preceding
    phonemes and their phonemic classes. *(p.5)*

### 2.2 Pronunciation by analogy (PbA) *(pp.5-6)*
- Nearest-neighbor-like: scan the training lexicon for words or word parts similar to
  the target, output a pronunciation analogous to the retrieved examples. Goes beyond
  local classification by considering the whole word, but is **generally not founded on
  a probabilistic model**. *(p.5)*
- Dedina and Nusbaum (1991): builds a **pronunciation lattice** from phonetic
  representations of lexicon words matching the input string; nodes are candidate
  phonemes, paths are possible pronunciations. *(p.5)*
- Marchand and Damper (2000): extend it by **combining different path scoring
  strategies**. *(p.5)*
- Yvon (1996): lattice of all potential pronunciations by extracting **overlapping
  chunks** from training-lexicon words; best path by **maximum chunk overlap and chunk
  frequency**. *(p.5)*
- Bagshaw (1998): hand-specified grapheme-phoneme correspondences (GPC), induces
  context-dependent rules over these units with a **context size of two GPC positions
  in both directions**; final transcription by global search over the lattice of
  competing segmentations with scores from rule weights and rule-violation penalties.
  *(p.6)*
- Bellegarda (2005): **latent semantic analysis** defines a global word-similarity
  measure; compile similar lexicon entries, align all sequences in the list, pick the
  most frequent phoneme at each aligned position. *(p.6)*

### 2.3 Probabilistic approaches *(p.6)*
- Lucassen and Mercer (1984): 1-to-n alignments via a context-independent channel
  model; next-phoneme prediction from a symmetric letter window and a left-sided
  phoneme window; binary feature functions induced by a **mutual information**
  criterion; regression tree whose leaves carry phoneme distributions. *(p.6)*
- Jiang et al. (1997): improved regression tree — refined entropy weighting, smoothing
  of leaf distributions, **bagging**, and rescoring with a **phoneme trigram**. *(p.6)*
- Chen (2003) (one of two models): similar feature functions but a **conditional
  maximum entropy** model for predicting phonemes. *(p.6)*
- Meng et al. (1994): word pronunciations modeled by **morphological parse trees**,
  layered bigram as the statistical parsing approach. *(p.6)*
- Besling (1994): 1-to-n alignments by dynamic programming with a predefined uniform
  distribution; Bayes decomposition into a **phonotactic model (7-gram on phonemes)**
  and a **matching model** = conditional probability of the current letter given the
  current phoneme and the previous letter and phoneme. *(p.6)*

---

## 3. Joint-sequence models — theory

### 3.1 Statistical problem formulation *(p.7)*
- `G` = set of graphemes (letters/characters). `Φ` = set of phonemes. `V*` = Kleene star
  (all strings over symbols in V).
- Bayes decision rule:

$$
\varphi(\boldsymbol{g}) = \operatorname*{argmax}_{\varphi' \in \Phi^*} p(\boldsymbol{g}, \varphi')
$$

Where: $\boldsymbol{g}\in G^*$ is the given orthographic form; $\varphi\in\Phi^*$ is the
sought pronunciation; $p(\boldsymbol{g},\varphi)$ is the joint probability of spelling
and pronunciation. This decision strategy is **optimal with respect to word error**,
i.e. it minimizes the risk of not getting the correct pronunciation. *(p.7, eq. 1)*

### 3.2 Co-segmentations and graphones *(pp.7-8)*
- **Fundamental idea:** input and output sequences are generated from a common sequence
  of **joint units** carrying both input and output symbols. If each unit carries zero
  or one input and zero or one output symbol, this is the conventional **finite state
  transducer** definition. When units may carry multiple input and output symbols the
  terms **co-sequence** and **joint multigram** (Deligne et al., 1995) are used. *(p.7)*
- **Graphone** = a grapheme-phoneme joint multigram, a pair
  $q = (\boldsymbol{g}, \varphi) \in Q \subseteq G^* \times \Phi^*$ of a letter sequence
  and a phoneme sequence of possibly different length. $\boldsymbol{g}_q$ and
  $\varphi_q$ denote its first and second components. *(p.7)*
- A graphone is **singular** if it has **at most one letter and at most one phoneme**.
  *(p.7)*
- Synonyms in the literature: **grapheme-to-phoneme correspondences (GPC)** (Galescu
  and Allen, 2001) and **graphonemes** (Vozila et al., 2003). *(p.7)*
- The inventory `Q` can be inferred automatically from training data (sec. 4) or
  specified by hand. *(p.7)*
- Worked example, **m-to-n** co-segmentation into four graphones *(p.8)*:

  ```
  "mixing"  =  m    i    x     ing
  [mɪksɪŋ]     [m]  [ɪ]  [ks]  [ŋ]
  ```

- Equivalent **01-to-01 (FST-type)** segmentation into seven singular graphones
  *(p.8)*:

  ```
  "mixing"  =  m    i    x    —    i    n   g
  [mɪksɪŋ]     [m]  [ɪ]  [k]  [s]  [ɪ]  —   [ŋ]
  ```

- Terminology: grouping letters and phonemes into an **equal number of segments** is a
  **joint segmentation** or **co-segmentation**; "alignment" is used interchangeably.
  Compared to 1-to-n methods, m-to-n alignments have the **additional freedom of how
  input letters are grouped**. *(p.8)*
- Because the segmentation is ambiguous, the joint probability sums over all matching
  graphone sequences:

$$
p(\boldsymbol{g}, \varphi) = \sum_{\boldsymbol{q} \in S(\boldsymbol{g},\varphi)} p(\boldsymbol{q})
$$

Where: $\boldsymbol{q}\in Q^*$ is a graphone sequence and
$S(\boldsymbol{g},\varphi)$ is the set of all co-segmentations of $\boldsymbol{g}$ and
$\varphi$. *(p.8, eq. 2)*

$$
S(\boldsymbol{g}, \varphi) := \left\{ \boldsymbol{q}\in Q^* \;\middle|\; \boldsymbol{g}_{q_1}\!\frown\cdots\frown\!\boldsymbol{g}_{q_K} = \boldsymbol{g},\;\; \varphi_{q_1}\!\frown\cdots\frown\!\varphi_{q_K} = \varphi \right\}
$$

Where: $\frown$ denotes sequence concatenation and $K = |\boldsymbol{q}|$ is the length
of the graphone sequence. *(p.8, eq. 3)*

- The distribution over graphone sequences uses a standard **M-gram approximation**:

$$
p(q_1^K) \cong \prod_{j=1}^{K+1} p(q_j \mid q_{j-1},\ldots,q_{j-M+1})
$$

Where: positions $i<1$ and $i>K$ hold a special **boundary symbol** $q_i=\perp$, which
allows modeling of characteristic phenomena at word starts and ends. The product runs
to $K+1$ so the end-of-sequence token is predicted. *(p.8, eq. 4)*

### 3.3 Related work on joint-sequence models *(p.9)*
- Deligne et al. (1995): introduced the maximum-likelihood EM procedure for inferring
  many-to-many alignments; studied a **joint unigram** model on multigrams and a Bayes
  decomposition into a **phonotactic bigram** plus a context-independent matching model.
  *(p.9)*
- Bisani and Ney (2002): multigram approach combined with a **joint trigram**. *(p.9)*
- Galescu and Allen (2002) and Vozila et al. (2003): very similar, **joint 4-gram** and
  a different alignment method. *(p.9)*
- Singular-graphone-only ("non-chunk") variants: Caseiro et al. (2002) use FST-type
  alignments derived by a **minimum edit cost** criterion with manually specified costs,
  build a **joint 8-gram** and convert it to an FST. Chen (2003) reports very good
  results with a structurally similar model: **maximum entropy 8-gram with Gaussian
  priors**, alignments obtained by EM training of the model. *(p.9)*

---

## 4. Model estimation

### 4.1 Multigram inference through expectation maximization *(pp.9-10)*
Given `N` training words paired with pronunciations
$\mathcal{O}_1,\ldots,\mathcal{O}_N = (\boldsymbol{g}_1,\varphi_1),\ldots,(\boldsymbol{g}_N,\varphi_N)$
**without** letter/phoneme alignment.

A co-segmentation $\mathcal{S}$ uniquely defines a joint sequence:

$$
p(\boldsymbol{g}, \varphi, \mathcal{S}) = p(\boldsymbol{q})
$$
*(p.9, eq. 5)*

Log-likelihood of the training data, summing over all segmentations:

$$
\log \mathcal{L}(\mathcal{O}_1,\ldots,\mathcal{O}_N) = \sum_{i=1}^{N} \log \mathcal{L}(\mathcal{O}_i) = \sum_{i=1}^{N} \log\left( \sum_{\mathcal{S}\in S(\mathcal{O}_i)} p(\mathcal{O}_i, \mathcal{S}) \right)
$$
*(p.9, eq. 6)*

The segmentation $\mathcal{S}$ is a **hidden variable**; ML training uses EM (first
demonstrated by Deligne and Bimbot, 1995). *(pp.9-10)*

**Unigram case (M = 1)** re-estimation equations *(p.10, eqs. 7-9)*:

$$
p(\boldsymbol{q};\vartheta) = \prod_{j=1}^{|\boldsymbol{q}|} p(q_j;\vartheta)
$$

$$
e(q;\vartheta) := \sum_{i=1}^{N} \sum_{\boldsymbol{q}\in S(\boldsymbol{g}_i,\varphi_i)} p(\boldsymbol{q}\mid \boldsymbol{g}_i,\varphi_i;\vartheta)\, n_q(\boldsymbol{q}) = \sum_{i=1}^{N} \sum_{\boldsymbol{q}\in S(\boldsymbol{g}_i,\varphi_i)} \frac{p(\boldsymbol{q};\vartheta)}{\sum_{\boldsymbol{q}'\in S(\boldsymbol{g}_i,\varphi_i)} p(\boldsymbol{q}';\vartheta)}\, n_q(\boldsymbol{q})
$$

$$
p(q;\vartheta') = \frac{e(q;\vartheta)}{\sum_{q'} e(q';\vartheta)}
$$

Where: $n_q(\boldsymbol{q})$ is the number of occurrences of graphone `q` in the
sequence $\boldsymbol{q}$; $e(q;\vartheta)$ is the **evidence** for `q`, i.e. the
expected number of occurrences of graphone `q` in the training sample under the current
parameters $\vartheta$. Evidence is computed efficiently by a **forward-backward
procedure** (Deligne and Bimbot, 1997), see sec. 6.1. *(p.10)*

**Higher-order case (M > 1)** *(p.10, eqs. 10-12)*. $h_j = (q_{j-M+1},\ldots,q_{j-1})$
is the history; $n_{q,h}(\boldsymbol{q})$ counts occurrences of the M-gram
$q_{j-M+1},\ldots,q_j$ in $\boldsymbol{q}$:

$$
p(\boldsymbol{q};\vartheta) = \prod_{j=1}^{|\boldsymbol{q}|} p(q_j \mid h_j;\vartheta)
$$

$$
e(q,h;\vartheta) := \sum_{i=1}^{N}\sum_{\boldsymbol{q}\in S(\boldsymbol{g}_i,\varphi_i)} \frac{p(\boldsymbol{q};\vartheta)}{\sum_{\boldsymbol{q}'\in S(\boldsymbol{g}_i,\varphi_i)} p(\boldsymbol{q}';\vartheta)}\, n_{q,h}(\boldsymbol{q})
$$

$$
p(q\mid h;\vartheta') = \frac{e(q,h;\vartheta)}{\sum_{q'} e(q',h;\vartheta)}
$$

Sequences $\boldsymbol{q}$ implicitly start and end with the boundary symbol. *(p.10)*

**Initialization.** The EM equations cannot let a new graphone emerge once its
probability is zero, so parameters are initialized with a **uniform distribution over
all graphones satisfying manually set length constraints**. Typically a simple upper
limit `L`: $|\boldsymbol{g}_q| \le L$ and $|\varphi_q| \le L$, excluding the
non-productive case $|\boldsymbol{g}_q| = |\varphi_q| = 0$. More complex constraints are
conceivable (different limits for letter and phoneme lengths, or a lower limit).
*(p.11)*

$$
p_0(q) = \left[ \sum_{l=0}^{L} \sum_{r=0}^{L} |G|^l |\Phi|^r \right]^{-1}
$$

Where: `|G|` is the grapheme inventory size, `|Φ|` the phoneme inventory size, `L` the
graphone length limit. The summand for `r = l = 0` accounts for the additional
end-of-sequence token. *(p.11, eq. 13)*

- `L` has a **significant effect on the size of the graphone inventory**. Together with
  the maximum history length `M`, `L` defines the **effective span** of the model — the
  number of letters or phonemes that affect the estimated probabilities at a given
  position. *(p.11)*
- Two problems with plain ML: (a) ML estimates over-fit and predict unseen data poorly;
  (b) with flat initialization any graphone constructible from the training examples
  receives probability mass, though only a small subset should contribute. Addressed by
  **smoothing** and **trimming** respectively. *(p.11)*

### 4.2 Evidence trimming *(pp.11-12)*
Trim evidence values below a threshold, replacing $e(q,h;\vartheta)$ in (12) with:

$$
\hat{e}(q,h;\vartheta) = \begin{cases} 0 & \text{if } e(q,h;\vartheta) < \tau \\ e(q,h;\vartheta) & \text{otherwise} \end{cases}
$$

Where: $\tau$ is the trimming threshold, adjusted on development data. *(p.11, eq. 14)*

- Causes unlikely graphones to **gradually die out** during iteration. There is always
  implicit trimming caused by limited machine precision. *(p.11)*
- **Evidence trimming is superior to model trimming** (thresholding the probability
  estimates $p(q;\vartheta)$): even graphones with low $p(q;\vartheta)$ can have
  conditional probability $p(q\mid \boldsymbol{g}_i,\varphi_i;\vartheta)$ close to one
  in certain words; removing them would leave the training sample not representable by
  the model. Previous experiments showed evidence trimming effective in controlling
  graphone inventory size (Bisani and Ney, 2002). *(pp.11-12)*

### 4.3 Discounted evidence (integrated Kneser-Ney smoothing) *(pp.12-13)*
Estimation eq. (12) is essentially the n-gram LM problem with **evidence values in
place of counts**. Absolute discounting with interpolation and a marginal-preserving
back-off (Kneser-Ney) surpasses other smoothing methods (Kneser and Ney, 1995; Chen and
Goodman, 1999). **Caveat: evidence values are generally fractional**, so results derived
assuming integer counts must be adopted carefully. *(p.12)*

$$
p_M(q\mid h) = \frac{\max\{ e(q,h) - d_M,\, 0 \}}{\sum_{q'} e(q',h)} + \lambda(h)\, p_{M-1}(q\mid \bar{h})
$$

Where: subscript `M` indicates the order of the distribution; $d_M \ge 0$ is the
discount parameter for order `M`; $p_{M-1}(q\mid\bar h)$ is the generalized lower-order
(M-1)-gram distribution conditioned on the reduced history
$\bar h_i = (q_{i-M+2},\ldots,q_{i-1})$; $\lambda(h)$ is chosen so the overall
distribution sums to one. *(p.12, eq. 15)*

- In classical LM the smallest count is one; **evidence values can be arbitrarily small,
  in fact smaller than the discount**. So discounted-evidence estimation **includes a
  form of evidence trimming**: graphones with evidence below the discount are excluded
  from the model. Difference from explicit trimming (14): in discounting the discounted
  evidence is **distributed over unseen events**, whereas in (14) the remaining evidence
  is effectively distributed over **seen** events. *(p.12)*
- Of the two Kneser-Ney flavors (marginal-preserving vs leaving-one-out), the authors
  follow **marginal preserving**, because leaving-one-out is not obviously applicable to
  fractional counts. *(p.13)*

Consistency constraint for all reduced histories $\bar h$:

$$
\sum_{h\in\bar h} p_M(q\mid h) \sum_{q'} e(q',h) = \sum_{h\in\bar h} e(q,h)
$$
*(p.13, eq. 16)*

Substituting (15) and solving for $p_{M-1}(q\mid\bar h)$ under normalization yields:

$$
p_{M-1}(q\mid\bar h) = \frac{\hat{e}(q,\bar h)}{\sum_{q'} \hat{e}(q',\bar h)}
$$
*(p.13, eq. 17)*

with the **reduced evidence**:

$$
\hat{e}(q,\bar h) := \sum_{h\in\bar h} \min\{ e(q,h),\, d_M \}
$$
*(p.13, eq. 18)*

- $p_{M-1}$ itself needs smoothing. Two reasonable approaches: (a) plug the reduced
  evidence (18) into (15); (b) smooth the constraints (16). **Both lead to equivalent
  results**, differing only in the interpretation of the discount parameters. Absolute
  discounting applies **recursively** to $p_{M-2}, p_{M-3}, \ldots, p_0$. The **zerogram
  $p_0$ is uniform over all potential graphones** per (13). *(p.13)*
- In total `M` discount parameters $d_1,\ldots,d_M$. Because fractional evidence values
  do not lend themselves to counts-of-counts estimation (Ney et al., 1995; Chen and
  Goodman, 1999), the discounts are **optimized on a held-out set using Powell's method**
  (Press et al., 1992). *(p.13)*

### 4.4 Bottom-up model construction and discounted EM *(pp.13-14)*
- Unigram model initialized with the flat distribution (13). **Alternative
  initialization** uses unconstrained occurrence counts $c(q)$ in the training set
  (Deligne et al., 1995), counting how often a graphone potentially occurs in each word
  regardless of overlap with neighbouring graphones:

$$
c(q) := \sum_{i=1}^{N} \sum_{l_1=1}^{|\boldsymbol{g}_i|} \sum_{l_2=l_1}^{|\boldsymbol{g}_i|} \sum_{r_1=1}^{|\boldsymbol{g}_i|} \sum_{r_2=r_1}^{|\boldsymbol{g}_i|} \delta\big( (g_{l_1}\frown\cdots\frown g_{l_2},\; \varphi_{r_1}\frown\cdots\frown\varphi_{r_2}) = q \big)
$$

Where: $\delta(\cdot)$ is the Kronecker indicator; the four nested index sums enumerate
every letter substring and every phoneme substring of training item `i`. These counts
(subject to graphone length constraints) feed the normal smoothing (15) to give the
initial distribution. *(p.14, eq. 19)*

- **Higher-order M-gram models are initialized from the previously generated
  (M-1)-gram model.** This means **only histories corresponding to M-grams that were not
  discounted away in the lower-order model are allowed**. *(p.14)*
- **Data split.** Discount values must be optimized on data **separate** from the data
  used to compute evidence values; not separating them "would lead to a gross
  underestimation of the discount." Training data $\mathcal{O}$ is split into a training
  set $\mathcal{O}_t$ (evidence) and a typically smaller held-out set $\mathcal{O}_h$
  (discount parameters). *(p.14)*
- Normal EM strictly improves training-data likelihood, which leads to over-fitting;
  held-out likelihood starts to decrease. In **discounted EM the discount values are
  updated to ensure the held-out likelihood does not drop.** *(p.14)*

#### Algorithm: Discounted EM (Fig. 1, p.14)

```
for M = 1 to M_max:
    initialize M-gram model with (M-1)-gram model
        p_M(q|h) = p_{M-1}(q|h̄)
    initialize the additional discount parameter
        d_M = d_{M-1}
    repeat until L(O_h) stops increasing:
        compute evidence according to (11)
        if L(O_h) did not increase:
            adjust discount parameters d_1,...,d_{M-1} by direction set method
                d = argmax_{d'} L(O_h; d')
        update model according to (15) and (18)
```
*(p.14, Fig. 1)*

### 4.5 Maximum approximation (Viterbi training) *(p.15)*
Earlier joint-multigram studies (Deligne et al., 1995) used the maximum approximation to
(9) during training:

$$
e(q;\vartheta) \cong \sum_{i=1}^{N} n_q(\hat{\boldsymbol{q}}_i)
$$

$$
\hat{\boldsymbol{q}}_i := \operatorname*{argmax}_{\boldsymbol{q}\in Q^*} p(\boldsymbol{q}\mid \boldsymbol{g}_i,\varphi_i;\vartheta) = \operatorname*{argmax}_{\boldsymbol{q}\in S(\boldsymbol{g}_i,\varphi_i)} p(\boldsymbol{q};\vartheta)
$$

Where: $\hat{\boldsymbol{q}}_i$ is the single most likely segmentation of training item
`i`. The algorithm searches the most likely segmentation each iteration and derives the
updated model from graphone counts in that segmentation. Smoothing and bottom-up
construction apply unchanged. Validity studied in sec. 7.7. *(p.15, eqs. 20-21)*

---

## 5. Transcription (decoding) *(p.15)*

The sum in (2) is usually approximated by the maximum:

$$
p(\boldsymbol{g}, \varphi) \approx \max_{\boldsymbol{q}\in S(\boldsymbol{g},\varphi)} p(\boldsymbol{q})
$$
*(p.15, eq. 22)*

i.e. find the most likely graphone sequence matching the given spelling and **project it
onto the phonemes**:

$$
\varphi(\boldsymbol{g}) = \varphi\Big( \operatorname*{argmax}_{\boldsymbol{q}\in Q^*\,|\,\boldsymbol{g}(\boldsymbol{q})=\boldsymbol{g}} p(\boldsymbol{q}) \Big)
$$
*(p.15, eq. 23)*

Accuracy loss from this approximation studied in sec. 7.8. *(p.15)*

- **FST equivalence:** because of the finite history length the joint sequence model is a
  **weighted regular relation** and can be represented by a finite state transducer.
  Obvious for `L = 1` (singular graphones only): each graphone is an FST transition,
  each history is an FST state. Models with `L > 1` can also be represented as an FST by
  **introducing auxiliary states**. *(p.15)*

---

## 6. Implementation aspects *(pp.16-18)*

Open-source implementation: `http://www-i6.informatik.rwth-aachen.de/web/Software/g2p.html`
(the Sequitur G2P tool). *(p.16)*

### 6.1 Training *(pp.16-17)*
- A **hash map** maps joint multigrams to integer indices. With long multigrams allowed
  this map can consume a lot of memory because it encompasses **all possible**
  multigrams, not only those with evidence above the discount threshold. *(p.16)*
- **M-gram models are stored in an inverse prefix tree**: each node is an M-gram history,
  the root is the unigram, leaves are the most specific histories. The tree is **embedded
  in an array in breadth-first order**, so a **single integer index** refers to a
  particular M-gram history. *(p.16)*
- **Evidence values (11) are computed in three steps** *(p.16)*:
  1. Construct **segmentation graphs**.
  2. Compute **edge posterior probabilities** by the **forward-backward algorithm**.
  3. **Accumulate evidence values in a hash map**.
- Segmentation graph: the set of potential co-segmentations is **explicitly** represented
  as a **directed acyclic graph**. Each edge corresponds to a graphone `q`. Each vertex
  `v` corresponds to a position in the source sequence `l`, a position in the target
  sequence `r`, and an M-gram history `h`: `v = (l, r, h)`. In the unigram case (M = 1)
  there is no dependency on `h` and the graph is a **rectangular grid**. When the M-gram
  range exceeds the sequence length the graph **degenerates to a tree**. *(p.16)*
- Explicit graph representation is chosen deliberately: an implicit representation
  (embedding graph topology in the algorithms) "would greatly increase code complexity,
  especially for long-range M-gram models." *(p.16)*
- **Graph construction is a depth-first search** exploring the space of segmentations
  from the beginning of both sequences. Under the DFS scheme it was possible to integrate
  **topological sorting of the vertices** into construction, as well as **removal of dead
  ends**. The topologically ordered vertex list is needed for the forward/backward
  computation. *(p.16)*
- Evidence graphs are **deleted immediately after accumulation** and re-generated next
  iteration; keeping all graphs in memory is infeasible for larger data sets. The same
  graph construction computes the held-out likelihood; because the held-out set is small
  these graphs are **not deleted**, for efficiency during discount adjustment. *(pp.16-17)*
- **Sense of proportion:** training the 9-gram model on Pronlex (one of the larger data
  sets) took about **3 days on a 1.8 GHz CPU** and required **up to 1 GB of RAM**. *(p.17)*

### 6.2 First-best search *(p.17)*
- (23) is a graph search problem solvable by dynamic programming; the open choice is the
  search strategy. Input-synchronous search has a problem: with graphones having an
  **empty grapheme side (input epsilon)**, in principle an **infinite number** of
  graphones can be concatenated before advancing the input position. *(p.17)*
- Beam search handles very large search spaces by heuristic pruning of partial
  hypotheses, at the **risk of search errors** when the beam is too tight; beam width is a
  tunable run-time/accuracy trade-off. Chen (2003) uses beam search; Galescu and Allen
  (2002) **do not allow null grapheme units** and use simple DP search. *(p.17)*
- **Chosen: best-first search** — expand the partial hypothesis with the highest
  probability first; alternative paths to the same node are **recombined** (when a node is
  reached a second time only the best-scoring alternative is pursued). Equivalent to
  **Dijkstra's algorithm, or A\* with zero rest cost**. **Exact (no search errors)** and
  highly efficient; computational effort on a typical PC was so small that further search
  optimization was not considered worthwhile. *(p.17)*

### 6.3 N-best search and posterior probabilities *(pp.17-18)*
- Second decoding algorithm, more expensive but richer: first-best search is run but
  alternative paths to already-seen nodes are **stored in a graph** rather than relaxed
  away. The graph encodes **all possible translations** of the source sequence; each path
  uniquely corresponds to a co-segmentation and a possible translation. *(p.17)*
- Running the **forward algorithm with summation** on the graph yields the source
  probability efficiently:

$$
p(\boldsymbol{g}) = \sum_{\varphi\in\Phi^*} p(\boldsymbol{g},\varphi) = \sum_{\boldsymbol{q}\in Q^*\,|\,\boldsymbol{g}(\boldsymbol{q})=\boldsymbol{g}} p(\boldsymbol{q})
$$
*(p.18, eq. 24)*

- Posterior probability of a translation (the **confidence measure**):

$$
p(\varphi\mid\boldsymbol{g}) = \frac{\sum_{\boldsymbol{q}\in S(\boldsymbol{g},\varphi)} p(\boldsymbol{q})}{p(\boldsymbol{g})}
$$
*(p.18, eq. 25)*

- After graph construction, **another A\* search runs on the graph in reverse direction
  starting from the final node** to generate n-best translations. The **forward
  probabilities without summation are used as a perfect rest cost**, so paths are
  retrieved in exact order from highest to lowest probability. *(p.18)*
- In practice the numerator summation of (25) is unnecessary — often no alternative
  segmentation for the best translation occurs among top-scoring candidates (cf. 7.8) —
  so most experiments use:

$$
p(\varphi\mid\boldsymbol{g}) \approx \frac{\max_{\boldsymbol{q}\in S(\boldsymbol{g},\varphi)} p(\boldsymbol{q})}{p(\boldsymbol{g})}
$$
*(p.18, eq. 26)*

---

## 7. Experiments

### 7.1 Performance metrics *(pp.18-19)*
- **Phoneme error rate (PER)** = edit (Levenshtein) distance between the automatic
  transcription (candidate) and the reference pronunciation, divided by the number of
  phonemes in the reference. Edit distance = minimum number of insert, delete and
  substitute operations (Levenshtein, 1965). If the reference lexicon has **multiple
  pronunciation variants**, the variant with the **smallest edit distance to the
  candidate** is used. *(p.18)*
- **Word error rate (WER)** — continued on p.19.
- **Word error rate (WER)** = the relative proportion of words that have **at least one
  phoneme error**. Less forgiving of near misses than PER. *(p.19)*
- Note on comparability: word error rate = 1 − word accuracy, but **phoneme accuracy
  cannot be reliably converted to PER** because it is often unclear whether accuracy is
  normalized on the number of (correct) phonemes or on the number of letters, or how
  multiple output phonemes for one letter ("pseudo phoneme") are counted. The authors
  therefore **refrain from converting phoneme accuracies from other publications**.
  *(p.19)*

### 7.2 Data sets *(pp.19-20)*
- All databases partitioned **randomly** into disjoint training and testing sets;
  conditions replicated from previous studies so figures compare directly. Stanley F.
  Chen shared the pre-processing and partitioning used in Chen (2003). *(p.19, fn.2)*
- Two data sets came from the **Pascal Letter-to-Phoneme Conversion Challenge** (van den
  Bosch et al., 2006). *(p.19)*
- **NETtalk** (Sejnowski and Rosenberg, 1993): three replications, labelled by the
  approximate training-set size. The **19k variant excludes homographs and one-letter
  words**. *(p.19)*
- Other US English: **CMUdict** (Weide, 1998) release 0.6; **Pronlex** (Kingsbury et al.,
  1997). *(p.19)*
- British English: **Beep** (Robinson, 1997) as used in the Pascal Challenge; **OALD**
  (Mitton, 1992); **Celex** (Celex, 1995). *(p.19)*
  - Beep's grapheme set includes **apostrophe, hyphen, underscore and period** (plus rare
    punctuation not counted in Table 1). *(p.19)*
  - **OALD's phoneme set includes stressed and unstressed vowels** (hence |Φ| = 82). *(p.19)*
  - Celex here is a randomly chosen subset excluding **phrases, abbreviations and
    homographs**, all words lower-cased. *(p.19)*
- Non-English: German **LexDb** (Lüngen et al., 1998) — random subset excluding
  hyphenated compounds, abbreviations and pronunciation variants, lower-cased; French
  **Brulex** (Content et al., 1990), from the Pascal Challenge. *(pp.19-20)*

#### Table 1 — Pronunciation databases *(p.20)*

| Data set | Language | \|G\| | \|Φ\| | avg \|g\| | avg \|φ\| | prons/word | train | test | held | x-validation |
|---|---|---|---|---|---|---|---|---|---|---|
| Beep | British English | 30 | 45 | 9.0 | 7.6 | 1.073 | 215713 | 25706 | – | 10× |
| Celex | British English | 26 | 53 | 8.4 | 7.1 | 1 | 39995 | 15000 | 5000 | – |
| OALD | British English | 26 | 82 | 8.2 | 6.9 | 1.008 | 56961 | 6377 | – | – |
| NETtalk 15k | US English | 26 | 50 | 7.3 | 6.2 | 1.010 | 14851 | 4951 | – | – |
| NETtalk 18k | US English | 26 | 50 | 7.3 | 6.3 | 1.010 | 17822 | 1980 | – | 10× |
| NETtalk 19k | US English | 26 | 50 | 7.3 | 6.3 | 1 | 18595 | 1000 | – | 5× |
| CMUdict | US English | 27 | 39 | 7.5 | 6.3 | 1.062 | 106837 | 12000 | – | – |
| Pronlex | US English | 30 | 41 | 7.4 | 6.9 | 1.094 | 83182 | 4800 | 2400 | – |
| LexDb | German | 30 | 46 | 10.4 | 9.0 | 1 | 40000 | 15000 | 5000 | – |
| Brulex | French | 40 | 39 | 8.5 | 6.7 | 1 | 24726 | 2747 | – | 10× |

### 7.3 Convergence behavior *(p.20, Fig. 2 p.21)*
- **Held-out set likelihood increases monotonically**, ensured by periodically adjusting
  the discount parameters. *(p.20)*
- The **discount slowly grows from iteration to iteration**. *(p.20)*
- As expected, the **discount increases with model order: $d_{M-1} < d_M$.** *(p.20)*
- Fig. 2 (p.21), NETtalk 15k, L = 2, M = 1: log-likelihood per word rises from about
  −29.75 at iteration 1 to a plateau near −26.55 (estimation set) / −26.65 (held-out) by
  iteration ~6. PER falls from ~33.5% at iteration 1 to a plateau of about 29.3-29.4% by
  iteration ~10 on both held-out and test set. *(p.21)*

### 7.4 Size of graphones (L and M interaction) *(pp.22-23, Fig. 3 p.22)*
- Effective range is controlled by graphone length and the sequence-model order M. The
  **actual size of each graphone is an outcome of training**; `L` bounds the maximum.
  Here all graphones of zero up to `L` letters **and** `L` phonemes are allowed
  ("L-to-L"). *(p.22)*
- On NETtalk 15k, all combinations of L in 1..4 and M in 1..6 were tested. *(p.22)*
- **Performance improves monotonically with longer M-gram range.** *(p.22)*
- **Two regimes for maximum graphone size** *(p.22)*:
  - When the sequence model retains little or no context (**M ≤ 2**), chunks step in and
    performance is **better the longer the chunks**.
  - With longer-range sequence models (**M ≥ 4**) the situation reverses: accuracy is
    **worse the bigger the chunks**, expected because data is sparser for larger chunks.
  - **With four-grams and beyond the best results use singular graphones only (L = 1).**
- Approximate PER read off Fig. 3 (NETtalk 15k, L-to-L, 90% CI error bars) *(p.22)*:

  | M | L=1 | L=2 | L=3 | L=4 |
  |---|---|---|---|---|
  | 1 | ~41.8 | ~29.2 | ~21.5 | ~17.8 |
  | 2 | ~19.1 | ~13.5 | ~12.0 | ~14.0 |
  | 3 | ~10.6 | ~10.5 | ~13.0 | ~14.0 |
  | 4 | ~8.7 | ~10.6 | ~12.7 | ~14.1 |
  | 5 | ~8.3 | ~10.6 | ~12.7 | ~14.1 |
  | 6 | ~8.3 | ~10.6 | ~12.7 | ~14.0 |

- **1-to-L alignments** (exactly one letter, zero up to L phonemes: $|g_q| = 1$,
  $|\varphi_q| \le L$) emulate typical **local classification** approaches. *(p.23)*

#### Table 2 — Alignment type comparison, PER [%], NETtalk 15k, M = 6 *(p.23)*

| Alignment type | L = 1 | L = 2 | L = 3 | L = 4 |
|---|---|---|---|---|
| L-to-L | 8.27 | 10.60 | 12.69 | 13.99 |
| 1-to-L | 8.27 | 8.32 | 8.33 | 8.32 |

- For 1-to-L alignments performance is **virtually independent of L**: the restriction to
  exactly one letter per graphone alone constrains the set of segmentations so largely
  that the additional phoneme-count constraint does not matter significantly. *(p.23)*
- For **L = 1 accuracy is slightly higher and on par with the FST-type model** that
  additionally allows phoneme insertions — understandable since most words have fewer
  phonemes than letters. *(p.23)*

### 7.5 Size of held-out set and fold-back training *(pp.23-24, Fig. 4 p.24)*
- Tension: too small a held-out set makes discount estimation unreliable; too large a
  held-out set depletes the estimation data. *(p.23)*
- **Fold-back training** (mitigation): after training converges, the held-out data is
  **added to the estimation data** and training iterates further to convergence **while
  keeping the discount parameters fixed**. *(p.23)*
- Experiments on NETtalk 15k with L = 1, M = 6: a **shallow optimum at about 1000 held-out
  words with fold-back**, which is **7% of the training data** for this set. Without
  fold-back, the depletion of training examples is felt very strongly. *(p.23)*
- **Conclusion: fold-back is generally advisable.** Since the held-out data only estimates
  M discount parameters, **1000 words should also work well with larger data sets**. The
  main experiments use fold-back except on data sets with a dedicated development test
  set. *(p.23)*
- Fig. 4 values read off (NETtalk 15k, L = 1, M = 6) *(p.24)*:

  | Held-out size (words) | PER no fold-back [%] | PER with fold-back [%] |
  |---|---|---|
  | ~100 | 8.44 | 8.44 |
  | 250 | 8.31 | 8.28 |
  | 500 | 8.38 | 8.27 |
  | 750 | 8.40 | 8.27 |
  | 1000 | 8.43 | 8.26 |
  | 1500 | 8.55 | 8.30 |
  | 2000 | 8.51 | 8.34 |
  | 2500 | 8.60 | 8.33 |

### 7.6 Effect of smoothing *(pp.24-25, Fig. 5 p.25)*
- Baseline "unsmoothed": all discount parameters fixed to zero, emulating ML estimation.
  Because probabilities are represented in the log domain, **zero probabilities are
  actually taken to be approximately $10^{-10^{10}}$**; so on an unseen grapheme sequence
  the decoder still uses the back-off "distribution", penalized with a quasi-zero weight.
  Without discounting that back-off "distribution" is **uniform**. A true naive-ML
  implementation would simply bail out on an unseen M-gram, so the back-off-as-last-resort
  scheme is the fairer comparison. *(p.24)*
- **Unsmoothed over-fitting kicks in at M ≥ 4.** Lowest PER on NETtalk 15k unsmoothed is
  **11.78% at M = 3 (L = 1), which is 42% higher** than the smoothed model achieves. *(p.24)*
- Main shortcoming of the unsmoothed model: it is **completely indiscriminative on unseen
  events**. *(p.25)*
- Second experiment: discount set to a small but non-zero **$d = 10^{-6}$**. This marginally
  smoothed model assigns too little mass to unseen events but does use a **proper back-off
  distribution**; it performs much better than unsmoothed but still lags the empirically
  smoothed model. *(p.25)*
- **Empirical discounts determined during training on this data:**
  $d_1 = 0.06$, $d_2 = 0.31$, $d_3 = 0.54$, $d_4 = 0.68$, $d_5 = 0.79$. *(p.25)*
- For short contexts (M ≤ 2) error rates are near-identical across all three settings,
  because data is not sparse in this regime. Beyond that, the smoothed model's error rate
  drops rapidly and **reaches a plateau at 8.27% for M ≥ 5**. The marginally smoothed
  model decreases gradually to its lowest value of **9.47% at M = 11**. So the smoothed
  model achieves a **12.7% relative lower error rate with a much smaller model
  (151k vs 435k M-grams)**. *(p.25)*
- Fig. 5 approximate PER, NETtalk 15k, L = 1 *(p.25)*:

  | M | d = 0 | d = 1e-6 | empirical discounts |
  |---|---|---|---|
  | 1 | ~43.5 | ~43.5 | ~41.8 |
  | 2 | ~19.0 | ~19.0 | ~19.0 |
  | 3 | ~11.7 | ~11.6 | ~10.5 |
  | 4 | ~13.8 | ~12.0 | ~8.7 |
  | 5 | ~17.3 | ~11.5 | ~8.3 |
  | 6 | ~23.0 | ~10.1 | ~8.3 |
  | 7 | ~28.5 | ~9.8 | ~8.3 |
  | 8 | ~32.5 | ~9.6 | ~8.3 |
  | 9 | ~35.2 | ~9.5 | ~8.3 |

### 7.7 Training with maximum approximation *(pp.25-26, Table 3 p.26)*
Models trained on NETtalk 15k, L = 1..3, M = 6, four settings: init flat (13) or by
unconstrained counts (19), then EM ("sum", with summation over alternative segmentations)
or maximum-approximation ("maximum") training to convergence. *(p.26)*

#### Table 3 — Initialization x training scheme, PER [%], NETtalk 15k, M = 6 *(p.26)*

| Initialization | Training | L = 1 | L = 2 | L = 3 |
|---|---|---|---|---|
| flat | maximum | 8.42 | 12.40 | 20.71 |
| counts | maximum | 8.36 | 10.84 | 13.65 |
| flat | sum | 8.27 | 10.60 | 12.66 |
| counts | sum | 8.27 | 10.59 | 12.61 |

- **Maximum-approximation training is very sensitive to initialization**; count-based
  initialization is far better for non-singular graphones. For singular graphones the
  advantage is not quite significant. *(p.26)*
- **Training with summation is rather insensitive to initialization**; the difference
  between initialization schemes is insignificant. *(p.26)*
- **Generally the maximum approximation in training hurts performance.** For L = 2 the
  difference is significant with a **95% probability of improvement** by pairwise
  bootstrap analysis (Bisani and Ney, 2004). For **L = 1 there seems to be no significant
  disadvantage** to using the maximum approximation. *(p.26)*

### 7.8 Transcription with summation *(pp.26-27, Table 4 p.27)*
Method: n-best lists computed on NETtalk 15k per sec. 6.3 with M = 6. Each entry is a
unique graphone sequence implying a candidate transcription with an associated posterior
probability. **List length was chosen to be at least 50 and per word such that the
accumulated posterior probability exceeded 0.99.** Oracle error of the n-best lists is
far below first-best. Two derived lists per original: (a) max-approximation list — repeated
pronunciations dropped, order preserved (decreasing max-approximated posterior (26));
(b) summation list — posteriors of entries with the same pronunciation summed, list
re-sorted. Compared by average rank-order correlation, fraction of words whose top-scoring
candidate changed, and first-best error rates. *(pp.26-27)*

#### Table 4 — Decoding with/without maximum approximation, NETtalk 15k, M = 6 *(p.27)*

| Quantity | L = 1 | L = 2 | L = 3 | L = 4 |
|---|---|---|---|---|
| length of n-best list | 84.00 | 101.07 | 56.96 | 47.14 |
| distinct pronunciations | 81.91 | 69.19 | 36.72 | 29.29 |
| alignments per pronunciation | 1.0184 | 1.4330 | 1.6378 | 1.7108 |
| oracle PER [%] | 0.23 | 0.46 | 1.43 | 3.74 |
| rank-order correlation | 0.9838 | 0.9864 | 0.9796 | 0.9524 |
| first-best changes [%] | 0.0800 | 1.9992 | 2.9035 | 2.2065 |
| PER without summation [%] | 8.27 | 10.60 | 12.69 | 14.89 |
| PER with summation [%] | 8.27 | 10.42 | 12.43 | 14.75 |

- **Repeated transcriptions are very rare for singular graphones (L = 1)**, so accuracy is
  practically unaffected by summation in decoding. *(p.27)*
- Larger graphones give more alignment ambiguity (more alignments per transcription), but
  **rank-order correlation stays very close to one**: candidates rarely change position due
  to summation. *(p.27)*
- Summation in decoding gives a **small but consistent improvement**; still, the best
  results come from singular graphones where summation is unnecessary. *(p.27)*

### 7.9 Performance evaluation — final settings *(p.28)*
**Best-known configuration used for all headline results** *(p.28)*:
- Models use **only singular graphones (L = 1)**.
- Trained with the **EM algorithm with summation** and **flat initialization**.
- When no dedicated development set exists, a held-out set of **about 1000 words** is
  randomly picked from the training data, and **additional fold-back training** is done as
  a final step.
- On data sets with a development test set (Celex, Pronlex, LexDb) it is used as the
  held-out set and **no fold-back** is done.
- **Sequence model order chosen per data set to maximize held-out log-likelihood; in all
  cases this was M = 8 or 9.**
- In decoding, the **maximum approximation** is used.
- Error margins are 90% confidence intervals from **per-word bootstrap resampling** (Bisani
  and Ney, 2004). For n-fold cross-validation data sets, n models are trained independently
  on (n−1)/n of the data and evaluated on the remaining n-th; error rates are computed on
  the **union of the n test sets**. *(p.28)*
- The authors note it is conceivable different settings work better on significantly larger
  data sets, but they did not pursue this as preliminary tests indicated otherwise. *(p.28)*

#### Table 5 — English data sets, comparison with prior published results *(p.29)*
"=" marks lines using exactly the same data for training and testing; others are faithful
replications. "±" is a 90% confidence interval.

| Data set | Same data | Author | PER [%] | WER [%] |
|---|---|---|---|---|
| Beep | | **this work** | **3.38 ± 0.03** | **20.08 ± 0.15** |
| Celex | = | Bisani and Ney (2002) | 3.98 | |
| Celex | = | Vozila et al. (2003) | 3.68 | 17.13 |
| Celex | | Chen (2003) | 2.7 | |
| Celex | = | **this work** | **2.50 ± 0.11** | **11.42 ± 0.43** |
| OALD | | Pagel et al. (1998) with POS | 6.03 | 21.87 |
| OALD | | Pagel et al. (1998) w/o POS | | 23.34 |
| OALD | = | Chen (2003) | | 18.9 |
| OALD | = | **this work** | **3.54 ± 0.19** | **17.49 ± 0.78** |
| NETtalk 15k | | Andersen et al. (1996) | | 47.0 |
| NETtalk 15k | | Jiang et al. (1997) | 8.1 | 34.2 |
| NETtalk 15k | = | Chen (2003) | | 34.6 |
| NETtalk 15k | = | **this work** | **8.26 ± 0.32** | **33.67 ± 1.10** |
| NETtalk 18k | | Torkkola (1993) | 9.2 | |
| NETtalk 18k | | Yvon (1996) | | 36.04 |
| NETtalk 18k | | Galescu and Allen (2001) | 9.00 | 36.07 |
| NETtalk 18k | | **this work** | **7.83 ± 0.16** | **31.79 ± 0.54** |
| NETtalk 19k | | Marchand and Damper (2000) | | 34.5 |
| NETtalk 19k | = | Chen (2003) | | 32.1 |
| NETtalk 19k | = | **this work** | **7.66 ± 0.31** | **31.00 ± 1.09** |
| CMUdict | | Galescu and Allen (2002) | 7.0 | 28.5 |
| CMUdict | = | Chen (2003) | 5.9 | 24.7 |
| CMUdict | = | **this work** | **5.88 ± 0.18** | **24.53 ± 0.65** |
| Pronlex | = | Chen (2003) conditional ME | 8.00 | 31.8 |
| Pronlex | = | Chen (2003) joint ME | 7.15 | 27.3 |
| Pronlex | = | **this work** | **6.78 ± 0.31** | **27.33 ± 1.04** |

#### Table 6 — Non-English data sets *(p.30)*

| Language | Data set | PER [%] | WER [%] |
|---|---|---|---|
| German | LexDb | 0.28 ± 0.03 | 1.75 ± 0.18 |
| French | Brulex | 1.18 ± 0.05 | 6.25 ± 0.24 |

#### Table 7 — Accuracy on the respective *training* sets (same models as Tables 5-6) *(p.30)*

| Language | Data set | PER [%] | WER [%] |
|---|---|---|---|
| British English | Beep | 0.36 ± 0.01 | 2.18 ± 0.05 |
| US English | NETtalk 15k | 0.44 ± 0.04 | 2.16 ± 0.20 |
| US English | CMUdict | 0.38 ± 0.02 | 1.79 ± 0.07 |
| German | LexDb | 0.007 ± 0.002 | 0.06 ± 0.02 |
| French | Brulex | 0.05 ± 0.01 | 0.25 ± 0.05 |

#### Table 8 — Model sizes for the accuracies of Tables 5 and 6 *(p.30)*
Total number of graphones occurring in the model (after trimming), M-gram order, and total
number of M-grams stored (including back-off weights). Cross-validation data sets show
maximum values.

| Data set | Graphones | Order M | Parameters (M-grams) |
|---|---|---|---|
| Beep | 485 | 9 | 1,728,389 |
| Celex | 226 | 8 | 670,582 |
| OALD | 307 | 9 | 815,109 |
| NETtalk 15k | 149 | 8 | 246,149 |
| NETtalk 18k | 158 | 8 | 293,572 |
| NETtalk 19k | 155 | 8 | 296,184 |
| CMUdict | 270 | 9 | 1,556,784 |
| Pronlex | 282 | 8 | 1,321,060 |
| LexDb | 158 | 9 | 347,758 |
| Brulex | 193 | 8 | 401,739 |

---

## 8. Discussion *(pp.28, 31-32)*

- The proposed method is more accurate than or on par with all previously published
  results. *(p.28)*
- **Chen (2003) is very close** to this method, unsurprising since his approach is very
  similar but **computationally more demanding**: singular graphones with a long-range
  M-gram, the same basic configuration that gave the best results here, but with
  maximum-entropy estimation with Gaussian priors instead of discounting/interpolation.
  **The maximum-entropy method is therefore not essential** for this level of accuracy;
  since both models use the same contextual information (M-grams), smooth unseen-event
  probabilities and preserve lower-order marginals, similar performance is expected
  (Chen and Rosenfeld, 2000). *(pp.28, 31)*
- **Joint-sequence models handle the alignment problem intrinsically** (Och and Ney,
  2003) — convenient when developing a G2P system for a **new language**, where
  alignment rules would otherwise be hand-written. *(p.31)*
- Chunking (grouping symbols into larger units) is intuitively appealing: it allows a
  natural mapping for frequent letter groups such as "th" or "ph". Chen (2003) doubted
  whether chunking helps accuracy; **no previous work had explored non-singular graphones
  combined with a long-range M-gram (M ≥ 5)**. *(p.31)*
- **Reconciling the two regimes:** non-singular graphones help when the overarching
  M-gram model has a short span; as the M-gram span extends, shorter graphones gain
  accuracy more quickly and eventually perform better. **Singular graphones + long-range
  sequence model yields the best performance.** *(p.31)*
- **Accuracy increases monotonically with M and typically saturates at M = 8 or 9, which
  corresponds to typical word length**, confirming the common language-modeling wisdom
  that one should "remember" everything. *(p.31)*
- **1-to-n alignments can achieve comparable accuracy** and may have advantages in terms
  of a **simpler decoder implementation**. *(p.31)*
- Explanation of the failure of non-singular graphones: larger graphone inventories
  **aggravate data sparseness** in estimating the sequence model. But this also shows
  **the best conceivable training procedure has not yet been found** — since shorter
  graphones are a subset of the larger ones, a perfect algorithm should be able to pick
  only the shorter ones when they predict best, making artificial constraints
  unnecessary. *(p.31)*
- The ability to infer **variable-length fragments from unaligned data** may still be
  useful elsewhere, e.g. finding **sub-word units for open-vocabulary speech recognition**
  (Bisani and Ney, 2005; Galescu, 2003). *(p.31)*
- **On the maximum approximation:** experiments confirm theory — carrying out the
  summation consistently leads to better performance. During training it is generally
  advisable to use the **true EM algorithm (with summation)**. For transcription,
  **summation has no impact as long as only singular graphones are used**. *(pp.31-32)*
- **Smoothing is essential** to obtaining highly accurate models. *(p.32)*
- **Memorization vs compression caveat:** a major strength of these sequence models is
  that they **easily memorize long sequences from the training data**, visible as very low
  training-set error rates (Table 7). However, the models **require a quite large amount
  of memory and are probably not suitable for lexicon compression**. Further research is
  required for application in **scarce-memory environments**. *(p.32)*

#### Table 9 — Typical automatically inferred graphones *(p.32)*
The fifteen graphones with highest unigram probabilities inferred from English Celex
(left) and German LexDb (right). **M = 1, L = 4.**

| Celex p(q) | g_q | φ_q | | LexDb p(q) | g_q | φ_q |
|---|---|---|---|---|---|---|
| 0.04825 | "s" | [s] | | 0.07438 | "en" | [ə n] |
| 0.03134 | "t" | [t] | | 0.05756 | "t" | [t] |
| 0.02647 | "s" | [z] | | 0.03535 | "ge" | [g ə] |
| 0.02446 | "ing" | [ɪ ŋ] | | 0.03026 | "n" | [n] |
| 0.02116 | "l" | [l] | | 0.02592 | "r" | [r] |
| 0.02067 | "p" | [p] | | 0.02204 | "l" | [l] |
| 0.01994 | "n" | [n] | | 0.02201 | "s" | [s] |
| 0.01845 | "d" | [d] | | 0.02177 | "te" | [t ə] |
| 0.01817 | "st" | [s t] | | 0.01927 | "sch" | [ʃ] |
| 0.01166 | "in" | [ɪ n] | | 0.01907 | "m" | [m] |
| 0.01114 | "m" | [m] | | 0.01905 | "de" | [d ə] |
| 0.01073 | "ly" | [l ɪ] | | 0.01725 | "st" | [s t] |
| 0.00997 | "b" | [b] | | 0.01555 | "e" | [ə] |
| 0.00981 | "c" | [k] | | 0.01492 | "es" | [ə s] |
| 0.00813 | "tion" | [ʃ n̩] | | 0.01418 | "er" | [ɐ] |

---

## 9. Applications *(pp.32-37)*

### 9.1 Lexicon augmentation *(pp.32-33)*
- LVCSR systems build HMMs for all vocabulary words from smaller context-dependent units
  (e.g. triphones). Recognition vocabularies have high but rarely complete coverage. When
  end users add words, the phonemic representation is typically hidden (users are not
  expected to know phonetic notation), so G2P produces the pronunciation from the
  orthography the user typed. Desktop applications may additionally use acoustic sample
  utterances. *(pp.32-33)*
- **Rapid cross-domain porting:** adapting an existing LVCSR system to a new domain where
  the existing lexicon has a high out-of-vocabulary rate; G2P is a fast and cheap way to
  supply the missing transcriptions. Bisani and Ney (2003) studied the trade-off between
  manual transcription effort and recognition accuracy. **Key advantage of data-driven
  G2P here: the model can be trained on the existing system dictionary, so the automatic
  transcriptions will be consistent with pronunciations already in it.** An independently
  developed G2P converter would generally deviate in phoneme inventory and transcription
  conventions. Gollan et al. (2005) and Lööf et al. (2006) report ported systems. *(p.33)*
- **Pronunciation variants:** the n-best decoder (sec. 6.3) generates alternative
  candidates; if the training data contains systematic pronunciation variation, the n-best
  decoder consistently produces variants. **But there is little guidance on how many
  pronunciations to accept**, and the algorithm **will not produce likely variants in the
  sense of natural phonological variation** — variants reflect ambiguity and variation
  found in the training data. This method **cannot be used on its own to suggest variants
  due to dialect or other phonological processes absent from the training data**. *(p.33)*

### 9.2 Sound-to-letter (phoneme-to-grapheme) conversion *(pp.33-34)*
- Few publications address the inverse problem (Meng et al., 1994; Galescu and Allen,
  2002). **Advantage of joint-sequence models: they are symmetric with respect to both
  sides of the transduction, so applying them in the opposite direction is
  straightforward.** *(pp.33-34)*

#### Table 10 — Phoneme-to-grapheme conversion accuracy *(p.34)*

| Language | Data set | System | Letter error rate [%] | Word error rate [%] |
|---|---|---|---|---|
| US English | NETtalk 18k | Galescu and Allen (2002) | 10.03 | 41.87 |
| US English | NETtalk 18k | this work | 8.62 ± 0.16 | 37.27 ± 0.57 |
| US English | CMUdict | Galescu and Allen (2002) | 11.5 | 49.7 |
| US English | CMUdict | this work | 10.35 ± 0.22 | 47.31 ± 0.73 |
| German | LexDb | this work | 0.41 ± 0.04 | 2.86 ± 0.22 |
| French | Brulex | this work | 5.62 ± 0.11 | 26.75 ± 0.44 |

- On NETtalk, spelling accuracy is relatively close to pronunciation accuracy on the
  reverse task: **letter error rate is 10% higher than phoneme error rate**. On CMUdict
  that ratio is **76%**, significantly worse, explained by the **higher number of proper
  names, abbreviations and acronyms** in CMUdict. *(p.34)*
- High German accuracy again shows German has a **rather phonetic orthography**. French
  phoneme-to-grapheme accuracy is **strikingly poor**, attributed to the **notoriously
  high number of homophones** and in particular the prevalence of **silent final
  consonants**. *(p.34)*
- Combining sound-to-letter with a phoneme recognizer to orthographically transcribe
  out-of-dictionary words suggests itself, but **unguided acoustic phoneme recognition is
  notoriously inaccurate** (Bisani and Ney, 2001), which impedes applicability. *(p.34)*

### 9.3 Facilitating creation of pronunciation dictionaries *(pp.34-35)*
- Used during creation of the **German LC-Star lexicon** for speech synthesis and
  recognition (Ziegenhain, 2005; Bisani et al., 2005): **over 46,000 proper names and
  54,000 common words**, each with part-of-speech information and phonemic transcriptions
  in **SAMPA** notation (Wells, 1997a,b), **including syllabification and stress marks**.
  *(pp.34-35)*
- **How stress and syllabification were handled:** a **syllable boundary marker and a
  stress marker were simply added to the phoneme inventory**. The method has **no
  provisions to account for the structural properties of stress and syllabification**, so
  structural errors occur, e.g. **multiple primary stresses in a word or syllables without
  a nucleus**. Nevertheless the G2P method provided **reasonably good syllable boundary
  and stress prediction**, and structural errors are not harmful in this application
  because they **can be filtered out very easily**. *(p.35)*
- **Bootstrapping loop actually used** *(p.35)*:
  1. Transcribe the most frequent words manually.
  2. Estimate a G2P model; transcribe additional words automatically.
  3. Manually verify and correct those automatic transcripts.
  4. Add the corrected transcripts to the G2P training data, yielding an improved model.
  5. Iterate. Over several iterations the fraction of incorrect pronunciations found in
     the verification step **fell below 1%**.
- **Active-selection detail:** in early iterations, words to verify were chosen
  **randomly**. In later iterations the **orthographic perplexity** of each word was
  computed, defined as $p(\boldsymbol{g})^{-1/|\boldsymbol{g}|}$, using an M-gram model
  $p(\boldsymbol{g})$ based on the G2P training data available at that point. The **words
  with the highest perplexity were chosen for manual correction** — these are hardest for
  the model to predict, because they correspond least to words seen in training. *(p.35)*
- **Warning:** there is **danger in overdoing this**. Odd words may accumulate in the
  training data at higher than natural concentration, **causing the algorithm to prefer
  the exception over the rule**. *(p.35)*

### 9.4 Spotting errors in pronunciation databases (confidence measures) *(pp.35-37)*
Criteria examined for finding incorrect entries in G2P output *(pp.35-36)*:
- **Orthographic probability $p(\boldsymbol{g})$** — the G2P model typically gives bad
  results for words very unlike those seen in training; dissimilarity with training data
  is reflected by a low probability.
- **Orthographic perplexity $p(\boldsymbol{g})^{-1/|\boldsymbol{g}|}$**.
- **Phonotactic probability $p(\varphi)$** — measures how much the word sounds like a
  typical word of the language; strange unpronounceable phoneme sequences should have low
  phonotactic probability.
- **Phonotactic perplexity $p(\varphi)^{-1/|\varphi|}$**.
- **G2P posterior probability $p(\varphi\mid\boldsymbol{g})$** — theoretically most
  appealing, as it corresponds to the estimate of the probability that $\varphi$ is the
  correct pronunciation of $\boldsymbol{g}$.

**Evaluation protocol (LC-Star German lexicon project)** *(p.36)*:
- G2P model trained on **31,405 manually verified example pronunciations**, **2% used as
  held-out set, without fold-back**. Model uses **only singular graphones with M = 7**.
- Another **86,000 words** transcribed with this model; the criteria computed for each.
- **5,746 words randomly selected for manual verification**, by **sampling uniformly from
  the range of observed values** of the quantities studied and picking the word with the
  closest value. This allows judging error rate as a function of the confidence measure.
  **Uniform sampling per entry would have given very poor coverage of very-high and
  very-low confidence regions.**
- The entry list was **sorted alphabetically before being given to the human expert**, so
  the expert had no indication of whether a pronunciation had high or low confidence.

#### Table 11 — Confidence measures, equal error rate *(p.37)*
Equal error rate (cross-over error rate) is the operating point where false acceptance
and false rejection rates are equal.

| Measure | Equal error rate [%] |
|---|---|
| Orthographic perplexity | 41.7 |
| Orthographic probability | 41.1 |
| Phonotactic perplexity | 41.3 |
| Phonotactic probability | 35.6 |
| **Grapheme-to-phoneme posterior probability** | **31.2** |

- **Posterior probability performs much better than all other measures.** *(p.36)*
- **Orthographic and phonotactic perplexity are consistently inferior to the corresponding
  probability.** Possible explanation: **perplexity favors longer words** because the
  impact of unlikely letters or phonemes is diluted; the data indicates **longer words
  have a higher chance of containing an error**, presumably because long words have more
  phonemes that can be wrong. *(p.36)*
- **Caveat:** the pronunciations assessed were generated by the very same method and data
  used to verify them, so **classification into correct/wrong is harder than finding gross
  mistakes or inconsistencies between different sources**. *(p.36)*
- **Fig. 6 (p.37):** detection-error trade-off curves (false rejection vs false acceptance)
  for orthographic probability, phonotactic probability, and G2P posterior. The posterior
  curve lies below (better than) the other two across the whole operating range;
  orthographic probability is the worst of the three.

## Acknowledgements *(p.37)*
Partially funded by the European Commission under Human Language Technologies projects
**CoreTex (IST-1999-11876)**, **LC-Star (IST-2001-32216)**, and **TC-Star
(IST-2002-FP6-506738)**.

---

## Figures of Interest

- **Fig. 1 (p.14):** Pseudocode of the **Discounted EM algorithm** — the outer bottom-up
  loop over model order M, inner EM loop, and discount adjustment by direction set method.
  This is the single most implementable artifact in the paper.
- **Fig. 2 (p.21):** Evolution of training-data likelihood (top) and phoneme error rate
  (bottom) over EM iterations, NETtalk 15k, L = 2, M = 1. Shows monotone held-out
  likelihood and PER plateau by ~iteration 10.
- **Fig. 3 (p.22):** PER vs M for L = 1..4 (L-to-L models), NETtalk 15k, with 90% CI error
  bars. The crossing of the L curves between M = 2 and M = 4 is the key evidence for the
  two-regime finding.
- **Fig. 4 (p.24):** PER vs held-out set size with and without fold-back training,
  NETtalk 15k, L = 1, M = 6. Shallow optimum near 1000 words with fold-back.
- **Fig. 5 (p.25):** PER vs M for d = 0, d = 10⁻⁶, and empirical discounts, NETtalk 15k,
  L = 1. Shows unsmoothed over-fitting from M ≥ 4 and the smoothed plateau at 8.27%.
- **Fig. 6 (p.37):** Detection-error trade-off curves for the three best confidence
  measures. G2P posterior dominates.

---

## Parameters

### Model structure parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|---|---|---|---|---|---|---|
| Maximum graphone length (letters and phonemes) | L | symbols | 1 | 1-4 tested | 11, 22 | L = 1 (singular graphones) best with long-range M-gram; controls graphone inventory size |
| M-gram history order | M | joint units | 8-9 | 1-11 tested | 11, 28 | Best chosen by held-out log-likelihood; saturates at 8-9 (typical word length) |
| Discount parameter, order M | d_M | evidence units | optimized | 0.06-0.79 observed | 12, 25 | Absolute-discounting parameter; d_{M-1} < d_M; optimized on held-out set by Powell's method |
| Discount d1 (NETtalk 15k, L=1) | d_1 | – | 0.06 | – | 25 | Empirical, this data |
| Discount d2 (NETtalk 15k, L=1) | d_2 | – | 0.31 | – | 25 | Empirical, this data |
| Discount d3 (NETtalk 15k, L=1) | d_3 | – | 0.54 | – | 25 | Empirical, this data |
| Discount d4 (NETtalk 15k, L=1) | d_4 | – | 0.68 | – | 25 | Empirical, this data |
| Discount d5 (NETtalk 15k, L=1) | d_5 | – | 0.79 | – | 25 | Empirical, this data |
| Evidence trimming threshold | τ | evidence units | – | tuned on dev data | 11 | Explicit trimming (eq. 14); superseded by discounting, which trims implicitly |
| Held-out set size | – | words | ~1000 | 100-2500 tested | 23 | Shallow optimum at 1000 with fold-back = 7% of NETtalk 15k training set |
| Boundary / end-of-sequence symbol | ⊥ | – | – | – | 8 | Occupies positions i < 1 and i > K; models word-start/end phenomena |
| Interpolation weight | λ(h) | – | derived | – | 12 | Chosen so p_M(·\|h) sums to one |
| Quasi-zero probability (log domain) | – | probability | ~1e-10000000000 | – | 24 | Implementation artifact making the unsmoothed baseline still back off |

### Decoding parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|---|---|---|---|---|---|---|
| Minimum n-best list length | – | entries | 50 | – | 26 | Also grown per word until accumulated posterior > 0.99 |
| N-best accumulated posterior mass | – | probability | 0.99 | – | 26 | Stopping criterion for list length |
| Beam width | – | – | not used | – | 17 | Rejected: best-first (Dijkstra / A* with zero rest cost) is exact, no search errors |

### Resource / runtime parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|---|---|---|---|---|---|---|
| Training time, Pronlex 9-gram | – | days | ~3 | – | 17 | On a 1.8 GHz CPU |
| Peak training memory, Pronlex 9-gram | – | GB RAM | up to 1 | – | 17 | One of the larger data sets |
| Model size (graphones after trimming) | – | graphones | 149-485 | 149-485 | 30 | See Table 8 |
| Model size (M-grams stored) | – | M-grams | 246k-1.73M | 246,149-1,728,389 | 30 | Includes back-off weights; see Table 8 |
| Smoothed vs marginally-smoothed model size | – | M-grams | 151k vs 435k | – | 25 | NETtalk 15k; smoothed is smaller AND 12.7% relatively more accurate |

### LC-Star confidence-measure experiment parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|---|---|---|---|---|---|---|
| Training pronunciations | – | words | 31405 | – | 36 | Manually verified |
| Held-out fraction | – | % | 2 | – | 36 | No fold-back used |
| M-gram order | M | – | 7 | – | 36 | Singular graphones only |
| Words auto-transcribed | – | words | 86000 | – | 36 | Criteria computed for each |
| Words manually verified | – | words | 5746 | – | 36 | Sampled uniformly over the range of the confidence values |
| Verification-loop residual error | – | % | <1 | – | 35 | Fraction of incorrect pronunciations found in the verification step after several iterations |

## Effect Sizes / Key Quantitative Results

| Outcome | Measure | Value | CI (90%) | Population/Context | Page |
|---|---|---|---|---|---|
| G2P accuracy | PER | 3.38% | ± 0.03 | Beep (British English), this work | 29 |
| G2P accuracy | WER | 20.08% | ± 0.15 | Beep, this work | 29 |
| G2P accuracy | PER | 2.50% | ± 0.11 | Celex, this work (prior best 2.7, Chen 2003) | 29 |
| G2P accuracy | WER | 11.42% | ± 0.43 | Celex, this work (prior best 17.13, Vozila 2003) | 29 |
| G2P accuracy | PER | 3.54% | ± 0.19 | OALD, this work (prior 6.03, Pagel 1998) | 29 |
| G2P accuracy | WER | 17.49% | ± 0.78 | OALD, this work (prior 18.9, Chen 2003) | 29 |
| G2P accuracy | PER | 8.26% | ± 0.32 | NETtalk 15k, this work (prior 8.1, Jiang 1997) | 29 |
| G2P accuracy | WER | 33.67% | ± 1.10 | NETtalk 15k, this work (prior 34.2/34.6) | 29 |
| G2P accuracy | PER | 7.83% | ± 0.16 | NETtalk 18k, this work (prior 9.00, Galescu 2001) | 29 |
| G2P accuracy | WER | 31.79% | ± 0.54 | NETtalk 18k, this work (prior 36.04, Yvon 1996) | 29 |
| G2P accuracy | PER | 7.66% | ± 0.31 | NETtalk 19k, this work | 29 |
| G2P accuracy | WER | 31.00% | ± 1.09 | NETtalk 19k, this work (prior 32.1, Chen 2003) | 29 |
| G2P accuracy | PER | 5.88% | ± 0.18 | CMUdict, this work (prior 5.9, Chen 2003) | 29 |
| G2P accuracy | WER | 24.53% | ± 0.65 | CMUdict, this work (prior 24.7, Chen 2003) | 29 |
| G2P accuracy | PER | 6.78% | ± 0.31 | Pronlex, this work (prior 7.15, Chen joint ME) | 29 |
| G2P accuracy | WER | 27.33% | ± 1.04 | Pronlex, this work (prior 27.3, Chen joint ME) | 29 |
| G2P accuracy | PER | 0.28% | ± 0.03 | LexDb (German), this work | 30 |
| G2P accuracy | WER | 1.75% | ± 0.18 | LexDb (German), this work | 30 |
| G2P accuracy | PER | 1.18% | ± 0.05 | Brulex (French), this work | 30 |
| G2P accuracy | WER | 6.25% | ± 0.24 | Brulex (French), this work | 30 |
| Training-set memorization | PER | 0.36% | ± 0.01 | Beep training set | 30 |
| Training-set memorization | PER | 0.007% | ± 0.002 | LexDb training set (German) | 30 |
| Smoothing benefit | relative PER reduction | 42% | – | Smoothed vs unsmoothed best (11.78% at M=3), NETtalk 15k | 24 |
| Smoothing benefit | relative PER reduction | 12.7% | – | Full discounts (8.27%) vs d=1e-6 best (9.47% at M=11) | 25 |
| Max-approximation in training penalty | PER absolute | +0.15 to +8.05 | – | flat/maximum vs flat/sum, L = 1..3, NETtalk 15k | 26 |
| Max-approximation in decoding penalty | PER absolute | 0.00 to +0.26 | – | L = 1 to L = 4, NETtalk 15k, M = 6 | 27 |
| Phoneme-to-grapheme | letter error rate | 8.62% | ± 0.16 | NETtalk 18k, this work (prior 10.03, Galescu) | 34 |
| Phoneme-to-grapheme | word error rate | 37.27% | ± 0.57 | NETtalk 18k, this work (prior 41.87) | 34 |
| Phoneme-to-grapheme | letter error rate | 10.35% | ± 0.22 | CMUdict, this work (prior 11.5) | 34 |
| Phoneme-to-grapheme | letter error rate | 0.41% | ± 0.04 | LexDb (German), this work | 34 |
| Phoneme-to-grapheme | letter error rate | 5.62% | ± 0.11 | Brulex (French), this work | 34 |
| Confidence measure quality | equal error rate | 31.2% | – | G2P posterior, LC-Star German | 37 |
| Confidence measure quality | equal error rate | 35.6% | – | Phonotactic probability, LC-Star German | 37 |
| Confidence measure quality | equal error rate | 41.1% | – | Orthographic probability, LC-Star German | 37 |

---

## Methods & Implementation Details (consolidated checklist)

1. **Data preparation.** Pairs of orthographic form and pronunciation, no alignment
   required. Split into estimation set $\mathcal{O}_t$ and held-out set $\mathcal{O}_h$
   (~1000 words). *(p.14, p.23)*
2. **Graphone inventory bound.** Choose L; for the best-performing configuration L = 1
   (singular graphones: at most one letter and at most one phoneme, excluding the empty
   pair). *(pp.7, 11, 22)*
3. **Unigram initialization.** Either flat (eq. 13) or from unconstrained counts (eq. 19)
   passed through the smoothing formula (15). With EM-with-summation training, the two are
   statistically indistinguishable. *(pp.11, 13-14, 26)*
4. **Segmentation graph construction.** Depth-first search over the space of
   co-segmentations of both sequences, building an explicit DAG whose vertices are
   $(l, r, h)$ = source position, target position, M-gram history, and whose edges are
   graphones. Topologically sort vertices during DFS and remove dead ends in the same
   pass. *(p.16)*
5. **Evidence accumulation.** Forward-backward on the topologically ordered DAG to get
   edge posteriors, then accumulate evidence values (eq. 11) into a hash map. Delete the
   graphs immediately after accumulation; regenerate next iteration. Keep the held-out
   graphs (small) for repeated discount adjustment. *(pp.16-17)*
6. **Model update.** Absolute discounting with interpolation and marginal-preserving
   back-off (eqs. 15, 17, 18), applied recursively down to the uniform zerogram (13).
   Graphones with evidence below the discount fall out of the model. *(pp.12-13)*
7. **Discount adjustment.** When held-out likelihood stops increasing, re-optimize
   $d_1,\ldots,d_{M-1}$ on the held-out set by a direction set method (Powell's method,
   Press et al. 1992 Ch. 10.5). *(pp.13-14)*
8. **Bottom-up order growth.** For M = 1..M_max: initialize the M-gram model from the
   (M-1)-gram model, initialize $d_M = d_{M-1}$, iterate until held-out likelihood stops
   increasing. Only histories that survived discounting at the lower order are allowed.
   *(p.14)*
9. **Fold-back.** After convergence, add the held-out data to the estimation data and
   iterate further with the discounts **frozen**. Skip when a dedicated development set
   exists. *(p.23)*
10. **Storage.** Hash map from joint multigram to integer index. M-gram model as an
    inverse prefix tree (root = unigram, leaves = most specific histories) embedded in an
    array in breadth-first order, so one integer index identifies a history. *(p.16)*
11. **First-best decoding.** Best-first search (Dijkstra / A* with zero rest cost) with
    recombination of alternative paths to the same node. Exact; no beam needed. *(p.17)*
12. **N-best decoding.** Keep alternative paths in a graph instead of relaxing them; run
    the forward algorithm with summation to get $p(\boldsymbol{g})$ (eq. 24); then a
    reverse A* from the final node using the un-summed forward probabilities as a perfect
    rest cost, yielding paths in exact descending probability order. *(pp.17-18)*
13. **Confidence.** Posterior $p(\varphi\mid\boldsymbol{g})$ (eq. 25), or its
    max-approximation (eq. 26) which is adequate in practice. *(p.18)*
14. **Stress and syllabification (if needed).** Add a syllable-boundary marker and a
    stress marker as ordinary symbols to the phoneme inventory. Filter out structural
    errors (multiple primary stresses, nucleus-less syllables) downstream. *(p.35)*

---

## Limitations *(explicitly acknowledged)*

- **Memory.** Models require a quite large amount of memory (up to 1.73M M-grams) and are
  **probably not suitable for lexicon compression**; further research needed for
  scarce-memory environments. *(p.32)*
- **Training cost.** 9-gram on Pronlex: ~3 days on a 1.8 GHz CPU, up to 1 GB RAM. *(p.17)*
- **Non-singular graphones underperform** with long-range models; the authors concede this
  means **the best conceivable training procedure has not yet been found**, since a
  perfect algorithm should select short graphones on its own without artificial length
  constraints. *(p.31)*
- **No structural model of stress or syllabification** — these are handled by inserting
  marker symbols, producing structural errors like multiple primary stresses or
  nucleus-less syllables. *(p.35)*
- **Pronunciation variants** generated by the n-best decoder reflect only variation present
  in the training data; the method **cannot suggest dialectal or phonological variants** on
  its own, and gives **little guidance on how many variants to accept**. *(p.33)*
- The hash map of joint multigrams **encompasses all possible multigrams**, not just those
  above the discount threshold, so it can consume a large amount of memory when long
  multigrams are allowed. *(p.16)*
- **Confidence-measure evaluation caveat:** pronunciations were generated and verified by
  the same method and data, making the correct/wrong classification harder than finding
  cross-source inconsistencies. *(p.36)*
- **Active selection by perplexity can backfire**, over-concentrating odd words in the
  training data and making the model prefer the exception over the rule. *(p.35)*
- **Phoneme accuracies from other publications cannot be converted to PER** reliably, so
  some prior work is not directly comparable. *(p.19)*
- Larger data sets were not explored for different optimal settings; preliminary tests
  suggested the same settings hold. *(p.28)*

## Arguments Against Prior Work

- **Against rule-based G2P:** rule design requires specific linguistic skills; language
  irregularities force exception rules/lists; rule interdependence makes maintenance
  tedious; systems still err on unanticipated exceptional words. *(p.3)*
- **Against dictionary look-up:** >100,000 hand entries is tedious and costly; storage is
  problematic on embedded/mobile devices; coverage is always finite while TTS must handle
  arbitrary words. *(p.3)*
- **Against local classification (neural nets, decision trees):** taking decisions about
  each phoneme locally is **clearly not optimal from a decision theoretic point of view**;
  it merely avoids a global search. *(p.4)*
- **Against pronunciation by analogy:** goes beyond local classification by considering
  whole words but is **generally not founded on a probabilistic model**. *(p.5)*
- **Against maximum-entropy joint models (Chen, 2003):** structurally similar and equally
  accurate but **computationally more demanding**; the max-ent machinery is **not
  essential** to reaching this accuracy, since both models use the same contextual
  information, smooth unseen events, and preserve lower-order marginals. *(p.31)*
- **Against Viterbi (maximum-approximation) multigram training (Deligne et al., 1995):**
  it is **very sensitive to initialization** and generally hurts performance; full EM with
  summation is insensitive to initialization and better. *(p.26)*
- **Against unsmoothed / naively smoothed estimation:** over-fitting from M ≥ 4; the
  unsmoothed model is **completely indiscriminative on unseen events**; 42% relatively
  worse than the smoothed model. *(pp.24-25)*
- **Against beam search for this problem (Chen, 2003 uses it):** risks search errors;
  best-first search is exact and cheap enough that further optimization was not worthwhile.
  *(p.17)*
- **Against Galescu and Allen's restriction of null grapheme units:** they disallow null
  grapheme units to permit simple DP search; the authors instead keep them and solve the
  unbounded-concatenation problem with best-first search. *(p.17)*
- **Against perplexity-based confidence:** perplexity is consistently inferior to the
  corresponding probability because it **favors longer words** while longer words in fact
  have a higher chance of containing an error. *(p.36)*
- **Against evidence-vs-model trimming:** model trimming (thresholding $p(q;\vartheta)$)
  is inferior because low-probability graphones can have near-unity conditional
  probability in particular words; removing them makes the training sample unrepresentable.
  *(pp.11-12)*

## Design Rationale

- **Joint units instead of a conditional channel:** the joint-sequence formulation reduces
  the joint probability of spelling and pronunciation to an M-gram over a single symbol
  stream, so **alignment is handled intrinsically** rather than as a separate
  pre-processing step — decisive for porting to a new language. *(pp.7, 31)*
- **Bayes decision rule over the joint probability** because it is provably optimal with
  respect to **word error**, the metric that matters for a pronunciation. *(p.7)*
- **Marginal-preserving Kneser-Ney rather than leaving-one-out**, because leaving-one-out
  derivations assume integer counts and evidence values are fractional. *(pp.12-13)*
- **Powell's method for discount optimization** rather than counts-of-counts estimates,
  again because fractional evidence values do not lend themselves to counting. *(p.13)*
- **Separate held-out set for discount optimization**, because sharing it with the evidence
  data would grossly underestimate the discount. *(p.14)*
- **Fold-back training** to recover the estimation data spent on the held-out set, while
  freezing the discounts so the tuning is not invalidated. *(p.23)*
- **Explicit DAG for segmentation graphs** rather than implicit topology in the algorithms,
  deliberately trading memory for **much lower code complexity**, especially for
  long-range M-gram models. Graphs are deleted after each accumulation to bound memory.
  *(pp.16-17)*
- **Best-first / Dijkstra search** rather than beam or input-synchronous DP, because
  input-epsilon graphones permit unbounded concatenation, and best-first is **exact** while
  still being fast enough. *(p.17)*
- **Bottom-up model construction** (order M initialized from order M-1) so that only
  histories that survived lower-order discounting are ever instantiated. *(p.14)*
- **Evidence trimming (or discount-induced trimming) rather than model trimming** for the
  reason above. *(pp.11-12)*
- **Singular graphones with a long-range M-gram** as the final recommended configuration,
  since chunking's benefit disappears once the sequence model has enough span, and larger
  inventories aggravate sparseness. *(pp.22, 31)*

## Testable Properties

- G2P accuracy **increases monotonically with M** and saturates at **M = 8 or 9**,
  corresponding to typical word length. *(pp.22, 31)*
- For **M ≤ 2**, PER decreases as maximum graphone length L increases; for **M ≥ 4**, PER
  increases as L increases. The regimes cross around M = 3. *(p.22)*
- With **1-to-L alignments**, PER is essentially **independent of L** (8.27-8.33% across
  L = 1..4 on NETtalk 15k at M = 6). *(p.23)*
- **Discounts increase with model order: $d_{M-1} < d_M$**, and grow slowly across EM
  iterations. *(p.20)*
- Held-out log-likelihood **increases monotonically** under the discounted EM algorithm.
  *(p.20)*
- With discounting, the model is **strictly smaller and strictly more accurate** than a
  marginally smoothed one: 151k M-grams at 8.27% PER vs 435k at 9.47%. *(p.25)*
- Held-out set size has a **shallow optimum near 1000 words** with fold-back; without
  fold-back, PER **increases monotonically** with held-out size beyond ~250 words. *(p.24)*
- Training with the maximum approximation costs **≤ 0.15 percentage points PER at L = 1**
  (not significant) but **up to 8 points at L = 3** (significant at 95% probability of
  improvement for L = 2). *(p.26)*
- Decoding with summation gives PER **identical at L = 1** and improvements of
  **0.14-0.26 points at L ≥ 2**. *(p.27)*
- **Alignments per pronunciation at L = 1 is ≈1.02**, so summation over segmentations is
  effectively a no-op for singular-graphone models. *(p.27)*
- **G2P posterior probability has strictly the lowest equal error rate** among all five
  confidence measures tested (31.2% vs 35.6-41.7%). *(p.37)*
- For any measure, **probability outperforms the corresponding perplexity** as a confidence
  measure. *(pp.36-37)*
- Languages with more phonetic orthographies give lower error: German LexDb 0.28% PER vs
  French Brulex 1.18% vs English 2.50-8.26%. *(pp.29-30)*
- **Phoneme-to-grapheme is harder than grapheme-to-phoneme** on data sets rich in proper
  names and acronyms: letter error rate is 10% above phoneme error rate on NETtalk but
  76% above on CMUdict. *(p.34)*

---

## Relevance to Project

This is the canonical reference implementation of a **statistical G2P front-end** for a
formant/source-filter synthesizer, and it is directly actionable rather than merely
historical:

- **It is the front-end module the synthesizer needs.** A formant synthesizer is driven by
  a phoneme sequence; this paper supplies a complete, self-contained recipe for producing
  that sequence from arbitrary orthography, including the data structures (inverse prefix
  tree, segmentation DAG), the search (Dijkstra / A* with zero rest cost), and the training
  loop (Fig. 1, p.14). The reference implementation (Sequitur G2P) is open source. *(p.16)*
- **The recommended configuration is small and specific:** singular graphones (L = 1),
  joint M-gram of order 8-9, EM with summation, flat initialization, ~1000-word held-out
  set with fold-back, maximum approximation in decoding. This is a short list of decisions
  an implementer can adopt wholesale. *(p.28)*
- **Stress and syllable markers ride along in the phoneme inventory.** For a synthesizer
  that needs lexical stress and syllable boundaries to drive prosody (F0 targets, duration
  rules), sec. 9.3 (p.35) documents the cheap trick that worked in production for the LC-Star
  German lexicon, along with its failure modes (multiple primary stresses, nucleus-less
  syllables) and the note that these are easy to filter.
- **Model size vs memory is the deciding trade-off** for a browser/WASM synthesizer target:
  246k-1.73M M-grams per language. The authors explicitly flag that these models are
  **probably not suitable for lexicon compression** and that scarce-memory deployment needs
  further research. *(pp.17, 30, 32)*
- **The posterior confidence measure is directly usable** to decide when to fall back to a
  hand dictionary entry versus trusting the generated pronunciation, and to flag entries for
  human review. Equal error rate 31.2%. *(p.37)*
- **N-best output gives pronunciation variants**, useful if the synthesizer front-end ever
  needs alternate readings — with the caveat that variants reflect training-data ambiguity,
  not phonological processes. *(p.33)*
- **Non-English languages come almost free**: the model handles alignment intrinsically, so
  adding a language means supplying a pronunciation dictionary, not writing rules. German
  reaches 0.28% PER, French 1.18%. *(pp.30, 31)*
- The **bootstrapping loop of sec. 9.3** is a practical recipe for building a project
  dictionary from scratch: transcribe frequent words by hand, train, auto-transcribe, verify
  the highest-orthographic-perplexity words, fold corrections back, repeat until the
  verification error rate is under 1%. *(p.35)*

## Open Questions

- [ ] Can the training procedure be improved so that variable-length graphones are selected
      only when they genuinely predict better, removing the need for the artificial L
      constraint? The authors state explicitly that a perfect algorithm should do this.
      *(p.31)*
- [ ] How can joint-sequence G2P be made to fit scarce-memory environments (embedded,
      WASM, mobile) without losing accuracy? Explicitly named as open. *(p.32)*
- [ ] How many pronunciation variants should be accepted from the n-best list? The authors
      note "there is little guidance." *(p.33)*
- [ ] How should structural constraints on stress and syllabification be modelled properly,
      rather than by inserting marker symbols and filtering the structural errors after the
      fact? *(p.35)*
- [ ] Do the best settings (L = 1, M = 8-9) still hold on data sets significantly larger
      than those tested? Not pursued, though preliminary tests indicated they do. *(p.28)*
- [ ] Can variable-length graphone inference from unaligned data help find sub-word units
      for open-vocabulary speech recognition? Pointed to as promising. *(p.31)*

## Related Work Worth Reading

- **Deligne, S., Bimbot, F. (1995, 1997)** — the original multigram EM formulation and the
  forward-backward inference of variable-length units. The direct ancestor of the estimation
  algorithm here. *(pp.9-10)*
- **Chen, S. F. (2003)** — conditional and joint maximum-entropy models for G2P; the closest
  competitor, with nearly identical accuracy at higher computational cost. *(pp.9, 28, 31)*
- **Kneser, R., Ney, H. (1995)** and **Chen, S. F., Goodman, J. (1999)** — the smoothing
  results the discounted-evidence estimation adapts to fractional counts. *(pp.12-13)*
- **Galescu, L., Allen, J. F. (2001, 2002)** — bidirectional joint n-gram conversion; the
  comparison point for phoneme-to-grapheme. *(pp.7, 9, 34)*
- **Sejnowski, T. J., Rosenberg, C. R. (1987)** — NETtalk, the origin of data-driven G2P and
  of the corpus used throughout. *(p.4)*
- **Pagel, V., Lenzo, K., Black, A. W. (1998)** — letter-to-sound rules for accented lexicon
  compression; the decision-tree baseline with POS features. *(p.5)*
- **Bisani, M., Ney, H. (2004)** — bootstrap estimates for confidence intervals in ASR
  performance evaluation; the significance-testing method used for every "±" in this paper.
  *(p.28)*
- **Och, F. J., Ney, H. (2003)** — systematic comparison of statistical alignment models;
  the source of the "alignment handled intrinsically" claim. *(p.31)*

## Collection Cross-References

### Already in Collection
- [Issues in Building General Letter to Sound Rules](../Black_1998_LTS_Rules/notes.md) - cited as Pagel, Lenzo, Black (1998), "Letter-to-sound rules for accented lexicon compression"; the decision-tree baseline with recomputed information gain and POS features referenced in the taxonomy of local-classification G2P methods

### New Leads (Not Yet in Collection)
- S. Deligne, F. Bimbot (1995, 1997) - the original multigram EM formulation and forward-backward inference of variable-length units, the direct ancestor of this paper's estimation algorithm
- S.F. Chen (2003) - "Conditional and joint models for grapheme-to-phoneme conversion" - the closest competitor, nearly identical accuracy at higher computational cost
- R. Kneser, H. Ney (1995) - "Improved backing-off for M-gram language modeling" - the smoothing method the discounted-evidence estimation adapts to fractional counts
- L. Galescu, J.F. Allen (2001, 2002) - bidirectional joint n-gram grapheme/phoneme conversion, the comparison point for phoneme-to-grapheme results
- T.J. Sejnowski, C.R. Rosenberg (1987) - "Parallel networks that learn to pronounce English text" (NETtalk) - the origin of data-driven G2P and source of the corpus used throughout this paper's experiments
- M. Bisani, H. Ney (2004) - "Bootstrap estimates for confidence intervals in ASR performance evaluation" - the significance-testing method used for every reported confidence interval
- F.J. Och, H. Ney (2003) - "A systematic comparison of various statistical alignment models" - source of the "alignment handled intrinsically" claim

### Supersedes or Recontextualizes
- (none)

### Cited By (in Collection)
- [Robust LTS rules with the Combilex speech technology lexicon](../Richmond_Clark_Fitt_2009_RobustLTSCombilex/notes.md) - cites this paper (ref [12]) as a potentially superior LTS method for future exploration with expert alignment

### Conceptual Links (not citation-based)
- [NRL Letter-to-Sound Rules](../Elovitz_1976_NRL_LTS/notes.md) - direct methodological contrast: Elovitz's 329 hand-written context-sensitive rules (90% accuracy) versus this paper's fully data-driven joint-sequence M-gram model trained by discounted EM; the pair spans the full range from manual rule engineering to statistical estimation for the same G2P task.
- [Universal Grapheme-to-Phoneme Prediction Over Latin Alphabets](../Kim_Snyder_2012_UniversalG2P/notes.md) - a later successor problem: where this paper fits one M-gram joint-sequence model per language from thousands of training pairs, Kim & Snyder predict G2P for languages with *no* training pairs at all by transferring phonotactic patterns learned across 107 other languages, trading this paper's per-language statistical precision for cross-lingual generalization.
