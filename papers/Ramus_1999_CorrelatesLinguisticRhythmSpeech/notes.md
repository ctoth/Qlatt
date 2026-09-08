---
title: "Correlates of linguistic rhythm in the speech signal"
authors: "Franck Ramus, Marina Nespor, Jacques Mehler"
year: 1999
venue: "Cognition, 73(3), 265-292"
doi_url: "https://doi.org/10.1016/S0010-0277(99)00058-X"
pages: "265-292"
affiliations: "Laboratoire de Sciences Cognitives et Psycholinguistique (EHESS/CNRS), Paris; Holland Institute of Generative Linguistics, University of Amsterdam; Facoltà di Lettere, Università di Ferrara"
funding: "Délégation Générale pour l'Armement; Human Frontiers Science Program"
---

# Correlates of linguistic rhythm in the speech signal

## One-Sentence Summary
Defines the %V / ΔC / ΔV rhythm metrics, computed from a bare consonant/vowel segmentation of the signal with no appeal to "syllable" or "stress", measures them on 160 utterances in eight languages, and shows that the (%V, ΔC) plane reproduces the stress-/syllable-/mora-timed rhythm classes and predicts adult and newborn language-discrimination results.

## Problem Addressed
Linguists classify languages into rhythm classes (stress-timed, syllable-timed, mora-timed), and infant language-discrimination findings rest on that classification, but decades of instrumental phonetics failed to find acoustic correlates: isochrony of interstress intervals or of syllables is simply not observed *(p.4)*. The competing phonological account (Dauer, Bertinetto, Dasher & Bolinger, Nespor) explains rhythm as a by-product of syllable structure and vowel reduction, but is not implemented, so it makes no quantitative prediction about where an intermediate language such as Polish or Catalan sits, or how features interact *(p.6)*.

## Key Contributions
- A purely phonetic, language-independent operationalization of rhythm using only a consonant/vowel segmentation *(p.6-7)*.
- Three sentence-level variables: %V, ΔC, ΔV *(p.7)*.
- Measurements on 8 languages x 4 speakers x 5 sentences = 160 hand-segmented utterances *(p.7, Table 1 p.25)*.
- Demonstration that the (%V, ΔC) plane reproduces the standard rhythm classes with a significant class effect *(p.8)*.
- A logistic-regression model of the adult discrimination task and an arousal/prototype model of the newborn habituation task, both driven by %V alone, that reproduce every available behavioral result *(p.10-15)*.
- Evidence that Polish is rhythmically distinct from the other stress-timed languages, driven by its unusually low ΔV *(p.9, Fig.2 p.31)*.

## Study Design
- **Type:** Instrumental acoustic-phonetic corpus measurement plus computational simulation of two classes of discrimination experiment.
- **Population:** 8 languages (English, Dutch, Polish, French, Spanish, Italian, Catalan, Japanese); 4 female native speakers per language; 5 sentences per speaker; 160 utterances *(p.7)*.
- **Material:** Short news-like declarative statements, originally written in French, loosely translated into the target language by one of the speakers. Matched across languages by syllable count (15-19 syllables) and roughly matched for average duration (~3 s) *(p.7)*.
- **Recording:** Soundproof booth, low-pass filtered, digitized at 16 kHz, recorded directly to hard disk *(p.7)*.
- **Corpus origin:** the multi-language corpus of Nazzi et al. (1998), augmented with Polish and Catalan for this study. Catalan and Spanish material recorded by Laura Bosch and Núria Sebastián-Gallés at the University of Barcelona *(p.7, footnote 4 p.24)*.
- **Primary measures:** %V, ΔV, ΔC per sentence.
- **Secondary analyses:** ANOVA with a rhythm-class factor; logistic regression per language pair; Mann-Whitney tests on simulated arousal.

## Algorithm: Segmentation and Variable Computation

1. Mark every phoneme boundary of each sentence with sound-editing software, using both auditory and visual cues, and the phoneme inventory of the specific language *(p.7)*.
2. Classify each phoneme as vowel or consonant. **Glide rule:** pre-vocalic and inter-vocalic glides (English /kwiːn/ "queen", /vawəl/ "vowel") are **consonants**; post-vocalic glides (/haw/ "how") are **vowels** *(p.7)*.
3. Do not use individual phoneme durations. Instead, within each sentence, form runs:
   - **Vocalic interval** = duration of a run of consecutive vowels, from onset of the first vowel to offset of the last vowel of the run.
   - **Consonantal interval** (equivalently *inter-vocalic interval*) = duration of a run of consecutive consonants.
   *(p.7)*
