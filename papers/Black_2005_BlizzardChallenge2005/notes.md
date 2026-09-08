---
title: "The Blizzard Challenge – 2005: Evaluating corpus-based speech synthesis on common datasets"
authors: "Alan W Black, Keiichi Tokuda"
year: 2005
venue: "Interspeech 2005, Lisbon, Portugal"
doi_url: "https://doi.org/10.21437/Interspeech.2005-72"
pages: 4
affiliations: "Language Technologies Institute, Carnegie Mellon University (Black); Dept. of Computer Science & Engineering, Nagoya Institute of Technology (Tokuda)"
funding: "US National Science Foundation grant 0219687, 'Evaluation and Personalization of Synthetic Voices'"
---

# The Blizzard Challenge – 2005: Evaluating corpus-based speech synthesis on common datasets

## One-Sentence Summary
This is the design document for the first Blizzard Challenge: it specifies a reusable evaluation protocol for speech synthesis in which every participant builds voices from an identical released corpus (CMU ARCTIC), synthesizes an identical 250-sentence test set spanning five text genres, and is scored by three distinct listener populations over the web using MOS (1–5) for three genres and typed-transcription intelligibility for two. *(p.1)*

## Problem Addressed
Speech synthesis, unlike speech recognition, had no common dataset, no well-defined evaluation metric, and no centrally funded community targeted at the same task. *(p.1)* Corpus-based synthesis made this worse: systems were tuned to the particular datasets their own group had collected, so a comparison of labeling, pruning, join-cost, or signal-processing techniques was confounded by the quality of the underlying recorded voice. *(p.1)* Black and Tokuda argue you cannot attribute quality differences to technique unless the data is held constant. *(p.1)*

## Key Contributions
- A **common-dataset protocol**: freely available single-speaker CMU ARCTIC databases released to all participants, removing data variability as a confound. *(p.1)*
- A **five-genre test-set design** (novels, news, conversation, phonetically confusable sentences, semantically unpredictable sentences) that separates naturalness/preference testing from intelligibility testing. *(p.2)*
- A **three-population listener design** (speech experts, web volunteers, paid US undergraduates) intended to test both synthesis quality and the internal consistency of each listener group. *(p.3)*
- A **web-delivered listening-test infrastructure**, with an explicit accounting of the tradeoff between environmental noise/uncontrolled conditions and reach (200–300 listeners). *(p.3)*
- A **timed voice-building condition**: two corpora released long in advance, two released simultaneously with the test sentences, testing how quickly a group can build a voice, not just how well. *(p.1, p.3)*
- A **natural-speech topline**: the original ARCTIC speakers were re-recorded reading the 250 test sentences and entered as an additional "participant." *(p.3)*
- **Anonymized reporting**: teams identified only by letter, so a bad result cannot damage a commercial participant. *(p.4)*

## Study Design

- **Type:** Community evaluation campaign / multi-site listening-test study. This paper reports the *protocol*; the numerical results are reported separately in Bennett [14]. *(p.4)*
- **Systems under test:** 6 participants, spanning 3 continents, including universities and one commercial company; plus 1 natural-speech "team" (Team Studio, the original ARCTIC speakers). *(p.3)* Initially ~8 potential participants; one commercial entrant was bought and withdrew, another commercial entrant was worried about publication of results. *(p.2)*
- **Training data (the common dataset):** 4 CMU ARCTIC single-speaker databases — **bdl** (male US English), **slt** (female US English), **rms** (male), **clb** (female). *(p.1)* **awb** (male Scottish English) and **jmk** (male Canadian English) were deliberately excluded from the Challenge because their dialects are non-standard. *(p.1)*
- **Release schedule:** bdl and slt available from the original call for participation, **June 2004**. rms and clb released **15 January 2005**, simultaneously with the test sentence texts. *(p.1)* rms had actually been recorded in summer 2004; clb was recorded the week immediately prior to release. *(p.1)*
- **Test material:** 5 genres × 50 sentences = **250 test sentences**, distributed 15 January 2005 together with Festival-style utterance structures for each sentence. *(p.2)*
- **Build window:** one week nominally allowed to build the two new voices and synthesize the 250 test sentences; the return deadline was allowed to slip to a **second week**. *(p.3)*
- **Listener populations:** three groups — speech experts (10 required from each participating site), web volunteers, and paid US-English-speaking undergraduates. *(p.3)*
- **Primary endpoints:** MOS (1–5) for novels, news, conversation; typed-transcription accuracy for phonetically confusable sentences and SUS. *(p.2)*
- **Per-listener load:** 5 tests (one per genre), each test = 20 sentences, so 100 stimuli per listener. Total session time **30–45 minutes**. *(p.3)*
- **Coverage target:** 10 listeners per sample; target of 200–300 listeners overall; target of 100 undergraduates. *(p.3)*
- **Achieved coverage:** 100 utterances of each entry were listened to by **10 or more listeners**. *(p.4)*

