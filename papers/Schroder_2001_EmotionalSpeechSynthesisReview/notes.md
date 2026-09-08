---
title: "Emotional Speech Synthesis: A Review"
authors: "Marc Schröder"
year: 2001
venue: "Eurospeech 2001 - Scandinavia (7th European Conference on Speech Communication and Technology), Aalborg, Denmark"
doi_url: "https://doi.org/10.21437/Eurospeech.2001-150"
pages: "4"
affiliation: "DFKI, Saarbrücken, Germany; Institute of Phonetics, University of the Saarland"
---

# Emotional Speech Synthesis: A Review

*(Page citations below use PDF page numbers p.1-p.4, matching `pngs/page-000.png` .. `pngs/page-003.png`.)*

## One-Sentence Summary
A four-page survey of a decade of emotional speech synthesis that groups systems by synthesis technique (formant, diphone concatenation, unit selection), tabulates one worked, numerically specified prosody-and-voice-quality rule set per emotion (joy, sadness, anger, fear, surprise, boredom) with its measured forced-choice recognition rate, and criticizes the field's de-facto forced-choice evaluation paradigm. *(p.1)*

## Problem Addressed
Intelligibility of synthetic speech now approaches human speech, so naturalness is the binding constraint, and the most conspicuously missing aspect of naturalness is emotional expressivity. *(p.1)* Attempts to add emotion have existed for more than a decade and have used very different approaches, techniques and underlying assumptions; no consolidated overview existed of what has been done, what prosody rules were used, or how results were evaluated. *(p.1)*

The paper is also framed against the two axes identified at the ISCA Workshop on Speech and Emotion (Northern Ireland, 2000) [1] along which understanding must improve: *(p.1)*
1. Description of the **vocal correlates** of emotions ("How is a given emotion expressed in speech?").
2. Description of the **emotional states themselves** [2] ("What are the properties of the emotional state to be expressed? What is the relation between this state and another state?").

## Key Contributions
- Groups the emotional-synthesis literature by synthesis technique, and argues that technique choice largely determines which emotion-relevant parameters are even controllable. *(p.1)*
- Names the core trade-off of the field: **flexibility of acoustic modelling versus perceived naturalness**. Formant synthesis gives wide parameter control but sounds "robot-like"; unit selection sounds most natural but exposes few controllable parameters. *(p.1, p.4)*
- Table 1: one successful, fully numeric modelling example per emotion (six emotions), each with study, language and forced-choice recognition rate against explicit chance level. *(p.3)*
- Survey of which parameter families each study models (global F0, tempo, loudness, voice quality, articulation precision, linguistic interactions). *(p.2)*
- Critique of the de-facto forced-choice evaluation standard and catalogue of alternative paradigms (free response, distractor categories, neutral-vs-emotional-prosody difference measure, audio-visual preference). *(p.3)*
- Forward agenda: move from a few extreme basic emotions to gradual/less intense states via a listener-oriented dimensional taxonomy (FEELTRACE [27]); account for language-specific linguistic-prosodic interactions; develop evaluation measuring naturalness given an emotion-defining context. *(p.3, p.4)*

## Study Design
Not an empirical study. This is a narrative literature review of roughly 30 references spanning ~1984-2000, with a comparative table of six prosody rule sets and their reported recognition rates drawn from four cited studies ([4], [6], [9], [10]). *(p.1, p.3)*

## Methodology
1. Partition the literature by synthesis technique: formant (rule-based), diphone concatenation, unit selection. *(p.1, p.2)*
2. For each technique, state which acoustic parameters it exposes, and which emotion-modelling strategies are therefore feasible. *(p.1, p.2)*
3. Report how prosody rules were obtained across studies, in three families: extracted from the literature; derived from the authors' own corpus analysis; obtained as perceptually optimal values by systematic parameter variation in synthesis. *(p.2)*
4. Present one successful modelling example per emotion in full numeric detail rather than an averaged summary across studies, because parameter sets are heterogeneous and not commensurable. *(p.2, p.3)*
5. Review evaluation paradigms and their information content. *(p.3)*

## Section-by-Section Content

### 1. Introduction *(p.1)*
- Emotional expressivity is the aspect of naturalness most obviously missing from synthetic speech; attempts to add it have gained popularity in recent years. *(p.1)*
- Advances in naturalness elsewhere (notably unit selection) have not carried over: "the synthesis of emotional speech still has a long way to go." *(p.1)*
- Structure: studies grouped by synthesis technique (which coincides in many cases with similarity in approach), then prosody rules, then evaluation paradigms, then future directions. *(p.1)*

### 2. Existing approaches and techniques *(p.1)*
Framing claim: modelling emotion in speech relies on parameters including F0 level, voice quality, and articulation precision, and **different synthesis techniques provide control over these parameters to very different degrees**. *(p.1)*