4. Worked example: "next Tuesday on", transcribed /nɛkstjuzdeiɔn/, gives 3 vocalic and 4 consonantal intervals: /n/ /ɛ/ /kstj/ /u/ /zd/ /eiɔ/ /n/ *(p.7)*.
5. Compute three variables, one value per sentence *(p.7, footnote 5 p.24)*:
   - **%V** = (total duration of vocalic intervals in the sentence) / (total duration of the sentence), x100.
   - **ΔV** = standard deviation of the vocalic interval durations within the sentence.
   - **ΔC** = standard deviation of the consonantal interval durations within the sentence.
6. **%C is isomorphic to %V and is therefore ignored** *(footnote 5, p.24)*.
7. For Table 1, the per-sentence values are averaged by language *(footnote 5, p.24)*.

## Key Equations

$$
\%V = \frac{\sum_{k} d^{V}_{k}}{T_{\text{sentence}}} \times 100
$$
Where: $d^{V}_{k}$ is the duration (s) of the k-th vocalic interval in the sentence and $T_{\text{sentence}}$ is the total sentence duration (s). %V is a percentage; the simulations use the 0-1 fraction. *(p.7, footnote 5 p.24)*

$$
\Delta V = \operatorname{sd}\left( \{ d^{V}_{k} \} \right), \qquad \Delta C = \operatorname{sd}\left( \{ d^{C}_{k} \} \right)
$$
Where: $\{d^{V}_{k}\}$ and $\{d^{C}_{k}\}$ are the sets of vocalic and consonantal interval durations within one sentence, in seconds. Both are reported in seconds (Table 1 shows them x100). *(p.7, p.24)*

$$
P_n = \frac{1}{n} \sum_{i=1}^{n} \%V_i
$$
Where: $P_n$ is the infant's prototype after hearing n sentences; $\%V_i$ is the vocalic proportion of the i-th sentence heard. This is an unbounded running mean; footnote 7 notes a limited-memory variant (last 10 sentences) would barely differ here. *(p.13, footnote 7 p.24)*

$$
A_n = \left| \%V_n - P_{n-1} \right|
$$
Where: $A_n$ is the infant's arousal at step n, the absolute distance between the current sentence's %V and the prototype formed from all previous sentences. $A_1$ is undefined because $P_0$ is undefined. *(p.13, p.15)*

$$
\text{DV}_{\text{pair}} = \frac{1}{10} \sum_{n=11}^{20} A_n
$$
Where: the dependent variable for the two-language simulations is the mean arousal over the 10 test-phase sentences (steps 11-20). Compared between experimental and control groups with a Mann-Whitney test. *(p.14)*

$$
\text{DV}_{\text{groups}} = \frac{1}{9}\left( \sum_{n=11}^{19} A_n - \sum_{n=2}^{10} A_n \right)
$$
Where: for the groups-of-languages simulation there is no control group *stricto sensu*, so the dependent variable is the difference in mean arousal between the 9 sentences following the switch and the 9 preceding it. Step 1 is excluded because $A_1$ is undefined. *(p.15)*

## Parameters

### Corpus and stimulus parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Number of languages | — | count | 8 | — | p.7 | English, Dutch, Polish, French, Spanish, Italian, Catalan, Japanese |
| Speakers per language | — | count | 4 | — | p.7 | All female native speakers |
| Sentences per speaker | — | count | 5 | — | p.7 | 160 utterances total |
| Sentence length | — | syllables | — | 15-19 | p.7 | Matched across languages |
| Sentence duration | — | s | ~3 | — | p.7 | Roughly matched across languages |
| Sampling rate | — | kHz | 16 | — | p.7 | Low-pass filtered before digitization |
| Low-pass filter for infant stimuli | — | Hz | 400 | — | p.27 (Table 3 note a) | Standard filtering in the cited newborn studies |
| Resynthesis F0 (Ramus & Mehler 1999) | F0 | Hz | 230 | — | p.10 | Constant F0; consonants -> /s/, vowels -> /a/ |
| Monotonization F0 (den Os 1988) | F0 | Hz | 100 | — | p.10 | LPC synthesis, then low-pass at 180 Hz |
| Low-pass cutoff (den Os 1988) | — | Hz | 180 | — | p.10 | After monotonization |