## Methodology

### The common dataset (CMU ARCTIC)

- ~**1200 phonetically-balanced utterances** per speaker. *(p.1, p.2)*
- Text selected from **novels from Project Gutenberg** (out-of-copyright). *(p.2)*
- Selection "niceness" criteria: sentences must be easy to read, **length restricted to 5–15 words**, and **all words already present in CMUDICT**. *(p.2)*
- Selection algorithm: sentences meeting the niceness criteria were synthesized as phoneme strings and sentences were **greedily selected for maximum diphone coverage**. *(p.2)*
- The greedy selection was run **twice**, producing an **A set and a B set of ~600 utterances each**, each independently phonetically balanced. *(p.2)*
- Recording conditions: **16 kHz, 16 bit, studio quality**, with an **electroglottograph (EGG) track** included. *(p.2)*
- Distributed build: a baseline build using the public **FestVox** tools [8], including phonetic labels from **CMUDICT** [9] and **forced alignment using speaker-specific HMM acoustic models trained with SphinxTrain** [10]. Labels delivered as a **Festival Utterance structure** (heterogeneous relation graph) [11]. Participants were not required to use this extra information. *(p.2)*

### The five test genres *(p.2)*

1. **novels** — text from the same stories (but different text) from which the ARCTIC databases were built, i.e. an explicitly **in-domain** condition. Examples: "Joe Garland lives like a good fellow."; "But we made no collections of eggs."
2. **news** — standard press-wire news stories. Example: "The two countries agreed to resolve any conflict through diplomacy and avoid the use of force, the agency Interfax said."
3. **conversation** — utterances taken from the *human* side of a spoken dialog system, to approximate spoken-dialog usage. Produced some unusual utterances quite unlike standard TTS text. Examples: "Okay I would like to go to Miami, Florida."; "Yeah I guess it will and something downtown please."
4. **phonetically confusable sentences** — following the DRT and MRT tradition [12], but with the confusable words embedded in **carrier phrases** rather than presented in isolation. Rationale: isolated-word tests are inappropriate for unit-selection synthesis because different units will be selected in isolation than intra-sententially. Examples: "Now we will say cold again."; "Now we will say pace again."
5. **semantically unpredictable sentences (SUS)** — following Benoit, Grice and Hazan [13], generated from the grammatical template **det adj noun verb det adj noun** with randomly chosen medium-frequency words. These are hard to understand and remember even when spoken by humans. Examples: "The unsure steaks overcame the zippy rudder."; "The dank geniuses woke the humane emptiness."

Text was deliberately kept simple, free of numbers and symbols, so the challenge would **not become a text-analysis exercise**. *(p.2)*

**Independence control:** the actual example sentences were generated by **Prof. Richard Sproat (UIUC)**, deliberately outside the organizing teams, since the organizers' own teams were also participating. *(p.2)*

### Listening test procedure *(p.3)*