#### 2.1 Formant synthesis (rule-based) *(p.1)*
- Creates acoustic speech data entirely through rules on the acoustic correlates of the speech sounds; **no human speech recordings are involved at run time**. *(p.1)*
- Sounds relatively unnatural and "robot-like" compared to state-of-the-art concatenative systems. *(p.1)*
- But a large number of parameters related to **both voice source and vocal tract** can be varied quite freely; this is what makes it interesting for modelling emotional expressivity. *(p.1)*
- Larger undertakings using formant synthesis: [3][4][5][6][8][9]. *(p.1)*
- **Affect Editor** (Janet Cahn, 1989) [3][4] and **HAMLET** (Iain Murray et al.) [5][6] are the two earliest, both from 1989. *(p.1)*
  - Both use **DECtalk** as the formant synthesis engine, with dedicated processing modules that adapt their input according to the acoustic properties of a number of emotions. *(p.1)*
  - In both, the acoustic profile per emotion category was **derived from the literature and manually adapted**. *(p.1)*
  - Affect Editor requires manually annotated input; **HAMLET processes its input entirely by rule**. *(p.1)*
- **VAESS project** ("Voices, Attitudes and Emotions in Speech Synthesis"), ran 1994-1996: emotional expressivity added to a formant synthesiser. Montero et al. [7] report reasonable success modelling three emotions (hot anger, happiness, sadness) in **Spanish** using global prosodic and voice quality parameter settings. *(p.1)*
- **Burkhardt** (PhD 2000) [8][9] chose formant synthesis despite reduced naturalness, for flexibility and control. His systematic, perception-oriented method for finding good acoustic correlates of emotions for **German** has two steps: *(p.1, p.2)*
  1. Systematically vary **five acoustic parameters** known to relate to emotion, **without** using prior literature knowledge of the best values; present the resulting stimuli in a perception test; this yields **perceptually optimal parameter values** for each emotion studied. *(p.1)*
  2. Take those optimal values as the basis for exploring a **wider set of parameters** inspired by the literature; present the resulting variants in a second perception test. *(p.1, p.2)*

#### 2.2 Diphone concatenation *(p.2)*
- Concatenative synthesis concatenates recordings of a human speaker. Diphones run from the middle of one phone to the middle of the next. *(p.2)*
- Diphone recordings are usually made **with a monotonous pitch**; at synthesis time the required F0 contour is generated by signal processing, which introduces a certain amount of distortion, but the resulting quality is usually considered more natural than formant synthesis. *(p.2)*
- **Key limitation:** in most diphone systems only **F0 and duration (and possibly intensity)** can be controlled. It is usually **impossible to control voice quality**. *(p.2)*
- Therefore the fundamental question for diphone-based emotion synthesis: **are F0 and duration sufficient to express emotion, or is voice quality indispensable?** *(p.2)*
- The literature is genuinely split: [12][14][16][17][19][20] report emotions recognised at least reasonably well; **[13][15] report recognition rates close to chance level**. *(p.2)*
- Proposed resolution: there is no simple general answer. *(p.2)*
  - [16] reported that for a given speaker, the **relative contribution of prosody versus voice quality to emotion recognition depends on the emotion expressed**.
  - [17] found evidence that this may **additionally be speaker-dependent**.
  - I.e. there appear to be **speaker strategies** relying mostly on F0 and duration for some emotions; those can be successfully modelled with diphones. Whether this holds for all emotion types is not yet clear. *(p.2)*