### Rhythm measurements by language (Table 1, p.25)

ΔV and ΔC are given multiplied by 100; standard deviations across sentences in parentheses.

| Language | Vocalic intervals (n) | Consonantal intervals (n) | %V (StDev) | ΔV x100 (StDev) | ΔC x100 (StDev) |
|----------|----------------------|---------------------------|------------|------------------|------------------|
| English | 307 | 320 | 40.1 (5.4) | 4.64 (1.25) | 5.35 (1.63) |
| Polish | 334 | 333 | 41.0 (3.4) | 2.51 (0.67) | 5.14 (1.18) |
| Dutch | 320 | 329 | 42.3 (4.2) | 4.23 (0.93) | 5.33 (1.5) |
| French | 328 | 330 | 43.6 (4.5) | 3.78 (1.21) | 4.39 (0.74) |
| Spanish | 320 | 317 | 43.8 (4) | 3.32 (1) | 4.74 (0.85) |
| Italian | 326 | 317 | 45.2 (3.9) | 4.00 (1.05) | 4.81 (0.89) |
| Catalan | 332 | 329 | 45.6 (5.4) | 3.68 (1.44) | 4.52 (0.86) |
| Japanese | 336 | 334 | 53.1 (3.4) | 4.02 (0.58) | 3.56 (0.74) |

As individual parameter rows for downstream extraction:

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Vocalic proportion, English | %V | % | 40.1 | ±5.4 sd | p.25 | Stress-timed; lowest %V in the corpus |
| Vocalic proportion, Polish | %V | % | 41.0 | ±3.4 sd | p.25 | Classified stress-timed in the ANOVA |
| Vocalic proportion, Dutch | %V | % | 42.3 | ±4.2 sd | p.25 | Stress-timed |
| Vocalic proportion, French | %V | % | 43.6 | ±4.5 sd | p.25 | Syllable-timed |
| Vocalic proportion, Spanish | %V | % | 43.8 | ±4.0 sd | p.25 | Syllable-timed |
| Vocalic proportion, Italian | %V | % | 45.2 | ±3.9 sd | p.25 | Syllable-timed |
| Vocalic proportion, Catalan | %V | % | 45.6 | ±5.4 sd | p.25 | Syllable-timed; highest %V of the non-Japanese set |
| Vocalic proportion, Japanese | %V | % | 53.1 | ±3.4 sd | p.25 | Mora-timed; isolated far from all others |
| Vocalic SD, English | ΔV | s | 0.0464 | ±0.0125 sd | p.25 | Highest ΔV; falling diphthongs plus vowel reduction |
| Vocalic SD, Polish | ΔV | s | 0.0251 | ±0.0067 sd | p.25 | Lowest ΔV; no vowel reduction, no length contrast |
| Vocalic SD, Dutch | ΔV | s | 0.0423 | ±0.0093 sd | p.25 | Vowel reduction plus contrastive vowel length |
| Vocalic SD, French | ΔV | s | 0.0378 | ±0.0121 sd | p.25 | Long nasal vowels |
| Vocalic SD, Spanish | ΔV | s | 0.0332 | ±0.0100 sd | p.25 | Second-lowest ΔV; no lengthening phenomena |
| Vocalic SD, Italian | ΔV | s | 0.0400 | ±0.0105 sd | p.25 | Context-conditioned vowel lengthening |
| Vocalic SD, Catalan | ΔV | s | 0.0368 | ±0.0144 sd | p.25 | Has vowel reduction despite Spanish-like syllable structure |
| Vocalic SD, Japanese | ΔV | s | 0.0402 | ±0.0058 sd | p.25 | Contrastive vowel length |
| Consonantal SD, English | ΔC | s | 0.0535 | ±0.0163 sd | p.25 | Highest ΔC; >15 syllable types |
| Consonantal SD, Polish | ΔC | s | 0.0514 | ±0.0118 sd | p.25 | High syllabic complexity |
| Consonantal SD, Dutch | ΔC | s | 0.0533 | ±0.0150 sd | p.25 | High syllabic complexity |
| Consonantal SD, French | ΔC | s | 0.0439 | ±0.0074 sd | p.25 | — |
| Consonantal SD, Spanish | ΔC | s | 0.0474 | ±0.0085 sd | p.25 | — |
| Consonantal SD, Italian | ΔC | s | 0.0481 | ±0.0089 sd | p.25 | — |
| Consonantal SD, Catalan | ΔC | s | 0.0452 | ±0.0086 sd | p.25 | — |
| Consonantal SD, Japanese | ΔC | s | 0.0356 | ±0.0074 sd | p.25 | Lowest ΔC; only 4 syllable types |