1. All tests delivered **over the web**, from the Blizzard homepage [2].
2. Five tests per listener, one per genre.
3. Each test = **20 different utterances**, each synthesized by one voice, but with the **synthesizer randomly ordered** across the 20 (so a listener does not hear a run from one system).
4. The 20 sentences are **randomly chosen per listener** from the 50 submitted for that genre; listening to all 50 would require too many resources.
5. Each sample presented **singly** and had to be **rated before proceeding** to the next sample. Explicit rationale: to stop people changing their minds. Acknowledged cost: listeners' scaling was still settling during the first few examples. *(p.3)*
6. Genres 1–3 rated as **MOS on a 1–5 scale**. Genres 4–5 required the listener to **type in what they heard**, so intelligibility is measured on the task rather than on preference. *(p.2)*
7. Tests could be **suspended and resumed later**, though listeners were encouraged to complete in one sitting.
8. Listeners were asked to listen in a quiet room, with **no guarantee** that they did.

### The three listener groups *(p.3)*

| Group | Recruitment | Compensation | Behavior observed |
|---|---|---|---|
| **speech experts** | Mandatory: each participant site had to supply 10 local speech experts | none stated | Most eager and most conscientious in completing tests |
| **volunteers** | Advertised through mailing lists and web pages; "random" users; did include some speech and speech-synthesis experts | none | "More random"; some did well, some never completed |
| **US undergraduates** | Recruited with help from Dan Jurafsky (Stanford) and Chris Brew (Ohio State) | **$5 Amazon.com gift token** for completing all five tests, plus a further **$10** token for a second 5-test session | Surprisingly hard to convince to participate; goal of 100 undergrads hard to attain |

Groups were allowed to **evaluate their own systems**. *(p.3)*

Explicit motivations for the three-group design: experts have detailed knowledge and will listen for intonation, join and phonetic errors, or signal-processing artifacts; real users may care instead about accent or whether the voice sounds like someone they know, and are unlikely to be able to identify *why* something sounds strange; therefore many different listeners are required to achieve stable results. *(p.3)* A secondary goal was to compare the three groups' views against each other and to determine whether each group was **internally consistent**. *(p.3)*

### Statistical treatment
The paper states no statistical model, significance test, or confidence-interval procedure. Its design-level statistical commitments are: 10+ listeners per sample for stability, random per-listener sentence subsampling, random synthesizer ordering within a test, and single-presentation forced rating. *(p.3)* The numerical analysis is deferred entirely to Bennett [14]. *(p.4)*

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| ARCTIC utterances per speaker | — | utterances | ~1200 | — | p.1, p.2 | Split into A and B subsets |
| ARCTIC subset size | — | utterances | ~600 | — | p.2 | Each of A and B independently phonetically balanced |
| Sentence length filter | — | words | — | 5–15 | p.2 | "Niceness" criterion for text selection |
| Sampling rate | — | kHz | 16 | — | p.2 | Studio recording |
| Bit depth | — | bits | 16 | — | p.2 | Studio recording |
| Databases used in Challenge | — | count | 4 | — | p.1 | bdl, slt, rms, clb; awb and jmk excluded for dialect |
| Test genres | — | count | 5 | — | p.2 | 3 MOS + 2 transcription |
| Sentences released per genre | — | sentences | 50 | — | p.2 | Distributed 15 Jan 2005 |
| Total test sentences | — | sentences | 250 | — | p.3 | 5 × 50 |
| Sentences per listening test | — | sentences | 20 | — | p.3 | Randomly drawn from the 50 |
| Tests per listener | — | tests | 5 | — | p.3 | One per genre |
| Stimuli per full listener session | — | stimuli | 100 | — | p.3 | 5 × 20 |
| MOS scale | — | points | — | 1–5 | p.2 | Integer opinion score |
| Target listeners per sample | — | listeners | 10 | — | p.3 | Achieved: 10 or more (p.4) |
| Target total listeners | — | listeners | — | 200–300 | p.3 | Web delivery chosen to reach this |
| Target undergraduate listeners | — | listeners | 100 | — | p.3 | Not fully attained |
| Session duration | — | minutes | — | 30–45 | p.3 | All five tests |
| Voice build window | — | weeks | 1 | 1–2 | p.3 | Deadline allowed to slip a second week |
| Participants | — | teams | 6 | — | p.3 | Plus Team Studio natural speech |
| Undergrad incentive (first session) | — | USD | 5 | — | p.3 | Amazon.com gift token |
| Undergrad incentive (second session) | — | USD | 10 | — | p.3 | Additional token for a second 5-test session |
| Utterances released per speaker per system | — | utterances | 250 | — | p.4 | Corpus released for future automatic-measure research |
| Utterances per entry actually rated | — | utterances | 100 | — | p.4 | Each heard by 10+ listeners |
| SUS template | — | — | det adj noun verb det adj noun | — | p.2 | Medium-frequency random words |