- **Copy synthesis** approach, used by [12][13][14][16][17]: measure F0 and duration for each speech sound in a given utterance (usually an actor's portrayal of an emotion) and use those to synthesise the same utterance from diphones. Result: a synthetic utterance with the actor's F0 and duration but the **voice quality of the diphones**. *(p.2)*
  - Suited to modelling what humans do as closely as the parameter set allows.
  - **Criticism:** whether copying is the best route to *perceptually optimal, believable* expression is questionable. In animated characters it has been observed that features occurring in human expression need to be **exaggerated** in synthetic expression in order to be believable [26]. *(p.2)*
- More ambitious alternative: formulating explicit **prosody rules** for emotions [10][11][15][18][19][20]. *(p.2)*

#### 2.3 Unit selection *(p.2)*
- Also called large database synthesis or speech re-sequencing; often perceived as the most natural technique. Uses a large inventory (e.g. one hour of speech) instead of a minimal diphone inventory. *(p.2)*
- Units of variable size are selected to best approximate a target utterance defined by a number of parameters; these may be the same as in diphone synthesis (phoneme string, duration, F0) or different. *(p.2)*
- The **weights assigned to the selection parameters** determine which units are selected. If well-matching units are found, **no signal processing is necessary**. Quality is very natural when matches exist and **can be very bad when no appropriate units are found**. *(p.2)*
- **Iida et al. [21]** exploit unit selection's preservation of recorded-speech features: for each of three emotions (anger, joy, sadness) an **entire separate unit selection database** was recorded by the **same speaker**; to synthesise a given emotion, only units from the corresponding database are selected. Emotions are **well recognised (50-80%)**. *(p.2)*
- **Marumoto & Campbell [22]** attempt the theoretically more demanding route: select emotion-appropriate material from **one** database, using the equivalent of prosody rules as **selection criteria** (parameters related to voice quality and prosody as emotion-specific selection criteria). Result was a **partial success**: anger and sadness recognised with **up to 60% accuracy**, while **joy was not recognised above chance level**. *(p.2)*

### 3. Prosody rules employed *(p.2)*
- In the emotional-synthesis literature, global prosodic parameters are **often treated as universal or near-universal cues** for emotion. The paper flags this as debatable but notes limited supporting evidence, e.g. [23] (Korean) and [24] (English/Japanese comparison). *(p.2)*
- At least in **formant and time-domain synthesis**, prosody rules are at the heart of automatically generated emotional expressivity. *(p.2)*
- **Three ways rules have been obtained:** *(p.2)*

| Method of obtaining rules | Studies |
|---|---|
| Extracted from the literature | [4][6][15][19][20] |
| Own corpus analysis | [7][11][18][22] |
| Perceptually optimal values by systematic parameter variation in synthesis | [9][10] |

- **All studies agree** on the importance of **global prosodic settings**: F0 level and range, speech tempo, and eventually loudness. *(p.2)*
- Which studies model which additional parameter families: *(p.2)*

| Modelled phenomenon | Studies |
|---|---|
| Steepness of the F0 contour during rises and falls | [4][6][18][20] |
| Distinction between articulation rate and the number/duration of pauses | [4][6][16][18] |
| Voice quality | [4][6][9][15][18][19][22] |
| Articulation precision | [4][6][9][15] |
| Speech tempo of vowels vs consonants (linguistic-category interaction) | [6][15][20] |
| Speech tempo of stressed vs unstressed syllables | [6][9][20] |
| Placement of pauses within utterances | [4] |
| Influence of linguistic prosodic categories, e.g. F0 contours ("only rarely taken into account") | [9][11] |

- Linguistic prosodic categories such as F0 contour have been **shown to play an important role in emotion recognition** [9][11], yet are only rarely modelled. *(p.2)*
- Deliberate presentation choice: rather than a reduced summary across all studies, **one successful modelling example per emotion** is given in full, with its recognition rate (Table 1). *(p.2)*

### 4. Evaluation paradigms *(p.3)*
- There is a **de-facto standard**: a **forced-choice perception test** including the emotion categories actually modelled, using a **small number of semantically neutral carrier sentences**. Used by [4][7][9][11][12][13][14][15][16][17][21][22]. *(p.3)*
- **Criticism** ([25], p. 615, Banse & Scherer): a forced-choice test amounts to a **discrimination task rather than an identification task**, especially when the number of categories involved is small. *(p.3)*
- A forced-choice test provides **no information about stimulus quality** in terms of naturalness or believability. *(p.3)*
- Therefore many studies add, alongside forced-choice rating, an assessment of **naturalness, believability or overall preference**, often on a **five-point scale** [4][15][17][21]. Additionally assessed: **intensity of the emotion** [4]; **synthetic speech intelligibility** [21]. *(p.3)*
- **Advantages of forced choice:** relatively easy to carry out; gives a simple measure of recognition relative to chance level; allows a limited comparison between studies. *(p.3)*
- **Free response tests** [6][17]: especially suited to finding phenomena not expected by the experimenter. Responses are subsequently grouped into meaningful classes, which can be done using **validated word lists** [6]. *(p.3)*
- **Distractor paradigm** of Murray & Arnott [6], recently adopted by Stallo [20]: *(p.3)*
  1. Introduce a number of "distractor" response categories in the perception test, plus an "other" category.
  2. Use **both semantically neutral and semantically emotional texts**, each synthesised with **neutral** and with **emotional** prosody.
  3. Take the **difference in recognition** between the neutral-prosody version and the emotional-prosody version as the measure of the **perceptive impact of the prosody rules**.
  - **Finding:** the recognition *improvement* due to prosody was **bigger for emotional texts than for neutral texts**. *(p.3)*
- **Audio-visual paradigm** [20]: a talking head visually expressing emotion was presented with neutral and with emotional synthetic speech; subjects rated which version was more natural, more understandable, etc. **The version with emotional speech was clearly preferred.** *(p.3)*

### 5. Discussion *(p.3, p.4)*
- Emotional speech synthesis is **not yet applicable in many real life settings**; the paper lists structural reasons. *(p.3)*
- **Problem 1 - extreme categories.** Most studies model **between three and nine discrete, extreme emotional states**, under the often implicit assumption that expressing a few basic/primary categories matters most and other states can somehow be derived from them. Cowie [2] has questioned this, arguing systems should be able to express **less intense emotions**, which are more suitable for real-life applications. For a perception-oriented task such as emotional speech synthesis, a **listener-oriented taxonomy like the FEELTRACE dimensions** [27] may be a suitable starting point for describing non-extreme emotional states. *(p.3)*
- **Problem 2 - linguistic interaction and language specificity.** Beyond gradual global settings (F0 mean, overall tempo), **linguistic categories such as F0 contour affect emotion perception in interaction with other linguistic information like sentence type** [28], [29] (p. 8). Such effects are **most likely language-specific** and are **not yet appropriately accounted for** in emotional speech synthesis. *(p.3, p.4)*
- **Problem 3 - the flexibility/naturalness trade-off.** To express a large number of emotional states with a natural-sounding voice, either **rule-based techniques must become more natural-sounding** (see e.g. [30], joint estimation of voice source and vocal tract parameters) **or selection-based techniques must become more flexible** [22]. *(p.4)*
- **Problem 4 - evaluation.** Evaluation techniques should be developed that better assess the **appropriateness of acoustic parameter settings for a given communication situation**. Proposed direction: move **away from forced-choice tests using abstract emotion words**, toward tests **measuring the perceived naturalness of an utterance given an emotion-defining context**. *(p.4)*

## Key Equations / Statistical Models
The paper contains no equations. All quantitative content is in the Table 1 rule sets and the reported recognition rates. *(p.3)*

## Parameters

Table 1 (p.3) gives one successful rule set per emotion. **Two distinct numeric conventions appear and must not be mixed:**

- **Cahn [4] scale (Sadness, Surprise; American English):** parameter values run from **-10 to +10, with 0 = neutral**. These are Cahn's abstract scale steps, not percentages or Hz. The paper renders them in quotation marks.
- **Burkhardt [9] (Joy, Fear; German):** relative percentage changes, also in quotation marks.
- **Murray & Arnott [6] (Anger; British English):** absolute physical units (Hz, semitones, words per minute, dB, %).
- **Mozziconacci [10] (Boredom; Dutch):** absolute end frequency in Hz, excursion size in semitones, duration relative to neutral in %, plus intonation-pattern identifiers from a Dutch grammar of intonation (see [10] for pattern definitions).

### Joy — Burkhardt [9], German, recognition 81% (chance 1/9) *(p.3)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| F0 mean shift | F0 mean | % | +50 | — | 3 | Relative to neutral |
| F0 range scaling | F0 range | % | +100 | — | 3 | Relative to neutral |
| Speech tempo | Tempo | % | +30 | — | 3 | Relative to neutral |
| Voice quality | — | categorical | modal or tense | — | 3 | — |
| Lip-spreading feature | F1 / F2 | % | +10 | — | 3 | Both F1 and F2 raised 10%; formant-level articulatory correlate |
| Stressed-syllable pitch raise | — | % | +100 | — | 3 | "wave pitch contour model": main stressed syllables raised |
| Inter-stress syllable pitch lowering | — | % | -20 | — | 3 | Syllables between main stressed syllables lowered |

### Sadness — Cahn [4], American English, recognition 91% (chance 1/6) *(p.3)*
*All values on Cahn's -10..+10 scale, 0 = neutral.*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| F0 mean | F0 mean | Cahn scale | 0 | -10..+10 | 3 | — |
| Reference line | — | Cahn scale | -1 | -10..+10 | 3 | Baseline of F0 |
| Final lowering | — | Cahn scale | -5 | -10..+10 | 3 | "less final lowering" |
| F0 range | F0 range | Cahn scale | -5 | -10..+10 | 3 | — |
| Accent shape steepness | — | Cahn scale | +6 | -10..+10 | 3 | "steeper accent shape" |
| Tempo | Tempo | Cahn scale | -10 | -10..+10 | 3 | — |
| Fluent pauses | — | Cahn scale | +5 | -10..+10 | 3 | "more fluent pauses" |
| Hesitation pauses | — | Cahn scale | +10 | -10..+10 | 3 | — |
| Loudness | — | Cahn scale | -5 | -10..+10 | 3 | — |
| Breathiness | — | Cahn scale | +10 | -10..+10 | 3 | Voice quality |
| Brilliance | — | Cahn scale | -9 | -10..+10 | 3 | Voice quality; spectral tilt / high-frequency energy |
| Stress frequency | — | Cahn scale | +1 | -10..+10 | 3 | — |
| Precision of articulation | — | Cahn scale | -5 | -10..+10 | 3 | — |

### Anger — Murray & Arnott [6], British English, recognition rate not stated in Table 1 *(p.3)*
*Absolute physical units. Table 1's Rec. Rate cell is empty for this row.*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| F0 mean shift | F0 mean | Hz | +10 | — | 3 | Absolute offset |
| F0 range increase | F0 range | semitones | +9 | — | 3 | "s.t." = semitones |
| Speech tempo increase | Tempo | words per minute | +30 | — | 3 | "wpm" |
| Loudness increase | — | dB | +6 | — | 3 | — |
| Laryngealisation | — | % | +78 | — | 3 | Voice quality; creak |
| F4 frequency shift | F4 | Hz | -175 | — | 3 | Voice quality; fourth formant lowered |
| Pitch increase, secondary stressed vowels | — | % of pitch range | +10 | — | 3 | "2ary" |
| Pitch increase, primary stressed vowels | — | % of pitch range | +20 | — | 3 | "1ary" |
| Pitch increase, emphatic stressed vowels | — | % of pitch range | +40 | — | 3 | "emphatic" |

### Fear — Burkhardt [9], German, recognition 52% (chance 1/9) *(p.3)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| F0 mean shift | F0 mean | % | +150 | — | 3 | Relative to neutral |
| F0 range scaling | F0 range | % | +20 | — | 3 | Relative to neutral |
| Speech tempo | Tempo | % | +30 | — | 3 | Relative to neutral |
| Voice quality | — | categorical | falsetto | — | 3 | — |

### Surprise — Cahn [4], American English, recognition 44% (chance 1/6) *(p.3)*
*All values on Cahn's -10..+10 scale, 0 = neutral.*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| F0 mean | F0 mean | Cahn scale | 0 | -10..+10 | 3 | — |
| Reference line | — | Cahn scale | -8 | -10..+10 | 3 | — |
| F0 range | F0 range | Cahn scale | +8 | -10..+10 | 3 | — |
| Rising contour slope | — | Cahn scale | +10 | -10..+10 | 3 | "steeply rising contour slope" |
| Accent shape steepness | — | Cahn scale | +5 | -10..+10 | 3 | "steeper accent shape" |
| Tempo | Tempo | Cahn scale | +4 | -10..+10 | 3 | — |
| Fluent pauses | — | Cahn scale | -5 | -10..+10 | 3 | "less fluent pauses" |
| Hesitation pauses | — | Cahn scale | -10 | -10..+10 | 3 | — |
| Loudness | — | Cahn scale | +5 | -10..+10 | 3 | — |
| Brilliance | — | Cahn scale | -3 | -10..+10 | 3 | Voice quality |

### Boredom — Mozziconacci [10], Dutch, recognition 94% (chance 1/7) *(p.3)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| F0 end frequency | F0 mean | Hz | 65 | — | 3 | Male speech |
| F0 excursion size | F0 range | semitones | 4 | — | 3 | — |
| Duration relative to neutrality | Tempo | % | 150 | — | 3 | 150% of neutral duration, i.e. slower |
| Final intonation pattern | — | categorical | 3C | — | 3 | Dutch grammar of intonation; see [10] |
| Avoided final patterns | — | categorical | not 5&A, not 12 | — | 3 | Patterns 5&A and 12 must be avoided |

### Global parameter families named as universally agreed *(p.2)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| F0 level | F0 mean | Hz or % | — | — | 2 | All studies agree on its importance |
| F0 range | — | semitones or % | — | — | 2 | All studies agree on its importance |
| Speech tempo | — | wpm or % | — | — | 2 | All studies agree on its importance |
| Loudness | — | dB or scale | — | — | 2 | "eventually loudness" — agreed but weaker |
| Voice quality | — | categorical/% | — | — | 1, 2 | Modelled by [4][6][9][15][18][19][22]; uncontrollable in most diphone systems |
| Articulation precision | — | scale | — | — | 1, 2 | Modelled by [4][6][9][15] |

### Burkhardt's method parameters *(p.1)*

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Acoustic parameters varied in step 1 | — | count | 5 | — | 1 | Varied without prior literature values; perception test yields optima |

## Effect Sizes / Key Quantitative Results

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Joy recognition | forced-choice accuracy | 81% | — | — | Burkhardt [9], German, formant synthesis, chance = 1/9 = 11.1% | 3 |
| Sadness recognition | forced-choice accuracy | 91% | — | — | Cahn [4], American English, DECtalk formant synthesis, chance = 1/6 = 16.7% | 3 |
| Anger recognition | forced-choice accuracy | not reported in Table 1 | — | — | Murray & Arnott [6], British English, HAMLET/DECtalk | 3 |
| Fear recognition | forced-choice accuracy | 52% | — | — | Burkhardt [9], German, formant synthesis, chance = 1/9 = 11.1% | 3 |
| Surprise recognition | forced-choice accuracy | 44% | — | — | Cahn [4], American English, chance = 1/6 = 16.7% | 3 |
| Boredom recognition | forced-choice accuracy | 94% | — | — | Mozziconacci [10], Dutch, chance = 1/7 = 14.3% | 3 |
| Emotion recognition, per-emotion unit selection databases | forced-choice accuracy | 50-80% | — | — | Iida et al. [21], three emotions (anger, joy, sadness), one database per emotion, same speaker | 2 |
| Anger and sadness, single-database emotion-criteria selection | forced-choice accuracy | up to 60% | — | — | Marumoto & Campbell [22], selection criteria from prosody + voice quality | 2 |
| Joy, single-database emotion-criteria selection | forced-choice accuracy | not above chance | — | — | Marumoto & Campbell [22] | 2 |
| Diphone emotion recognition, positive results | qualitative | "at least reasonably well" | — | — | [12][14][16][17][19][20] | 2 |
| Diphone emotion recognition, negative results | qualitative | close to chance level | — | — | [13][15] | 2 |
| Prosody-driven recognition improvement | difference in recognition, emotional vs neutral prosody | larger for semantically emotional texts than for neutral texts | — | — | Murray & Arnott [6] distractor paradigm, adopted by Stallo [20] | 3 |
| Audio-visual naturalness preference | subjective preference | emotional speech "clearly preferred" over neutral | — | — | Stallo [20], talking head with emotional visual expression | 3 |
| Number of emotional states modelled per study | count | 3 to 9 | — | — | Typical across surveyed studies | 3 |

## Methods & Implementation Details
- **DECtalk as substrate.** Both Affect Editor [3][4] and HAMLET [5][6] wrap DECtalk with a preprocessing module that rewrites the input according to the target emotion's acoustic profile. Emotion control is therefore a **transformation layer over an existing formant synthesiser's parameter set**, not a redesign of the synthesiser. *(p.1)*
- **Rule provenance matters.** Rules derived from the literature and manually adapted [3][4][5][6] differ in character from rules obtained by perception-test optimisation [9][10]; the latter yield perceptually optimal rather than descriptively faithful values. *(p.1, p.2)*
- **Two-stage perceptual optimisation** (Burkhardt): stage 1 varies five parameters blind to literature values and finds optima by perception test; stage 2 expands the parameter set using literature inspiration and runs a second perception test on the variants. *(p.1, p.2)*
- **Copy synthesis pipeline:** measure per-phone F0 and duration from an actor's emotional portrayal, then resynthesise the identical utterance from diphones with those values. Voice quality is inherited from the diphone inventory and is uncontrolled. *(p.2)*
- **Exaggeration principle:** human-measured expression values may need amplification to be believable in synthesis, evidenced from the animated-character domain [26]. This argues against naive copy synthesis as an optimality target. *(p.2)*
- **Unit selection with per-emotion databases:** record one full database per emotion with the same speaker; constrain selection to the matching database. No signal processing needed when units match. *(p.2)*
- **Unit selection with emotion selection criteria:** encode prosody-rule equivalents as target-cost/selection criteria over voice quality and prosody features within a single database. *(p.2)*
- **Evaluation protocol (de-facto standard):** forced choice over the modelled emotion categories, using a small set of semantically neutral carrier sentences; optionally add a five-point naturalness/believability/preference scale, emotion-intensity rating, and intelligibility measurement. *(p.3)*
- **Distractor protocol:** add distractor categories plus "other"; cross semantically neutral vs emotional text with neutral vs emotional prosody; measure the prosody-attributable recognition delta. *(p.3)*

## Figures of Interest
- **Table 1 (p.3):** "Examples of successful prosody rules for emotion expression in synthetic speech." Six rows (Joy, Sadness, Anger, Fear, Surprise, Boredom). Each row's left cell carries emotion, study reference, language, and recognition rate with chance level in parentheses; the right cell carries the full parameter setting list. The caption states explicitly that recognition rates are presented with chance level for comparison, that Cahn's Sadness and Surprise values use a -10..+10 scale with 0 neutral, and that Mozziconacci's Boredom intonation patterns follow a Dutch grammar of intonation (details in [10]).
- No other figures. The paper has no plots.

## Results Summary
- Formant synthesis remains the technique of choice where wide acoustic control is needed, at a cost in naturalness. *(p.1)*
- Diphone synthesis can express some emotions well but not reliably, and the split in reported results is explained by emotion-dependent and speaker-dependent variation in how much work prosody does relative to voice quality. *(p.2)*
- Unit selection produces the most natural signal and, with per-emotion databases, 50-80% recognition; the flexible single-database variant only partially works, failing on joy. *(p.2)*
- Recognition rates for the six tabulated rule sets range from 44% (surprise) to 94% (boredom), all well above their stated chance levels of 11-17%. *(p.3)*
- Fear and surprise are the weakest of the tabulated cases; sadness, joy and boredom the strongest. *(p.3)*
- Emotional prosody improves recognition more on semantically emotional texts than on neutral ones, and is clearly preferred in audio-visual presentation. *(p.3)*

## Limitations
- **The review's own scope:** it presents one successful example per emotion rather than a systematic meta-analysis, explicitly because parameter sets across studies are not commensurable. *(p.2)*
- **Universality assumption is unverified.** Treating global prosodic parameters as universal or near-universal cues "can certainly be the subject of debate"; support is described as limited [23][24]. *(p.2)*
- **Recognition rates are not comparable across studies** except loosely, because chance levels, languages, category sets and synthesis techniques differ; forced choice only "allows a limited comparison between studies." *(p.3)*
- **Forced choice measures discrimination, not identification** [25], and says nothing about naturalness or believability. *(p.3)*
- **Only extreme emotions are modelled**, typically 3-9 discrete categories; less intense, real-life states are not covered. *(p.3)*
- **Language-specific linguistic-prosodic interactions are not accounted for.** *(p.3, p.4)*
- **Emotional speech synthesis is not yet applicable in many real life settings.** *(p.3)*
- **Voice quality is uncontrollable in most diphone systems**, capping what that technique can express. *(p.2)*
- **Unit selection quality is brittle:** very natural when matching units exist, "very bad when no appropriate units are found." *(p.2)*
- Anger's recognition rate is simply absent from Table 1. *(p.3)*

## Arguments Against Prior Work
- **Against forced-choice evaluation** (citing Banse & Scherer [25], p. 615): with few categories it degenerates into a discrimination task rather than identification, and yields no information about naturalness or believability of the stimulus. *(p.3)*
- **Against copy synthesis as the optimality target:** copying human F0 and duration models what humans do, but perceptually optimal and believable synthetic expression may require exaggeration relative to human values, as observed for animated characters [26]. *(p.2)*
- **Against the "basic emotions suffice" assumption:** Cowie [2] argues systems must express less intense emotions for real-life applications; deriving other states from a handful of primary categories is an often-implicit and questionable assumption. *(p.3)*
- **Against literature-derived acoustic profiles:** Burkhardt's design deliberately withholds prior literature values in step 1 to avoid inheriting their bias, finding perceptual optima instead. *(p.1)*
- **Against ignoring linguistic prosodic categories:** F0 contour and sentence-type interactions have demonstrated effects on emotion recognition [9][11][28][29] but are "only rarely taken into account" and "not yet appropriately accounted for." *(p.2, p.3, p.4)*
- **Against reading the split diphone results as a single answer:** the contradiction between [12][14][16][17][19][20] and [13][15] is attributed to emotion-dependence [16] and speaker-dependence [17] rather than to one side being wrong. *(p.2)*

## Design Rationale
- **Why formant synthesis despite worse naturalness:** it exposes a large number of both voice-source and vocal-tract parameters that can be varied freely, which is precisely what emotion modelling needs; Burkhardt chose it explicitly on these grounds. *(p.1)*
- **Why per-emotion unit selection databases:** unit selection preserves the recorded speaker's features very well, so recording a separate database per emotion transfers the emotion wholesale rather than trying to impose it by signal processing. *(p.2)*
- **Why single-database emotion selection criteria are "theoretically more demanding":** they require encoding what a prosody rule expresses as a unit-selection cost, i.e. converting generative rules into retrieval criteria. *(p.2)*
- **Why present one example per emotion rather than an average:** parameter conventions, languages and scales differ so much across studies that averaging would destroy information; a fully specified working example is reproducible while a summary is not. *(p.2)*
- **Why a dimensional taxonomy for future work:** for a perception-oriented task, a listener-oriented taxonomy such as FEELTRACE [27] describes non-extreme states that category systems cannot. *(p.3)*
- **Why the two escape routes from the trade-off are exclusive alternatives:** either rule-based synthesis becomes more natural-sounding (e.g. via joint voice-source/vocal-tract parameter estimation [30]) or selection-based synthesis becomes more flexible [22]. *(p.4)*
- **Why evaluation should move to context-based naturalness:** appropriateness of acoustic settings for a communication situation is the actual engineering target, and abstract emotion-word forced choice does not measure it. *(p.4)*

## Testable Properties
- Formant-synthesis emotion rules can achieve forced-choice recognition far above chance: 81% joy and 52% fear against 11.1% chance in German [9]; 91% sadness and 44% surprise against 16.7% chance in American English [4]. *(p.3)*
- Boredom in Dutch reaches 94% against 14.3% chance using only F0 end frequency, excursion size, relative duration, and final intonation pattern selection. *(p.3)*
- Joy requires F0 mean +50% and F0 range +100% simultaneously with tempo +30%; range change is twice the mean change. *(p.3)*
- Fear requires a much larger F0 mean shift (+150%) than joy (+50%) but a much smaller range increase (+20% vs +100%). Mean and range move independently across emotions. *(p.3)*
- Sadness and surprise have F0 mean 0 on Cahn's scale but opposite reference lines (-1 vs -8) and opposite ranges (-5 vs +8). F0 mean alone does not separate them. *(p.3)*
- Sadness and surprise take opposite signs on loudness (-5 vs +5), tempo (-10 vs +4), fluent pauses (+5 vs -5) and hesitation pauses (+10 vs -10). *(p.3)*
- Brilliance is negative for both sadness (-9) and surprise (-3), so brilliance does not distinguish them. *(p.3)*
- Anger requires laryngealisation at +78% and F4 lowered by 175 Hz; voice-quality manipulation is load-bearing, not decorative. *(p.3)*
- Anger's stressed-vowel pitch increase is monotonic in stress level: secondary +10%, primary +20%, emphatic +40% of pitch range. *(p.3)*
- Joy's stressed/unstressed alternation is signed opposite: stressed syllables +100%, intervening syllables -20%. *(p.3)*
- Boredom's duration is 150% of neutral, i.e. slowing is a required correlate. *(p.3)*
- Boredom is pattern-sensitive: final intonation pattern 3C must be used and patterns 5&A and 12 must be avoided, so intonation-contour identity, not just global F0 statistics, carries the emotion. *(p.3)*
- In unit selection with one database per emotion, recognition falls in 50-80% for anger, joy and sadness [21]. *(p.2)*
- Selecting emotion-appropriate units from a single database yields up to 60% for anger and sadness but chance-level for joy [22], so the technique's success is emotion-dependent. *(p.2)*
- With F0 and duration alone (diphone systems, no voice-quality control), some emotions are recognised well and others near chance, and which is which depends on both emotion and speaker [16][17]. *(p.2)*
- Adding emotional prosody raises recognition more on semantically emotional text than on semantically neutral text [6][20]. *(p.3)*
- Listeners prefer a talking head paired with emotional synthetic speech over the same head with neutral synthetic speech on naturalness and understandability [20]. *(p.3)*
- Modelled emotion inventories in the surveyed literature contain between 3 and 9 categories. *(p.3)*

## Relevance to Project
This is a directly usable specification source for adding rule-based emotion control to a formant/source-filter synthesiser.

- **The technique argument favours this project's architecture.** The review's central trade-off says formant synthesis is the technique that actually exposes the parameters emotion needs, both voice source and vocal tract. A Klatt-style synthesiser has exactly the control surface the review says is required, and the naturalness penalty it names is the known cost. *(p.1)*
- **Table 1 is six ready-to-implement rule sets** with published recognition rates as acceptance targets. The joy, fear and anger rows map onto parameters a Klatt-style engine already has: F0 mean, F0 range, speaking rate, F1/F2 shifts, F4 frequency, laryngealisation/creak amount, and a modal/tense/falsetto voice-quality switch. *(p.3)*
- **Cahn's -10..+10 abstract scale needs a mapping layer** before the sadness and surprise rows can be used. The scale steps have no physical units in this paper; implementing them requires reading Cahn [4] directly, or reinterpreting the signs and relative magnitudes as directions for locally defined parameter ranges. Flag this as a decision, not a lookup.
- **Voice-quality parameters are the differentiator.** Breathiness, brilliance (spectral tilt), laryngealisation, tense/modal/falsetto and F4 shifts appear across the anger, sadness, joy and fear rows. A source model with open-quotient, spectral-tilt and aspiration-noise controls covers most of these; F4 shift and F1/F2 lip-spreading are vocal-tract-side and need formant-frequency offsets applied per emotion.
- **Two structural levels of rule.** Every rule set has (a) global settings (F0 mean, F0 range, tempo, loudness, voice quality) and (b) local, linguistically anchored settings (stressed vs unstressed syllable pitch, accent-shape steepness, pause type and count, final intonation pattern). Emotion control therefore has to hook both a global parameter layer and the prosody/intonation generator, not just a post-hoc F0 scaler.
- **The exaggeration finding is an engineering hint:** measured human values may underperform perceptually; expose emotion intensity as a scaling knob over the rule deltas rather than hard-coding measured values. *(p.2)*
- **Evaluation guidance.** If the project measures emotion synthesis, the review argues for reporting chance level alongside accuracy, adding distractor and "other" categories, crossing neutral vs emotional text with neutral vs emotional prosody, and adding a naturalness scale rather than reporting forced-choice accuracy alone. *(p.3)*
- **Dimensional control as the forward path.** The companion paper already in the collection (`Schroder_2001_AcousticCorrelatesEmotionDimensions`, `papers/Schroder_2001_AcousticCorrelatesEmotionDimensions/notes.md`) supplies the continuous activation/evaluation/power mapping that this review only points to via FEELTRACE [27]. Read the two together: this one gives discrete, high-recognition presets; the companion gives the continuous interpolation surface. Discrete presets are the better first implementation because they come with measured recognition rates.
- **Language caveat.** The tabulated rule sets come from German, American English, British English and Dutch. The review states that linguistic-prosodic interactions are most likely language-specific, so cross-applying, e.g., the Dutch boredom intonation-pattern rule to English is unsupported. *(p.3, p.4)*

## Open Questions
- [ ] What are the physical units behind Cahn's -10..+10 scale steps for reference line, accent shape, brilliance, breathiness, stress frequency and articulation precision? Requires Cahn [4] or [3].
- [ ] What are Dutch intonation patterns 3C, 5&A and 12 in the grammar Mozziconacci [10] uses, and is there an English equivalent?
- [ ] What recognition rate did Murray & Arnott's anger rule set actually achieve? Table 1 omits it.
- [ ] Are Burkhardt's joy percentages (+50% F0 mean, +100% F0 range) relative to a Hz baseline or a semitone baseline? The sign and magnitude behaviour differs sharply between the two.
- [ ] Which five acoustic parameters did Burkhardt vary in step 1 of his two-stage method? Not named here.
- [ ] Fear's +150% F0 mean is far larger than any other tabulated shift; is this a percentage of the neutral F0 in Hz, and does it still only reach 52% recognition because the value is too extreme?
- [ ] Does the emotion- and speaker-dependence of the prosody-versus-voice-quality contribution [16][17] have a published per-emotion breakdown?
- [ ] Does "brilliance" in Cahn's system correspond to spectral tilt, high-frequency energy, or a DECtalk-specific composite parameter?

## Related Work Worth Reading
- **Burkhardt & Sendlmeier [9]**, "Verification of Acoustical Correlates of Emotional Speech using Formant-Synthesis", ISCA Workshop on Speech & Emotion 2000, pp. 151-156 — the source of the joy and fear rule sets and of the two-stage perceptual-optimisation method. Highest priority for a formant-synthesis project.
- **Cahn [4]**, "The Generation of Affect in Synthesized Speech", J. American Voice I/O Society 8, July 1990, pp. 1-19 — source of the sadness and surprise rule sets and of the -10..+10 parameter scale that must be decoded before use. Master's thesis version is [3] (MIT, 1989).
- **Murray & Arnott [6]**, "Implementation and testing of a system for producing emotion-by-rule in synthetic speech", Speech Communication 16, pp. 369-390 — HAMLET; source of the anger rule set in absolute physical units and of the distractor evaluation paradigm.
- **Mozziconacci [10]**, "Speech Variability and Emotion: Production and Perception", PhD Thesis, TU Eindhoven, 1998 — source of the boredom rule set and of the Dutch intonation-pattern grammar; the highest recognition rate in Table 1 (94%).
- **Banse & Scherer [25]**, "Acoustic Profiles in Vocal Emotion Expression", J. Personality and Social Psychology 70(3), 1996, pp. 614-636 — the acoustic-profile reference and the source of the forced-choice critique.
- **Kasuya, Maekawa & Kiritani [30]**, "Joint Estimation of Voice Source and Vocal Tract Parameters as Applied to the Study of Voice Source Dynamics", ICPhS 99, pp. 2505-2512 — named as the route to making rule-based synthesis more natural-sounding.
- **Cowie et al. [27]**, "FEELTRACE: An Instrument for Recording Perceived Emotion in Real Time", ISCA Workshop 2000, pp. 19-24 — the dimensional taxonomy the paper recommends for non-extreme states.
- **Cowie [2]**, "Describing the Emotional States Expressed in Speech", ISCA Workshop 2000, pp. 11-18 — the argument against modelling only extreme basic categories.
- **Bates [26]**, "The Role of Emotion in Believable Agents", CACM 37, 1994, pp. 122-125 — the exaggeration principle.
- **Scherer, Ladd & Silverman [28]**, "Vocal cues to speaker affect: Testing two models", JASA 76(5), 1984, pp. 1346-1356 — F0 contour and sentence-type interaction.