### Model and simulation parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Adult training-set size | — | sentences/language | 10 | — | p.10 | From 2 speakers |
| Adult test-set size | — | sentences/language | 10 | — | p.10 | From 2 different speakers |
| Human decision threshold, English/Japanese | %V | fraction | 0.46 | — | p.11 | Inferred from human classification scores |
| Chance level, adult simulation | — | % | 50 | — | p.26 | Two-alternative classification |
| Simulated infant subjects per pair | — | count | 40 | — | p.13-14 | 20 experimental, 20 control |
| Simulated subjects, groups experiment | — | count | 32 | — | p.15 | Matches Nazzi et al. (1998) |
| Habituation-phase sentences | — | count | 10 | — | p.13 | 2 speakers, random order |
| Test-phase sentences | — | count | 10 | — | p.13 | 2 new speakers, random order |
| Habituation/test switch step | n | step index | 10/11 | — | p.15 | Automatic, not criterion-based |
| Language pairs simulated | — | count | 26 | — | p.14 | All pairs among the 8 languages |
| Syllable types, English/Dutch/Polish | — | count | >15 | — | p.8 | Explains high ΔC, low %V |
| Syllable types, Japanese | — | count | 4 | — | p.8 | Explains low ΔC, high %V |

## Effect Sizes / Key Quantitative Results

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Rhythm-class effect on %V | ANOVA | significant | — | <0.001 | 160 sentences, 3 classes | p.8 |
| Rhythm-class effect on ΔC | ANOVA | significant | — | <0.001 | 160 sentences, 3 classes | p.8 |
| Rhythm-class effect on ΔV | ANOVA | not significant | — | ns | 160 sentences, 3 classes | p.8 |
| Pairwise class differences in %V | Tukey HSD | all 3 pairs differ | — | <0.001 each | post-hoc | p.8 |
| Pairwise class differences in ΔC | Tukey HSD | all 3 pairs differ | — | ≤0.001 | post-hoc | p.8 |
| English/Japanese, simulation test phase | hit rate | 90% | — | — | 20 test sentences | p.10 |
| English/Japanese, sets exchanged | hit rate | 95% | — | — | 20 test sentences | p.10 |
| English/Japanese, training-set fit | hit rate | 19/20 | — | — | 20 training sentences | p.10 |
| Human %V vs classification score (English) | linear R | 0.87 | — | <0.001 | 26 shared sentences | p.11 |
| Human test-phase performance | hit rate | 68% | — | — | Ramus & Mehler (1999) subjects | p.11 |
| Human score after 1st training session | hit rate | 62.5% | — | — | same subjects | p.11 |
| English/Polish with ΔV predictor | classification | 85% | — | — | logistic regression | p.16 |
| Dutch/Polish with ΔV predictor | classification | 87.5% | — | — | logistic regression | p.16 |
| English/Polish and Dutch/Polish arousal, ΔV | Mann-Whitney | discrimination predicted | — | <0.001 | 40 simulated subjects | p.16 |
| Groups-of-languages simulation | group main effect | significant | — | 0.01 | 32 simulated subjects | p.15 |

### Table 2: adult simulation, classification % on test sentences, predictor %V (p.26)

Chance = 50%. Asterisked cells are pairs where one of the two regressions failed to converge because %V completely separated the two languages on the training set (100% training classification); only the converging regression's score is reported.

| | English | Dutch | Polish | French | Italian | Catalan | Spanish |
|---|---|---|---|---|---|---|---|
| Dutch | 57.5 | | | | | | |
| Polish | 50 | 57.5 | | | | | |
| French | 60 | 60 | 65 | | | | |
| Italian | 65 | 62.5 | 65 | 55 | | | |
| Catalan | 65 | 62.5 | 65 | 57.5 | 35 | | |
| Spanish | 62.5 | 57.5 | 62.5 | 50 | 50 | 37.5 | |
| Japanese | 92.5 | 92.5 | 95* | 90 | 90 | 87.5 | 95* |

Rule observed: between-class scores are at least 60%, within-class scores below 60%; the one exception is Dutch/Spanish at 57.5% *(p.12)*. The Catalan/Italian (35%) and Catalan/Spanish (37.5%) scores do not indicate discrimination by mislabeling; they indicate the pairs are so close that speaker differences exceed language differences *(footnote 6, p.24)*.