## Effect Sizes / Key Quantitative Results

No listening-test scores are reported in this paper. Section 9 states explicitly that results are discussed in Bennett [14], and that participant names and rankings are **deliberately not revealed**; final results are published with **team letter names**, with each team knowing only its own letter. *(p.4)* The authors note they suspect teams will work out which letter is which anyway. *(p.4)*

The only quantitative outcomes reported here are logistical: 6 participants across 3 continents *(p.3)*; 100 utterances per entry rated by 10+ listeners *(p.4)*; 250 utterances per speaker per system available for release *(p.4)*.

## Methods & Implementation Details
- Test sentence texts and Festival-style utterance structures released together on 15 January 2005 *(p.2)*
- No explicit safeguard was instituted against participants tuning systems to the released test sentences; the organizers judged a safeguard would be too restrictive and trusted participants *(p.3)*
- Waveforms delivered to listeners over HTTP; network congestion could make downloads slow or intermittent, and there is **user-feedback evidence that congestion-induced artifacts were mistaken for join problems** *(p.3)*
- Test design deliberately chose **MOS (1–5)** over AB, ABX, or DMOS because pairwise designs would have produced too many samples to find listeners for *(p.4)*
- Because MOS rather than DMOS/similarity was chosen, **voice-conversion entries could not be validly scored**; one potential participant did construct voice-conversion entries and was excluded from the tests for this reason *(p.4)*
- Natural-speech recordings of the 250 test sentences were made at CMU from the original four speakers, to measure the distance from synthesis to natural speech *(p.3)*
- Anonymization: teams reported by letter, ranking not attributed *(p.4)*

## Figures of Interest
The paper contains no figures or numbered tables. All content is prose and example-sentence lists.

## Results Summary
The Challenge ran to completion with 6 participating groups plus a natural-speech topline, produced 250 synthesized utterances per system per speaker, and collected web listening data with 10+ listeners on each of 100 utterances per entry. *(p.3, p.4)* Behavioral outcome across listener groups: speech experts were the most eager and most conscientious; volunteers were "more random," with some never completing; paid undergraduates were surprisingly hard to recruit even with gift-token incentives. *(p.3)* The organizers concluded the exercise was valuable and immediately began organizing Blizzard Challenge 2006, intending an annual event and recommending that no drastic methodology changes be made for at least three iterations so that feedback remains comparable. *(p.4)*

## Limitations
- **Uncontrolled listening environment.** Listeners were asked to be in a quiet room with no way to enforce it. *(p.3)*
- **Network confound.** Congestion made waveform delivery intermittent, and listeners appear to have attributed the resulting artifacts to synthesis join problems. *(p.3)*
- **No control over listener engagement.** Listeners could lose interest, abandon tests, or fill in random values. *(p.3)*
- **Scale settling.** Because each sample must be rated before moving on, listeners' internal scaling was still settling during the first few examples of each test. *(p.3)*
- **Subsampling.** Only 20 of 50 sentences per genre were heard by any listener, for resource reasons. *(p.3)*
- **No anti-tuning safeguard.** Participants could in principle have tuned to the released test sentences. *(p.3)*
- **Corpus is not ideal for all systems.** ARCTIC is small by the standards of successful large-database concatenative systems, so imposing a smaller database "may unfairly degrade their system." Commercial corpus-based synthesizers also normally include prompts from various domains. *(p.2)*
- **Domain bias.** ARCTIC text is predominantly from novels, making it less than ideal; the organizers mitigate by testing other genres alongside the in-domain novels genre. *(p.2)*
- **Self-evaluation permitted.** Groups were allowed to evaluate their own systems. *(p.3)*
- **Participant attrition and commercial risk.** Two commercial entrants dropped out; commercial participation carries reputational risk if the system performs badly, even when the data can be blamed. *(p.2)*
- **Undefined "enough use of the data."** In an extreme case an entry could use nothing of the common dataset; the organizers concede that "deciding on the line when entries are not using the data enough is going to be hard to define." *(p.4)*
- **No similarity measure.** With only MOS, similarity to the original speaker is unmeasured, which is why voice conversion could not be admitted. *(p.4)*

## Arguments Against Prior Work
- **Against isolated-word intelligibility tests (DRT/MRT [12]).** The original DRT/MRT word lists are "not appropriate for unit selection based synthesis where different units will likely be selected in the isolated word case than in the intra-sentential case." Embedding confusable words in carrier phrases is argued to be a more reasonable test. *(p.2)*
- **Against TIMIT (452 sentences) as a common synthesis set.** It has been discussed in the community but "many have failed to successfully use such a set"; although CSTR released a single-speaker TIMIT [4], the organizers know of no one who has successfully used it, as it is **small by common standards**. *(p.1)*
- **Against the Boston University FM Radio corpus [5].** Used for prosody experiments, but **not phonetically well balanced**. *(p.1)*
- **Against the ATR 503 sentence sets [6].** Long used as a common set among Japanese researchers, but there is **no easy way for people outside Japan to gain access**. *(p.1)*
- **Against commercial in-house databases.** Companies hold large high-quality single-speaker databases, but even obsolete versions are hard to release to potential competitors; "it is not just the data that is valuable, but it is the content and design of the database that many companies feel proprietary," and data costs money. *(p.1, p.2)*
- **Against the pre-Challenge state of synthesis comparison.** Systems were tuned to their own datasets, so comparisons of labeling and signal processing "could only be done within the research group that originally developed the dataset," and the recorded voice itself contributed greatly to the resulting quality. *(p.1)*
- **Qualified defense of ASR's evaluation culture.** The authors acknowledge that "many may criticize a naive word error metric as a sole accuracy measure for speech recognition systems," but argue few would deny that the DARPA/NIST standardized-test regime [1] drove drastic improvement in the utility of ASR. This is the explicit template for Blizzard. *(p.1)*