### Table 3: behavioral discrimination in 2-5 day-old infants (p.27)

| Language pair | Discrimination | Stimuli | Reference |
|---------------|---------------|---------|-----------|
| French/Russian | Yes | Normal and filtered (400 Hz) | Mehler et al. (1988) |
| English/Italian | Yes | Normal | Mehler et al. (1988); reanalysis in Mehler & Christophe (1995) |
| English/Spanish | Yes | Normal | Moon et al. (1993) |
| English/Japanese | Yes | Filtered (400 Hz) | Nazzi et al. (1998) |
| English/Dutch | No | Filtered (400 Hz) | Nazzi et al. (1998) |
| Dutch/Japanese | Yes | Resynthesized | Ramus, in preparation |
| Spanish/Catalan | No | Resynthesized | Ramus, in preparation |
| English+Dutch vs. Spanish+Italian | Yes | Filtered (400 Hz) | Nazzi et al. (1998) |
| English+Spanish vs. Dutch+Italian, or English+Italian vs. Dutch+Spanish | No | Filtered (400 Hz) | Nazzi et al. (1998) |

Resynthesized stimuli preserve only broad phonotactics and prosody (Ramus & Mehler 1999).

### Table 4: infant simulation, Mann-Whitney p values over 40 subjects (p.28)

Boldface marks pairs with available behavioral data. An asterisk marks pairs where the control group's mean arousal exceeded the experimental group's, which means no discrimination is predicted despite a low two-tail p.

| | English | Dutch | Polish | French | Italian | Catalan | Spanish |
|---|---|---|---|---|---|---|---|
| Dutch | **p=0.18** | | | | | | |
| Polish | p=1 | p=0.84 | | | | | |
| French | p<0.001 | p=0.02 | p=0.18 | | | | |
| Italian | **p<0.001** | p=0.006 | p=0.02 | p=0.68* | | | |
| Catalan | p<0.001 | p<0.01 | p=0.007 | p=0.51 | p=0.04* | | |
| Spanish | **p=0.006** | p=0.21 | p=0.04 | p=0.97* | p=1 | **p=0.68*** | |
| Japanese | **p<0.001** | **p<0.001** | p<0.001 | p<0.001 | p<0.001 | p<0.001 | p<0.001 |

Four asterisked pairs (French/Italian, French/Spanish, Italian/Catalan, Catalan/Spanish) all involve close syllable-timed languages where between-speaker rhythm differences exceed between-language ones. Catalan/Italian even reaches two-tail significance in the wrong direction *(p.14)*.

## Methods & Implementation Details
- Segmentation was done by hand by the first author, using both auditory and visual cues in a sound editor *(p.7)*.
- The consonant/vowel distinction may vary across languages; the authors acknowledge a universal C/V segmentation is problematic and suggest the hypothesis should eventually be restated in terms of highs and lows in a universal sonority curve *(footnote 3, p.24)*.
- The claim "more syllable types means heavier syllables" relies on the assumption that a language's syllable inventory always starts from the simplest syllables (except V, which is not legal everywhere), an assumption backed by phonological theory *(footnote 2, p.24)*.
- Adult simulation: logistic regression finds the %V cut-off best separating the pair on the training half, then predicts on the test half. Run twice with halves exchanged and averaged, except where a regression fails to converge *(p.10-11, p.26)*.
- Infant simulation: no habituation criterion is used because the arousal-to-sucking link is not modeled; after 10 habituation sentences every simulated subject has the same prototype $P_{10}$, so no covariance correction is needed *(p.14, footnote 8 p.24)*.
- Individual subject variability is not modeled; subjects within a counterbalancing subgroup differ only in sentence order *(p.13)*.
- Only 20 sentences per language are available here versus 40 in Nazzi et al. (1998); this biases against detecting discrimination, and a forthcoming study showed newborn Dutch/Japanese discrimination with 20 sentences per language *(p.14)*.
- Mann-Whitney is used because no distributional hypothesis about arousal is available; the p values across pairs are directly comparable because every test uses the same data type and the same 40 subjects *(p.14)*.