## Design Rationale
- **Why a common dataset:** removing data variability allows a much closer comparison of the voices generated from it. *(p.1)*
- **Why CMU ARCTIC specifically:** it is freely available, single-speaker, phonetically balanced, and already built for synthesis, side-stepping the release problems of commercial and ATR corpora. *(p.1, p.2)*
- **Why exclude awb and jmk:** their Scottish and Canadian dialects are non-standard relative to the listener population. *(p.1)*
- **Why release rms and clb late:** to test "not just how well people built voices, but how quickly they could do so." *(p.1)*
- **Why five genres:** the organizers explicitly did not know which evaluation technique is best, so they picked several simple ones and planned to look at the results to determine which tests were sufficient and/or more reliable. *(p.2)* This is a deliberately exploratory, meta-evaluative stance.
- **Why simple text:** so the challenge tests synthesis and not text analysis. *(p.2)*
- **Why split MOS from transcription:** the last two genres force listeners to type what they heard, "in order to specifically address intelligibility in the task and not just personal preference." *(p.2)*
- **Why carrier phrases for confusable words:** unit selection behaves differently in isolation. *(p.2)*
- **Why MOS instead of AB/ABX/DMOS:** pairwise and degradation designs multiply the number of samples, and finding enough listeners was the binding constraint. *(p.4)*
- **Why web delivery despite noise:** finding 200–300 listeners is hard; the web reaches participants on many continents and more listeners; and the organizers wanted to answer the open question of whether web-based listening tests are feasible for large-scale synthesis evaluation at all. *(p.3)*
- **Why present samples singly with forced rating:** to stop listeners revising earlier judgments. *(p.3)*
- **Why randomize synthesizer order within a test:** each test holds the genre constant and varies the system, so a listener never hears a block from one system. *(p.3)*
- **Why include natural speech as a participant:** to find out how far synthesizers are from natural speech; the organizers openly expected this "team" to win. *(p.3)*
- **Why anonymize results:** to lower the commercial risk of participation. *(p.4)*
- **Why avoid drastic changes across iterations:** changing the methodology would confuse participants and make 2005 feedback unusable; the authors suggest repeating a similar process at least three times. *(p.4)*
- **Why an independent sentence generator:** the organizers' own teams were participating, so Sproat generated the test sentences. *(p.2)*

## Testable Properties
- A defensible synthesis evaluation must hold the training corpus constant across systems, otherwise quality differences are attributable to the recorded voice rather than the technique. *(p.1)*
- MOS ratings must be collected on an integer 1–5 scale, one stimulus at a time, with the rating committed before the next stimulus is presented. *(p.2, p.3)*
- Intelligibility must be measured by typed transcription, not by opinion score. *(p.2)*
- Intelligibility material must include both phonetically confusable words in carrier phrases and semantically unpredictable sentences, so that neither phonetic contrast nor semantic predictability alone carries the measurement. *(p.2)*
- Each evaluated stimulus should be heard by at least 10 listeners for stable results. *(p.3)*
- A listening session of 5 tests × 20 stimuli should take 30–45 minutes; exceeding this risks non-completion. *(p.3)*
- Within a single-genre test, the synthesizer identity must be randomly ordered across stimuli. *(p.3)*
- The sentence subset presented to each listener should be randomly drawn per listener from a larger released pool (20 of 50). *(p.3)*
- An evaluation containing an in-domain genre must also contain out-of-domain genres, since the corpus text (novels) biases the in-domain condition. *(p.2)*
- A natural-speech topline recorded on the same test sentences by the same speakers is required to calibrate the absolute distance from human speech. *(p.3)*
- Listener-group identity is a variable, not a nuisance: expert, volunteer, and paid-naive populations must be analyzed separately and checked for internal consistency. *(p.3)*
- MOS alone cannot validate voice conversion or any technique whose claim is speaker similarity; that requires a similarity/DMOS test. *(p.4)*
- Early stimuli in a session are contaminated by scale settling and should be treated accordingly. *(p.3)*

## Relevance to Project
This paper is the canonical citation for **how to run a defensible listening-test evaluation of a speech synthesizer**, and it is directly reusable as a protocol template for a formant/source-filter synthesizer:

- **Adopt the two-axis split.** Naturalness/preference via MOS 1–5 on natural text; intelligibility via forced typed transcription on SUS and confusable-word carrier phrases. A formant synthesizer will typically score far apart on these two axes, and reporting a single number would hide exactly the property that matters. Klatt-style synthesis has historically traded naturalness for intelligibility, so the split is the whole point.
- **Reuse the genre set.** Novels, news, conversation, confusable-carrier, SUS. The conversation genre is the one most likely to expose prosody weaknesses in a rule-driven front end.
- **Reuse the SUS template** `det adj noun verb det adj noun` with medium-frequency words. It is cheap to generate and removes semantic top-down repair, which is the main way an intelligibility test overestimates a poor synthesizer.
- **Reuse the carrier-phrase form** "Now we will say X again." for minimal-pair confusability, instead of an isolated-word DRT/MRT list.
- **Design constants to copy:** 20 stimuli per test, 5 tests, 100 stimuli per listener, 30–45 minutes, 10+ listeners per stimulus, single presentation with forced commit, random system order within a genre block, per-listener random subsampling from a larger pool.
- **Include a natural-speech topline** and, for a formant synthesizer, a copy-synthesis or reference-synthesizer anchor, since MOS is not an absolute scale.
- **Separate expert from naive listeners.** Experts hear join and signal-processing artifacts; naive listeners react to accent and overall impression. A formant synthesizer's characteristic failures (buzzy source, static formant targets, flat prosody) will be described very differently by the two groups.
- **Take the warnings seriously.** Web delivery introduced artifacts that listeners misattributed to synthesis joins. Any web-based evaluation of this project must pre-cache or locally serve audio and verify delivery integrity before blaming the synthesizer.
- **If speaker similarity is ever a claim** (voice cloning, speaker-targeted formant fitting), MOS is insufficient by construction; a DMOS or explicit similarity test is required. This is the reason a voice-conversion entry was excluded in 2005.
- **Methodological stability matters.** The authors argue for holding the protocol fixed across at least three iterations so results are comparable over time. The same applies to tracking a synthesizer's quality across releases.

## Open Questions
- [ ] Which of the five genres actually turned out to be the most reliable discriminator? The paper poses this as the motivation for using five, but defers the answer to Bennett [14].
- [ ] Were the three listener groups internally consistent, and did they agree with each other? Stated as a goal, answered elsewhere.
- [ ] How much did the "scale settling" over the first few stimuli bias MOS, and was any warm-up or discard applied in analysis?
- [ ] What normalization, if any, was applied for per-listener MOS offset across listeners with differing internal scales?
- [ ] How was typed-transcription accuracy scored (word error rate, keyword accuracy, phoneme-level)? The paper says only "typing in what they heard."
- [ ] What was the actual achieved listener count per group?
- [ ] How is "using the common dataset enough" to be defined for entries that lean on external data?

## Related Work Worth Reading
- **Bennett, C. (2005), "Large scale evaluation of corpus-based synthesizers: Results and lessons from the Blizzard Challenge 2005," Interspeech 2005** [14] — the companion results paper. This is the highest-priority follow-up; it contains the numbers, the scoring procedures, and the statistical treatment this paper omits.
- **Benoit, Grice & Hazan (1996), "The SUS test," Speech Communication 18:381–392** [13] — the source of the semantically unpredictable sentence method. Needed to generate a correct SUS set.
- **Logan, Greene & Pisoni (1989), "Segmental intelligibility of synthetic speech produced by rule," JASA 86(2):566–581** [12] — DRT/MRT applied to rule-based (formant) synthesis. Directly relevant to a formant synthesizer project, and the paper Black criticizes for isolated-word presentation.
- **Kominek & Black (2003), "The CMU ARCTIC speech databases," CMU-LTI-03-177** [3] — the corpus design, including the greedy diphone-coverage selection procedure.
- **Taylor, Black & Caley (2001), "Heterogeneous relation graphs as a mechanism for representing linguistic information," Speech Communication 33:153–174** [11] — the Festival utterance structure used to distribute labels.
- **Ostendorf, Price & Shattuck-Hufnagel (1995), Boston University Radio News Corpus** [5] — prosody corpus, criticized here as not phonetically balanced.

## Collection Cross-References

### Already in Collection
- (none found - the specific papers cited here are not yet in the collection; see Conceptual Links for a close relative)