## Figures of Interest
- **Fig 1 (p.30):** (%V, ΔC) plane with ±1 SE error bars. Three clusters: {EN ~40/0.054, DU ~42/0.053, PO ~41/0.051} top-left; {SP, FR, IT, CA} middle at %V 44-46, ΔC 0.044-0.048; JA alone at %V 53, ΔC 0.036. This is the projection that matches the standard rhythm classes. Visible empty space between Catalan and Japanese, and beyond Japanese, which the authors read as room for further classes *(p.17)*.
- **Fig 2 (p.31):** (%V, ΔV) plane. Polish drops far below everything else (ΔV ≈ 0.025) while remaining at low %V, separating it from English and Dutch. Japanese sits at ordinary ΔV (0.040) but extreme %V.
- **Fig 3 (p.32):** (ΔV, ΔC) plane. Polish is isolated at high ΔC with the lowest ΔV; Japanese isolated at low ΔC.
- **Fig 4 (p.33):** Human average classification score per sentence vs %V for the 26 shared English/Japanese sentences. English triangles fall along a clear negative regression line from ~0.88 at %V 0.34 down to ~0.38 at %V 0.50; Japanese circles cluster at %V 0.50-0.58 with no trend. The two language sets separate almost perfectly along %V near 0.46.
- **Fig 5 (p.34):** Simulated arousal for English/Japanese. Both groups decay to ~0.2 during habituation; at step 11 the experimental group jumps to ~1.8 and stays above 0.6 through step 20 while the control group stays near 0.2. Large discrimination effect.
- **Fig 6 (p.35):** English/Spanish. Curves overlap heavily; the experimental group runs slightly above control after the switch. Moderate effect.
- **Fig 7 (p.36):** Spanish/Italian. Curves are indistinguishable throughout. Null effect.

## Results Summary
- Languages ordered by %V come out ordered from most to least stress-timed *(p.8)*.
- %V and ΔC each show a significant rhythm-class effect (p < 0.001) with every class differing from the other two; ΔV shows none *(p.8)*.
- The (%V, ΔC) plane is where the standard three classes appear; ΔC and %V are negatively correlated because heavier syllables mean more consonants *(p.8)*.
- ΔV reflects a sum of independent phonological phenomena rather than a single rhythmic dimension, and its main contribution is to separate Polish from the other stress-timed languages *(p.8-9)*.
- The %V-based logistic regression reaches 90-95% on English/Japanese and reproduces the between-class vs within-class split for all 26 pairs *(p.10-12)*.
- The %V-based arousal model reproduces every available newborn result, including the negative results (English/Dutch, Spanish/Catalan), and the group-level result at p = 0.01 *(p.15)*.
- Only Polish/French and Spanish/Dutch fail to conform to the rhythm-class pattern, and no behavioral data contradicts them yet *(p.15)*.

## Limitations
- Only eight languages, all drawn from the set linguists used to propose the three classes; adding languages could either fill in the gaps and dissolve the clusters or reveal additional classes *(p.17)*.
- No infant experiment has ever demonstrated discrimination on rhythm alone; the stimuli always preserved other information. The rhythm hypothesis rests on the pattern across pairs, not on a single decisive experiment *(p.12)*.
- Infinitely many variables can be derived from interval durations, so fitting one that matches the behavioral pattern is weak evidence on its own. The defense is that %V is the most obvious derivable variable and that all three variables are phonologically interpretable *(p.16)*.
- The simulation is far more accurate than human subjects (90-95% vs 68%), so it may over-predict discriminable pairs *(p.11)*.
- Two-tail Mann-Whitney p values are misleading for the four pairs where the control group had higher arousal *(p.14)*.
- The consonant/vowel distinction is not truly universal *(footnote 3, p.24)*.
- The prototype is an unbounded running mean; a limited-memory model was not implemented *(footnote 7, p.24)*.
- Whether ΔV plays any role in rhythm perception is untested; the English/Polish and Dutch/Polish pairs it discriminates have never been run behaviorally *(p.9, p.16)*.