### New Leads (Not Yet in Collection)
- J. Kominek, A. Black (2003) - "The CMU ARCTIC speech databases for speech synthesis research" - the corpus design report for the common dataset the whole Challenge is built on, including the greedy diphone-coverage selection procedure
- C. Bennett (2005) - "Large scale evaluation of corpus-based synthesizers: Results and lessons from the Blizzard Challenge 2005" - the companion results paper; all numeric outcomes and statistical treatment are deferred to it
- C. Benoit, M. Grice, V. Hazan (1996) - "The SUS test: a method for the assessment of text-to-speech synthesis intelligibility using semantically unpredictable sentences" - source of the SUS methodology used for one of the two intelligibility genres
- J. Logan, B. Greene, D. Pisoni (1989) - "Segmental intelligibility of synthetic speech produced by rule" - DRT/MRT applied to rule-based (formant) synthesis; the isolated-word tradition Blizzard's carrier-phrase design replaces
- P. Taylor, A. Black, R. Caley (2001) - "Heterogeneous relation graphs as a mechanism for representing linguistic information" - formalizes the Festival Utterance structure used to distribute phonetic labels to Challenge participants

### Supersedes or Recontextualizes
- (none)

### Conceptual Links (not citation-based)
- [The Architecture of the Festival Speech Synthesis System](../Taylor_1998_FestivalArchitecture/notes.md) - same author group's earlier paper describing the heterogeneous-relation-graph utterance structure that Black 2005 explicitly uses to distribute phonetic labels to participants ("Labels delivered as a Festival Utterance structure"); the 2001 HRG paper this citation list references [11] is the direct descendant of the architecture described there.
- [Methods for Subjective Determination of Transmission Quality (ITU-T Recommendation P.800)](../ITU-T_1996_MOS_P800/notes.md) - Black 2005's core naturalness metric is exactly the MOS (1-5) scale this recommendation defines and standardizes; useful for grounding what "MOS" formally commits to (rating procedure, scale anchors) beyond what Black 2005 states.
- [Method for the subjective assessment of intermediate quality level of audio systems (Recommendation ITU-R BS.1534-3)](../ITU-R_2015_MUSHRA_BS1534/notes.md) - Black 2005 explicitly rejects a MUSHRA-style AB/ABX/DMOS design in favor of MOS because "that would have presented us with too many samples to find listeners for," making this recommendation the road not taken; the tradeoff each protocol makes between listener-pool size and scale resolution is a direct comparison point for anyone designing a synthesis evaluation.

## Quotes Worth Preserving
- "Speech synthesis has not been as lucky in having a well-defined evaluation metric, nor has it had a well-funded centralized community that could be targeted to the same task." *(p.1)*
- "Such tying of databases to particular systems made it hard to genuinely compare techniques since the quality of the original recorded voice itself contributed greatly to the resulting synthetic voice quality." *(p.1)*
- "Removing the variability of the data itself allows for a much closer comparison of the voices generated from the data." *(p.1)*
- "As it is not clear what the best evaluation technique is, we decided to pick several simple ones, and look at the results to determine which tests were sufficient, and/or more reliable." *(p.2)*
- "The isolated word tests of the original DRT/MRT word lists are not appropriate for unit selection based synthesis where different units will likely be selected in the isolated word case than in the intra-sentential case." *(p.2)*
- "The final two genres involved the listeners typing in what they heard, in order to specifically address intelligibility in the task and not just personal preference." *(p.2)*
- "Real users are unlikely to be able to identify why something sounds strange. Therefore lots of different listeners are required to be able to achieve stable results." *(p.3)*
- "Each sample was presented singly and had to be rated before proceeding to the next sample. This was done to stop people changing their minds, though at the cost that people's scaling was settling during the first few examples." *(p.3)*
- "Such waveforms may appear to have join problems when the network congestion is at fault (there is evidence from user feedback that this did actually happen)." *(p.3)*
- "We had already designed the listening tests to be MOS (1–5) tests rather than AB, ABX, and/or DMOS tests because that would have presented us with too many samples to find listeners for." *(p.4)*
- "To validly include voice conversion entries, we would need to also include some test of similarity with the original speakers." *(p.4)*
- "Deciding on the line when entries are not using the data enough is going to be hard to define." *(p.4)*