## Arguments Against Prior Work
- Isochrony theory (Abercrombie 1967; Pike 1945): interstress interval duration in English is directly proportional to the number of syllables contained (Bolinger 1965; Lea 1974; O'Connor 1965; Shen & Peterson 1962), so interstress intervals have no constant duration. Bolinger also showed the duration depends on syllable type and position in the utterance *(p.4)*.
- French has no isochronous syllables; rhythm is carried by larger units roughly the size of the phonological phrase, characterized by final lengthening (Wenk & Wiolland 1982) *(p.4)*.
- Spanish syllable duration is not constant; interstress intervals merely cluster around an average (Borzone de Manrique & Signorini 1983) *(p.4)*.
- Roach (1982), six languages: syllable-duration variation is similar in all six, and stress pulses are no more evenly spaced in the stress-timed group *(p.4)*.
- Dauer (1983): mean interstress duration is proportional to syllable count in every language analyzed; stresses recur no more regularly in English than elsewhere *(p.4)*.
- Against the purely phonological account (Dauer 1987): it is not implemented, so it cannot situate Polish or Catalan on the continuum, cannot say how much each feature contributes, and cannot say how features interact *(p.6)*.
- Against Dauer's conclusion that instrumental measurement should be abandoned: the right response is better measurements, not none *(p.6)*.
- Against den Os (1988) as a rhythm-only adult experiment: subjects were native speakers of one target language and were also given written transcriptions, so other cues were available *(p.10)*.
- Against the word-order/rhythm correlations of Donegan & Stampe (1983) (syllable-timed with Complement/Head and prefixing, stress-timed with Head/Complement and suffixing): they do not hold beyond the authors' own languages; see Auer (1993) for critique and Nespor, Guasti & Christophe (1996) for more plausible word-order cues *(p.18)*.
- Against the precursory "one representation unit per rhythm class" formulations (Cutler et al. 1983, 1986; Cutler & Otake 1994; Mehler et al. 1996): these should give way to the more general notion that each language has principles governing syllable structure, which rhythm helps set *(p.18)*.

## Design Rationale
- Rhythm must be definable without "syllable" or "stress" because neither has a general phonetic definition (Dauer 1987, pp. 447-448), and every prior study had to decide in advance where stresses fall. A newborn cannot know that in advance *(p.6)*.
- Vowel-centered perception is assumed following Mehler et al. (1996): vowels carry most of the energy, last longer than most consonants, are more stable, carry accent, and signal syllable strength. Newborns attend more to vowels (Bertoncini et al. 1988) and can count vowels/syllables independently of syllable structure or weight *(p.6-7)*.
- The target representation is the Time-Intensity Grid Representation (TIGRE) of Mehler et al. (1996): speech as a succession of vowels of variable duration and intensity alternating with unanalyzed noise *(p.7)*.
- %V rather than ΔC was chosen as the simulation predictor because it has lower variance and thus cleaner results, and it is consistent with the rhythm classes and their phonological interpretation *(p.10, p.16)*.
- Logistic regression models the adult task because that task is supervised (explicit L1/L2 categorization with training); the arousal/prototype model is used for infants because the infant task is unsupervised, with no external signal of category or of switch *(p.10, p.13)*.
- Arousal is used as the behavioral proxy rather than sucking rate, because the arousal-to-sucking mapping is assumed monotone and modeling it would add nothing *(p.13)*.
- Of every property proposed to connect with rhythm (vowel reduction, quantity contrasts, gemination, tone, vowel harmony, word accent, syllable structure), only syllable structure is judged reliable enough to guide acquisition *(p.18)*.

## Testable Properties
- %V and ΔC are negatively correlated across languages; a language with more syllable types must have higher ΔC and lower %V *(p.8)*.
- The three rhythm classes separate in the (%V, ΔC) plane but not in the (%V, ΔV) or (ΔV, ΔC) planes *(p.8, Figs 1-3)*.
- %V for a stress-timed language falls near 40-42%, syllable-timed near 44-46%, mora-timed near 53% *(p.25)*.
- ΔC for stress-timed languages exceeds 0.05 s; for Japanese it is 0.0356 s *(p.25)*.
- %C carries no information beyond %V; %C = 100 − %V *(footnote 5, p.24)*.
- A language exhibiting vowel reduction, contrastive vowel length, or context-conditioned vowel lengthening must have elevated ΔV; a language with none of these (Spanish, Polish) must have low ΔV *(p.8-9)*.
- Adult discrimination scores from a %V logistic regression exceed 60% between rhythm classes and fall below 60% within a class *(p.12)*.
- Human English/Japanese decisions behave as if thresholded at %V ≈ 0.46, with sentences further from the threshold classified more accurately *(p.11)*.
- In the arousal model, discrimination requires the experimental group's mean test-phase arousal to exceed the control group's; a reversed sign means no discrimination regardless of the two-tail p *(p.14)*.
- Mora-timed languages are (−Complex Onset, −Complex Coda); stress- and syllable-timed are (+Complex Onset, +Coda); stress-timed adds (+Complex Coda) *(p.18)*.

## Relevance to Project
For a formant/source-filter speech synthesizer, this paper is a specification for the temporal-organization layer rather than the source or filter.

- **A rhythm objective function.** %V, ΔV and ΔC are computable directly from the synthesizer's own segment durations, before any audio is rendered, because the synthesizer already knows which segments are vowels and which are consonants. That gives a cheap regression test: synthesize a target-language sentence, compute the three metrics from the duration plan, and check they land in the language's cell of Table 1. English output should sit near %V 40, ΔC 0.054; a duration model that drifts toward %V 46 is producing Romance-sounding timing.
- **The interval, not the phoneme, is the unit.** The metrics are computed over runs of consecutive vowels and runs of consecutive consonants, which maps cleanly onto a synthesizer's segment sequence and requires no syllabification. A duration model can therefore be tuned against these without committing to a syllable parser.
- **Concrete duration targets.** Table 1 gives eight languages of ground truth with standard deviations, usable as acceptance bands. The counts (roughly 320 intervals per language over 20 sentences) also indicate how much synthesized material is needed for a stable estimate.
- **The delexicalization recipe.** Ramus & Mehler's resynthesis (all consonants -> /s/, all vowels -> /a/, F0 constant at 230 Hz) is a ready-made perceptual test rig: run the synthesizer's prosody through it and any remaining discriminability is rhythm alone. That is a useful ablation for evaluating a prosody module independent of segmental quality.
- **Vowel reduction and length contrast are ΔV knobs.** The paper attributes ΔV to vowel reduction, contrastive length, context-conditioned lengthening, and intrinsically long vowels. A synthesizer implementing reduction rules can verify the rules are doing work by checking ΔV moves in the predicted direction.
- **What it does not provide.** No formant values, no source model, no filter coefficients, no F0 contours beyond the constants used in the stimulus recipes. The 16 kHz sampling and 400 Hz low-pass figures describe experimental stimuli, not synthesis parameters.

## Open Questions
- [ ] Does ΔV play any role in rhythm perception, or is it only a phonological descriptor? The English/Polish and Dutch/Polish discriminations it predicts have never been tested behaviorally *(p.9, p.16)*.
- [ ] Should the perceptual model use %V alone, ΔV alone, or a weighted combination? If combined, the weighting is a free parameter *(p.16)*.
- [ ] Are there three rhythm classes, five (Levelt & van de Vijver 1998; Auer 1993), or a continuum? Requires many more languages from unrelated families *(p.5, p.17)*.
- [ ] Are the Polish/French and Spanish/Dutch non-discrimination predictions an artifact of this corpus or a real property? *(p.15)*
- [ ] Would a sonority-curve formulation replace the consonant/vowel dichotomy for languages where that distinction is unclear? *(footnote 3, p.24)*
- [ ] Does a limited-memory prototype (last 10 sentences) change the infant simulation results? *(footnote 7, p.24)*

## Related Work Worth Reading
- Ramus, F., & Mehler, J. (1999). Language identification with suprasegmental cues: A study based on speech resynthesis. *JASA, 105*(1), 512-521. The resynthesis method and the only adult rhythm-only discrimination result.
- Nazzi, T., Bertoncini, J., & Mehler, J. (1998). Language discrimination by newborns: towards an understanding of the role of rhythm. *JEP:HPP, 24*(3), 756-766. Source corpus and the behavioral results being simulated.
- Dauer, R. M. (1983). Stress-timing and syllable-timing reanalyzed. *Journal of Phonetics, 11*, 51-62. The phonological account this paper implements.
- Dauer, R. (1987). Phonetic and phonological components of language rhythm. ICPhS XI, Tallinn. The continuum proposal and the "no general phonetic definition" argument.
- Mehler, J., Dupoux, E., Nazzi, T., & Dehaene-Lambertz, G. (1996). Coping with linguistic diversity: The infant's viewpoint. In *Signal to Syntax*, 101-116. Source of the TIGRE representation.
- Levelt, C., & van de Vijver, R. (1998). Syllable types in cross-linguistic and developmental grammars. The five-class markedness typology.
- Nespor, M. (1990). On the rhythm parameter in phonology. In *Logical issues in language acquisition*, 157-175. The Catalan/Polish intermediate-language argument.
- Auer, P. (1993). *Is a rhythm-based typology possible?* KontRI Working Paper 21. Alternative five-class typology and critique of rhythm/syntax correlations.
