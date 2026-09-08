---
title: "The Generation of Affect in Synthesized Speech"
authors: "Janet E. Cahn"
year: 1990
venue: "Journal of the American Voice I/O Society (AVIOS)"
doi_url: "https://www.media.mit.edu/speech/papers/1990/cahn_AVIOSJ90_affect.pdf"
pages: 19
affiliation: "M.I.T. Media Technology Laboratory, 20 Ames Street, Cambridge, MA 02139"
---

# The Generation of Affect in Synthesized Speech

## One-Sentence Summary
Cahn's Affect Editor defines a 17-parameter acoustical model of emotional speech, quantifies each parameter on a −10..+10 scale per emotion, and maps those values onto concrete DECtalk3 (Klatt-family formant synthesizer) control settings, achieving recognizable synthesized affect for six emotions.

## Problem Addressed
Synthesized speech is distinguished from human speech by insufficient intelligibility, inappropriate prosody, and inadequate expressiveness. Affect (expressiveness) carries information about the speaker's mental state and intent beyond word content, is transmitted concurrently with lexical content (better use of limited channel bandwidth), and is expected by hearers. Prior emotion-in-speech literature is sparse, sporadic, and inconsistent except on the physiologically grounded correlates. *(p.1-2)*

## Key Contributions
- An acoustical (listener-side) rather than generative (speaker-side) model of emotion in speech, with independently varying parameters. *(p.3)*
- A 17-parameter model grouped into pitch, timing, voice quality, and articulation, each quantified on a −10..+10 scale centered at 0 = neutral. *(p.3-6)*
- The Affect Editor program: a transfer function from an abstract acoustical description of emotional speech to DECtalk3 synthesizer instruction strings. *(p.6-7)*
- Per-emotion parameter settings for anger, disgust, gladness, sadness, fear, surprise. *(later pages)*
- A perceptual experiment showing intended affect was correctly identified for the majority of presentations [Cahn (1989)]. *(p.1)*

## Methodology

### Modeling the effects of emotion on speech *(p.2)*
- The subjective semantic aspect of emotion is deliberately ignored; only quantified acoustic effects are modeled. Semantic models (pleasant/unpleasant, strong/weak) [Davitz 1964, Scherer 1974] will matter later, for automatic control of affect.
- Two research traditions: acoustics researchers measuring signal characteristics of emotional speech [Fairbanks 1940; Fairbanks & Pronovost 1939; Williams & Stevens 1969]; psychologists measuring listener responses [Davitz 1964; Scherer 1974].
- Shared findings: studies are few and sporadic; findings agree on **physiologically based** correlates and are contradictory/unclear on **intentional** effects (those the speaker most controls). *(p.2)*
- Physiology: sympathetic arousal (fear, anger, joy) raises heart rate and blood pressure, dries the mouth, causes occasional muscle tremors → speech is **loud, fast, enunciated, with strong high-frequency energy**. Parasympathetic arousal (boredom, sadness) lowers heart rate and blood pressure, increases salivation → speech is **slow, low-pitched, with little high-frequency energy** [Williams & Stevens 1981]. *(p.2)*
- Confusion structure: acoustically similar but semantically different emotions (anger vs enthusiasm; boredom vs sadness) are often mistaken for each other. Pitch range, average pitch, speech rate, timbre (high/low frequency energy ratio), and enunciation contribute most to identification mistakes [Davitz 1964]. *(p.2)*
- Findings do agree on the basic acoustical effects of emotion on **F0 and timing**, and perceptual studies say these are the main conveyers of affect. Fortuitously, F0 and timing are exactly what contemporary synthesizers can control. *(p.3)*

### Choosing a representation *(p.3)*
- **Generative (speaker) representation**: proceeds from a partial description of the speaker's mental state — attitudes and intentions that affect physiology or determine syntactic/semantic content. Theoretically preferred.
- **Descriptive (acoustical, listener) representation**: specifies the acoustic signal as perceived by the listener. Chosen because it is simpler, requires a less complete understanding of speech production, and its perceptual parameters are explicit and quantified so they can be directly manipulated to test perceptual responses and thereby improve the model. More is known about acoustic correlates of emotion than about speaker cognition/physiology.

### The acoustical model *(p.3)*
- Represented as a set of parameters corresponding to the speech correlates of emotion. **Each parameter varies independently**, giving direct individual control and supporting investigation of inter-parameter relationships.
- Correlation among physiologically influenced parameters is expected (pitch range, speech rate, loudness, timbre, enunciation vary together as affect changes [Davitz 1964]) but the model deliberately incorporates **few assumptions about how parameters interact**, to avoid overgeneralizing.

## Parameter Taxonomy (four categories) *(p.3-4)*
- **Pitch** parameters describe features of F0.
- **Timing** parameters control rhythm (word stress + silence) and speech rate.
- **Voice quality** parameters describe features of the speech signal as a whole.
- **Articulation** parameters describe features of phoneme articulation.
- Categories are not absolute: *stress frequency* (timing) determines the number of pitch-contour peaks; enunciation is achieved mainly at the phoneme level (articulation) but also by relative strengths of high vs low frequency energy (voice quality). *(p.4)*

### Pitch parameters *(p.4)*
- **Accent shape** — rate of F0 change for any pitch accent in the utterance; overall steepness or smoothness of the F0 contour shape at the site of a pitch accent.
  - Footnote 1: a *pitch accent* is distinctive pitch — high or low — applied to the lexically stressed syllable of a word such that the word as a whole is perceived as receiving sentential stress. *(p.4)*
- **Average pitch** — average F0 for the utterance relative to the speaker's normal speaking pitch.
- **Contour slope** — overall trend of the pitch range for the utterance: expands, remains level, or contracts.
- **Final lowering** — terminal pitch contour: rate and direction of F0 change at utterance end. Rise vs fall is often linguistic/pragmatic rather than affective (e.g., intent to continue speaking = rising terminal contour regardless of affect).
- **Pitch range** — bandwidth of the range bounded by lowest and highest F0 for the utterance.
- **Reference line** — term borrowed from generative intonation work [Anderson & Pierrehumbert & Liberman (1984)]. Specifies the F0 to which the pitch contour appears to return following a high or low pitch excursion.

### Timing parameters *(p.4-5)*
- **Exaggeration** — degree to which pitch-accented words receive exaggerated duration as emphasis.
  - Footnote 2: the implementation of *exaggeration* introduced unwanted side effects in the speech, so it is **excluded from the current version of the Affect Editor**. *(p.4-5)*
- **Fluent pauses** — frequency of pausing **between** syntactic or semantic units.
- **Hesitation pauses** — frequency of pausing **within** a syntactic or semantic unit; these often occur after the first function word in a clause [Dittmann (1974)].
  - Footnote 3: function words convey primarily structural information, are a minuscule part of most vocabularies, rarely added/dropped (pronouns, prepositions, determiners). Content words convey semantic information, may change meaning, added/dropped readily (nouns, verbs, adverbs, adjectives). *(p.5)*
- **Speech rate** — rate of speech; affects syllables/words per minute and the duration of pauses.
- **Stress frequency** — ratio of stressed to stressable (i.e., pitch-accentable) words in an utterance. Stressable words may legitimately receive a pitch accent per sentence semantics; stressed words are stressable words that actually receive pitch accents. Greater stress frequency ⇒ more stressable words become stressed. Words not considered stressable (usually function words) **never** receive distinctive pitch regardless of stress frequency. Operates on words and requires an analysis of the likelihood a word will be stressed from syntax, semantics, pragmatics: content word > function word; new information > already-mentioned information. *(p.5)*

### Voice quality parameters *(p.5-6)*
Set: breathiness, brilliance, loudness, pause discontinuity, pitch discontinuity, tremor (plus laryngealization, described here). Most except perhaps brilliance and pitch discontinuity convey speaker identity as much as affect. *(p.5)*
- **Breathiness** — amount of frication noise that may be co-present with non-fricative phonemes (e.g., vowels).
- **Brilliance** — ratio of low to high frequency energy. A **high value indicates strong high frequency energy**.
- **Laryngealization** — creaky voice: minimal subglottal pressure, small open quotient, narrow glottal pulse, irregular fundamental period. Correlates with speaker identity as much as emotion; speech of older speakers is often laryngealized.
- **Loudness** — perceived loudness, a result of subglottal pressure, hence the perceptual response to speech signal amplitude.
- **Pause discontinuity** — smoothness or abruptness of a pause onset. Included to **compensate for a synthesizer-introduced side effect** — the abrupt cessation of phonation caused by the silence phoneme. *(p.5-6)*
- **Pitch discontinuity** — smoothness or abruptness of F0 transitions throughout the utterance, the result of more or less motor control by the speaker. *(p.6)*
- **Tremor** (vocal jitter) — irregularities between successive glottal pulses; observed in recordings of fearful utterances [Williams & Stevens (1972)].
  - Footnote 4: **tremor cannot be produced by the DECtalk3 so is not yet implemented.** *(p.6)*

### Articulation parameter *(p.6)*
- **Precision** — the sole articulation parameter; degree of slurring or enunciation for all phoneme classes.

### Parameter value scale *(p.6)*
- All parameters quantified on a scale centered at zero, ranging **−10 to +10**. Zero = parameter influence for neutral affect; −10 and +10 = minimum and maximum influence.
- The effect of changing a value may differ above vs below zero. Example: there is little laryngealization for affectively neutral speech, so the difference between no laryngealization (−10) and neutral (0) is minimal, while the difference between +10 and 0 is significant.
- Centering neutral at mid-range allows straightforward implementation of descriptive quantifiers *more* and *less*: **more** affective coloration = move values further from zero; **less** = move them closer. This gives a basis for eventual automation of affect generation.

## The Affect Editor Program *(p.6-7)*
Implements a transfer function from an acoustical description of emotional speech to synthesized expressive speech. It is both a tool for designing expressive speech and an instrument for investigating perceptual responses to speech correlates of emotion. Given an emotion and an utterance it produces output sent to the synthesizer (currently a **DECtalk3**).

### Input *(p.7)*
- Input = an emotion (a set of speech correlates with quantities) plus an utterance.
- An utterance is a set of clauses, each distinguished by syntactic (thematic) or semantic role, e.g.:

```
[S [[AGENT I] [ACTION saw [OBJECT your name]]] [LOCATIVE in the paper]]
```

- Clause divisions justified by the Sentence, AGENT, ACTION, OBJECT and LOCATIVE classifications. Clauses arranged in a **tree structure**, simulating the result of a semantic analysis in which relations between main and subsidiary clauses are apparent from structure. Each clause plays a thematic or pragmatic role per a **case frame analysis**.
- Prosodic annotations to a **clause** (e.g., pitch range, speech rate) reflect its semantics and syntax and therefore its role in the utterance. Prosodic annotations to a **word** (e.g., pitch accents) reflect its syntactic categorization as dictated by utterance semantics. The input thus simulates the output of a text generation program in which each clause fulfills a specific informational or discourse role.
- The Affect Editor performs an initial analysis of the utterance to find **all possible pitch accent and pause locations**. Whether these possibilities are realized depends on the emotion's parameter values, which act as a **filter on the most extreme effects**.
  - From phrase structure and syntactic category it identifies all possible hesitation and fluent pause locations; the *hesitation* and *fluent pause* parameters determine at which locations pauses are actually inserted.
  - The *stress frequency* parameter combined with pitch-accent probability information determines how many and which words receive pitch accents.
  - Footnote 5: the likelihood a word receives a pitch accent depends on how central it is to the meaning of the utterance; changing pitch-accenting probabilities may well change the interpretation of an utterance. *(p.7)*

### Output *(p.7)*
- Produces instructions enabling a synthesizer to speak the utterance with the specified affect. For the DECtalk3 — the only synthesizer used so far — the Affect Editor constructs **two strings**: *(p.7-8)*
  1. **A settings string** that sets the synthesizer parameters controlling features of prosody and voice quality.
  2. **The utterance string** itself: a combination of English text, **ARPAbet** phonemes, phoneme durations, pauses and intonation markings. Depending on the affect this string may include pauses and modifications to word intonation and pronunciation.
  - Footnote 6: ARPAbet is a phonemic alphabet for English, developed as an ASCII approximation of IPA symbols. *(p.8)*

### Program flow of control *(p.8, Fig. 1 p.9)*
1. The Affect Editor interprets the acoustical parameter values to produce **lexical** and **non-lexical** effects.
2. It **first** sends the synthesizer instructions for producing non-lexically based effects (phrase features such as pitch range or speech rate, and voice quality effects).
3. It **then** processes the utterance. The initial utterance is an arrangement of one or more clauses simulating the tree-structured output of a text generation program.
4. During processing the utterance becomes a **linear phonology** whose words and intonational phrases are marked with acoustical features as per parameter values.
5. The acoustical features are then interpreted for the synthesizer, producing a **synthesizer phonology** in which all possible acoustical features are expressed as synthesizer-specific instructions.
6. These instructions (for the DECtalk3: a combination of text, phonemes, diacritics) are assembled in the appropriate order to form the utterance spoken by the synthesizer.

Pipeline (Fig. 1, p.9), with the dotted line separating synthesizer-independent (above) from synthesizer-dependent (below) activity:

```
Emotion (acoustical correlates)  +  Utterance (clauses per case frame analysis,
                                     annotated with intonational and word category info)
                       |                        |
                       +------ processing ------+
                       |                        |
             (left branch)              phonology  [linear structure; words
                       |                annotated with acoustical features]
- - - - - - - - - - - -|- - - - - - - - - - - - |- - - - - - - - - - - - - - -
          synthesizer settings          synthesizer phonology
       [acoustical correlates mapped   [acoustical features translated
        to synthesizer parameter        into synthesizer instructions]
        values]                                  |
                       |                    utterance [synth-specific
                       |                     representation of words and
                       |                     pauses incl. pronunciation,
                       |                     intonation, duration]
                       +------- synthesizer -----+
                                    |
                                  Speech
```

## Synthesizer Considerations and Effects (DECtalk3 mapping) *(p.8, p.11)*

The acoustical representation is **synthesizer independent**, so its parameters must be interpreted for each synthesizer it drives. The mapping of Affect Editor parameters to DECtalk3 capabilities involves both **one-to-many and many-to-one** mappings from acoustical parameters to synthesizer settings. Parameters not represented in DECtalk's own parameter set are implemented in software where possible: *(p.8)*

| Affect Editor parameter | DECtalk3 realization technique | Page |
|---|---|---|
| Contour slope (rising or falling) | Approximated by assigning a **high F0 to the word at the end (rising) or the beginning (falling)** of the utterance | p.8 |
| Fluent / hesitation pauses | Pauses added by **inserting a silence character** | p.8 |
| Pause discontinuity (smooth vs abrupt pause onset) | Effected by **inserting phonemes prior to the silence** | p.8 |
| Precision of articulation | Achieved by **phoneme substitutions or additions** | p.8 |

DECtalk3 was chosen for the scope and variety of its prosodic and voice quality controls. Its limitations made it hard to determine whether an emotion had been poorly specified or correctly specified but poorly reproduced. Limitations are of two kinds — **side effects** and **limited capabilities**: *(p.8, p.11)*

**Side effects** *(p.8, p.11)*
- Specifying a word with **phonemes instead of English text** causes it to be spoken with a **lower F0**.
- **Word stress markings** should cause F0 perturbations only for the word they mark, but sometimes affect the pitch contour for the **entire utterance**, by preventing other stressed words from receiving stress.
- Changes to **average pitch automatically affect the pitch range as well**, so one perceives a **change of speaker rather than of affect**.

**Limited capabilities** *(p.11)*
- **Tremor** could not be implemented because the synthesizer could not produce tremors in its output.
- **Most limiting**: the synthesizer's inability to handle an instruction in which many ASCII characters specified a **short-lived event**. Too many pitch and duration instructions caused it to **temporarily stop speaking**. This in part prevented implementation of the **exaggeration** parameter, and also prevented **precise word-by-word pitch contour control**.

**Proposed remedies** *(p.11)*
- Implement an intonational description system with **primarily local effects**, such as the **two-tone annotation** of Pierrehumbert and colleagues [Pierrehumbert (1980), Liberman & Pierrehumbert (1981), Anderson & Pierrehumbert & Liberman (1984)], to overcome unwanted word-related side effects.
- **Separate pitch range from average pitch** effects, allowing greater F0 variation without affecting the perception of speaker identity.
- Expand synthesizer capabilities, adding features currently implemented in Affect Editor software, particularly the ability to specify **precision of articulation** and **overall pitch contour slope**.

### Summary of the model *(p.11)*
The Affect Editor incorporates an acoustical/perceptual model of the effect of emotion on speech, both to generate affect and to investigate how to generate better affect. Because the work is at an early stage, it incorporates few assumptions about interrelations among parameters, but provides a foundation for exploring parameter influence and thus for automating the infusion of affect into synthesized speech.

## Table 1 — Affect Editor parameter values used to synthesize the experiment stimuli *(p.13)*

Values on the −10..+10 scale, 0 = neutral. Note that *exaggeration* and *tremor* are absent from Table 1 because they were not implemented.

| Parameter | Category | Angry | Disgusted | Glad | Sad | Scared | Surprised |
|---|---|---|---|---|---|---|---|
| Accent shape | pitch | 10 | 0 | 10 | 6 | 10 | 5 |
| Average pitch | pitch | −5 | 0 | −3 | 0 | 10 | 0 |
| Contour slope | pitch | 0 | 0 | 5 | 0 | 10 | 10 |
| Final lowering | pitch | 10 | 0 | −4 | −5 | −10 | 0 |
| Pitch range | pitch | 10 | 3 | 10 | −5 | 10 | 8 |
| Reference line | pitch | −3 | 0 | −8 | −1 | 10 | −8 |
| Fluent pauses | timing | −5 | 0 | −5 | 5 | −10 | −5 |
| Hesitation pauses | timing | −7 | −10 | −8 | 10 | 10 | −10 |
| Speech rate | timing | 8 | −3 | 2 | −10 | 10 | 4 |
| Stress frequency | timing | 0 | 0 | 5 | 1 | 10 | 0 |
| Breathiness | voice quality | −5 | 0 | −5 | 10 | 0 | 0 |
| Brilliance | voice quality | 10 | 5 | −2 | −9 | 10 | −3 |
| Laryngealization | voice quality | 0 | 0 | 0 | 0 | −10 | 0 |
| Loudness | voice quality | 10 | 0 | 0 | −5 | 10 | 5 |
| Pause discontinuity | voice quality | 10 | 0 | −10 | −10 | 10 | −10 |
| Pitch discontinuity | voice quality | 3 | 10 | −10 | 10 | 10 | 5 |
| Precision of articulation | articulation | 5 | 7 | −3 | −5 | 0 | 0 |

Interpretation examples given by the author: frequent pitch contour fluctuations were effected by a **high value for stress frequency**; a rising pitch contour by a **high value for contour slope**; slurred speech by a **low value for precision of articulation**. *(p.12)*

Acoustical correlates for the emotions were culled from Fairbanks (1940), Fairbanks & Pronovost (1939), Williams & Stevens (1969), Davitz (1964), Scherer (1974), then interpreted for the Affect Editor parameters. *(p.12)*

## Worked Example — "Sad" affect (Figure 2, p.10)

Utterance: *"I saw your name in the paper."*

Sad parameter values shown in the interface (identical to Table 1's Sad column, plus the two unimplemented parameters at 0):

| Category | Parameter | Value |
|---|---|---|
| PITCH | Accent Shape | 6 |
| PITCH | Average Pitch | 0 |
| PITCH | Contour Slope | 0 |
| PITCH | Final Lowering | −5 |
| PITCH | Pitch Range | −5 |
| PITCH | Reference Line | −1 |
| TIMING | Exaggeration | 0 (unimplemented) |
| TIMING | Fluent Pauses | 5 |
| TIMING | Hesitation Pauses | 10 |
| TIMING | Speech Rate | −10 |
| TIMING | Stress Frequency | 1 |
| VOICE QUALITY | Breathiness | 10 |
| VOICE QUALITY | Brilliance | −9 |
| VOICE QUALITY | Laryngealization | 0 |
| VOICE QUALITY | Loudness | −5 |
| VOICE QUALITY | Pause Discontinuity | −10 |
| VOICE QUALITY | Pitch Discontinuity | 10 |
| VOICE QUALITY | Tremor | 0 (unimplemented) |
| ARTICULATION | Precision | −5 |

Interface panes (top to bottom), showing the successive representations:

1. **SENTENCES** — the five stimulus sentences, with *"I saw your name in the paper."* selected.
2. **phrase structure**:
   `[ S [ [AGENT I ] [ACTION saw ] [OBJECT your name ]] [LOCATIVE in the paper ]]`
3. **phonology** (linear, acoustical features attached):
   `(<topline: 1><lowering: 1><rate: 1> [FLUENT-1] I [HESITATION-1] [FLUENT-3] saw [FLUENT-3] your name [FLUENT-2] in [HESITATION-1] the paper .)`
4. **DECtalk phonology** (acoustic features resolved to DECtalk quantities):
   `(<topline: 50><lowering: 30><rate: 122> I saw your name in the paper.)`
5. **DECtalk string** (final synthesizer instructions):
   `[:dv pr 50 as 30 :ra 122]  I[IX_<185>]  [']saw[AX_<287>] your [N`EYM][MHX<5>_<236>] in[N<45>_<185>] the [PB][']paper[R<15>].`

Structural reading of the four representation levels (the paper does not gloss the DECtalk tokens itself; the following is inference from DECtalk conventions and from the paper's own statements on p.8 that pauses are silence characters, pause-onset quality is effected by inserting phonemes prior to the silence, and precision is achieved by phoneme substitutions or additions):

- The **acoustical phonology** carries abstract, unit-less feature values: `<topline: 1>`, `<lowering: 1>`, `<rate: 1>` plus symbolic pause slots `[FLUENT-n]` and `[HESITATION-n]` (the integer suffix appears to grade pause strength/length at that site).
- The **DECtalk phonology** resolves those abstract values to synthesizer quantities: `<topline: 50>`, `<lowering: 30>`, `<rate: 122>`.
- The **DECtalk string** issues them as a voice/rate command `[:dv pr 50 as 30 :ra 122]` — `pr` (pitch range) 50 and `as` (assertiveness) 30 come from topline and lowering; `:ra 122` is the speaking rate in words per minute, from `<rate: 122>`.
- Words rendered phonemically (`[N`EYM]` for *name*) instantiate the "specify a word with phonemes instead of English text" technique — whose acknowledged side effect is a lower F0 for that word (p.8).
- Bracketed tokens with `<NNN>` are ARPAbet phonemes carrying explicit durations in milliseconds; `_` denotes inserted silence. The sequences `[IX_<185>]`, `[AX_<287>]`, `[MHX<5>_<236>]`, `[N<45>_<185>]` are the phoneme-plus-silence insertions realizing the hesitation and fluent pauses with smooth (non-abrupt) onset, matching *pause discontinuity* = −10 and *hesitation pauses* = 10 for Sad.
- `[']` marks word stress; `[PB]` is a phrase boundary marker.

Key correspondence: `<topline: 1>` → 50, `<lowering: 1>` → 30, `<rate: 1>` → 122 wpm. The Sad speech rate parameter is −10 (slowest), so 122 wpm is the bottom of the DECtalk rate range as the Affect Editor uses it.

## Experimental Verification

### Equipment *(p.11-12)*
- Stimulus presentation and response collection ran on a **Symbolics 3650 Lisp Machine**.
- Synthesized speech produced by a **DECtalk3**, sent to a **Sansui AU3900 amplifier**.
- Subjects heard the speech through **Koss KC-180 headphones** or **NEC RS-500-R speakers**, at their preference.
- Amplifier settings (bass, treble, balance) set to their **mid-points for all subjects**.

### Stimuli *(p.12)*
- **Thirty utterances** = 5 sentences × 6 affects (angry, disgusted, glad, sad, scared, surprised).
- Sentences were **intended to be affectively neutral** so subjects would draw conclusions from non-lexical features. In trial runs subjects perceived affectively neutral utterances spoken with affect as incongruous or meaningless, so the criteria were **relaxed to require mainly that the sentences be plausible in each affective context**.
- The five sentences:
  1. `I'm almost finished.`
  2. `I saw your name in the paper.`
  3. `I thought you really meant it.`
  4. `I'm going to the city.`
  5. `Look at that picture.`
- The six emotions were selected because they were **semantically distinct and often acoustical or semantic extremes**, so subject judgments would reflect the Affect Editor's performance rather than the subjects' internal representations of emotion semantics; judgments of semantically or acoustically indistinct emotions would more likely reflect individual biases.

### Subjects *(p.12)*
- **N = 28**. Most MIT students, ages **19-35**. **9 women, 19 men**.
- First language of **24** was some form of General American English; **4** had a first language other than English.
- Of the American English speakers: 4 New England, 8 Mid-Atlantic, 6 Midwest, 3 South/Southwest.
- Subjects were **not paid**.

### Method / protocol *(p.13-14)*
1. Subjects heard synthesized speech and chose from six adjectives the one best describing the affective quality.
2. To compensate for the limitations of forced choice, subjects could optionally qualify answers by answering "How much?" (**magnitude**) and "How sure are you?" (**certainty**), and could type free-text comments.
3. Setting: a large office. The experimenter explained (a) that the subject would hear synthesized utterances spoken with different emotional qualities and was to choose the emotion best describing the quality; (b) the three judgment scales (affect descriptors, magnitude, certainty) and the comment facility; (c) the program interface and commands. The experimenter then **left the room**.
4. Using a mouse, the subject clicked **START**.
5. To accustom subjects to synthesized speech the DECtalk3 first spoke an acclimation paragraph with **[relatively] neutral affect**: *"Hello. This is a perceptual experiment. There are no right or wrong answers. Just go by what you hear. I'll speak some sentences with varying emotional qualities. Click on the word that best describes the quality or emotion you hear. OK! Here is the first sentence."*
6. Thirty synthesized utterances, unique combinations of six emotions and five sentences, were presented in **one of nine random orders**. Subjects could **replay each utterance as many times as necessary** before entering judgment.
7. Runs varied in duration from **eight to twenty-eight minutes**.

### Hypotheses *(p.14)*
- **Null hypothesis:** each of the six affects would be recognizable only at chance level, **17%** (1/6).
- A recognition rate significantly above chance would disprove the null and show recognizable affect can be added to synthesized speech, supporting the Affect Editor approach: model the acoustical correlates of speech, allow manipulation of model parameters, map their effects to speech synthesizer capability parameters.
- **Secondary prediction** (from Davitz 1964): when the intended affect was not perceived, subjects would perceive instead an emotion with **similar acoustical or semantic correlates**.

## Results

- Only forced-choice data were analyzed. **χ² = 823.21 with 5 degrees of freedom, extremely significant at p = .01.** *(p.14)*
- Each emotion was perceived for approximately **50% of its presentations**, far above chance. *(p.14)*
- Errors were **not random** and followed the pattern of errors made in identifying affect in human speech. *(p.14)*
- **Sadness**, with the most acoustically distinct features (soft, slow, halting speech with minimal high-frequency energy), was the most recognizable at **91%**. *(p.14-15)*
- Emotions with similar **acoustical** features (gladness/surprise, anger/surprise) were often confused. Even more consistent and frequent substitution occurred for emotions with similar **semantics** (anger/disgust, gladness/surprise). *(p.14-15)*
- Except for sadness, intended emotions were recognized in ~**50%** of presentations and mistaken for similar emotions in an additional ~**20%**. *(p.15)*
- **Utterance semantics colored some judgments**, contrary to the implicit hypothesis that intended affect would be recognized regardless of utterance semantics. *"I thought you really meant it."* was rarely perceived as glad, scared or disgusted; *"I'm almost finished."* was most often perceived as glad. *(p.15)*
- Individual subjects tended to favor some emotions over others, especially emotions with similar semantics or acoustics. These biases were **individual, not characteristic of any age, sex, regional or national subgrouping**. *(p.15)*
- Magnitude, certainty and comment facilities were primarily devices for minimizing forced-choice frustration and were **unused in the tabulations**, but point to issues awaiting exploration: the difference between **recognizability and naturalness**, and how the perception of **speaker identity** affects the perception of affect. *(p.15)*

### Table 2 — Exact and adjusted recognition, per emotion *(p.15)*
"Adjusted" allows as correct the most frequently substituted descriptor.

| Measure | Angry | Disgusted | Glad | Sad | Scared | Surprised | For All Emotions |
|---|---|---|---|---|---|---|---|
| Total presentations | 139 | 140 | 137 | 140 | 139 | 139 | 834 |
| Total recognized | 61 | 59 | 66 | 127 | 72 | 61 | 446 |
| Percent recognized | 43.9 | 42.1 | 48.2 | 91 | 51.8 | 43.9 | 53.5 |
| Total recognized (adjusted) | 91 | 113 | 114 | 136 | 101 | 101 | 656 |
| Percent recognized (adjusted) | 65.5 | 80.7 | 83.2 | 97.1 | 72.7 | 72.7 | 78.7 |

### Figure 3 — Full confusion matrix *(p.16)*
Columns = emotion in stimulus, rows = subjects' response; cell = count of responses over all subjects. Blank cells had no responses plotted.

| Response ↓ / Stimulus → | Angry | Disgusted | Glad | Sad | Scared | Surprised |
|---|---|---|---|---|---|---|
| Angry | **61** | 54 | 8 | — | 11 | 12 |
| Disgusted | 30 | **59** | 10 | 4 | 3 | 11 |
| Glad | 12 | 7 | **66** | — | 15 | 40 |
| Sad | 5 | 17 | 4 | **127** | 9 | 8 |
| Scared | 6 | 1 | 1 | 9 | **72** | 7 |
| Surprised | 24 | 2 | 48 | — | 29 | **61** |

Column sums: Angry 138 (of 139 presentations; one response not plotted), Disgusted 140, Glad 137, Sad 140, Scared 139, Surprised 139. Caption example: an angry utterance was perceived as angry in 61 presentations, disgusted in 30, glad in 13 [caption says thirteen; the plotted cell reads 12], sad in 5, scared in 6, surprised in 24. *(p.16)*

Dominant substitutions (the basis for the "adjusted" row of Table 2): Angry→Disgusted (30), Disgusted→Angry (54), Glad→Surprised (48), Sad→Disgusted (4)/Scared (9), Scared→Surprised (29), Surprised→Glad (40).

### Table 3 — Subject comments *(p.17)*
Optional comments, encouraged to capture feedback obscured by forced choice.

| Subject | Intended | Perceived | Comment |
|---|---|---|---|
| #20 | Scared | Scared | "Depends a lot on what assumption I have of the speaker; e.g. whether this is a young boy, old lady, or adult man. Could be the normal speech of a cartoon character...." |
| #21 | Sad | Sad | "Can't get the sense: I don't understand what DECtalk is saying" |
| #21 | Disgusted | Angry | "Ooh, that's a good one" |
| #22 | Glad | Surprised | "hard2get" |
| #22 | Sad | Sad | "hard2get" |
| #22 | Scared | Surprised | "hard2get" |
| #23 | Disgusted | Angry | "Barely controlled anger" |
| #23 | Disgusted | Angry | "and, again, disgusted as well." |
| #23 | Angry | Surprised | "or possibly angry" |
| #25 | Angry | Angry | "Sound more impatient than anything else" |

## Conclusions and Future Work *(p.17-18)*
- The Affect Editor demonstrates that **recognizable and even natural-sounding affect can be produced by imitating in synthesized speech the effects of emotion in human speech**, and serves as a tool for exploring what an affect-generating system needs.
- **Hardware improvements needed**: more synthesizer parameters; synthesizer parameters that vary **independently so side effects are minimized**; an increase in the synthesizer's overall processing abilities.
- **Software improvements** will be driven by better understanding of the perception and production of affect: the model may incorporate **parameter dependencies**, add new parameters, and merge or remove existing ones. With better synthesizers and models, the mappings between levels (emotion → acoustical representation → synthesizer-specific expression) can be tested and improved.
- **Ultimately**, automatic generation of affect will be best served by a **generative model** — a representation of the speaker's mental and physiological states. Constructing one depends on identifying the relevant descriptive parameters and, more fundamentally, on developing a **theory of the use and interpretation of affect in speech**.

## Parameters

### Affect Editor model parameters (definitions and scale)

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Accent shape | — | model units | 0 | −10 to 10 | p.4, p.6 | Rate of F0 change at any pitch accent; steepness/smoothness of contour at the accent site |
| Average pitch | — | model units | 0 | −10 to 10 | p.4, p.6 | Average F0 relative to the speaker's normal speaking pitch |
| Contour slope | — | model units | 0 | −10 to 10 | p.4, p.6 | Overall trend of pitch range: expands, level, contracts |
| Final lowering | — | model units | 0 | −10 to 10 | p.4, p.6 | Rate and direction of F0 change at utterance end; direction often linguistic/pragmatic not affective |
| Pitch range | — | model units | 0 | −10 to 10 | p.4, p.6 | Bandwidth between lowest and highest F0 for the utterance |
| Reference line | — | model units | 0 | −10 to 10 | p.4, p.6 | F0 to which the contour returns after a high or low excursion [Anderson & Pierrehumbert & Liberman 1984] |
| Exaggeration | — | model units | 0 | −10 to 10 | p.4 | Duration exaggeration of pitch-accented words. **Not implemented** — caused unwanted side effects and DECtalk could not absorb the instruction density |
| Fluent pauses | — | model units | 0 | −10 to 10 | p.5, p.6 | Frequency of pausing **between** syntactic/semantic units |
| Hesitation pauses | — | model units | 0 | −10 to 10 | p.5, p.6 | Frequency of pausing **within** a syntactic/semantic unit; often after the first function word in a clause [Dittmann 1974] |
| Speech rate | — | model units | 0 | −10 to 10 | p.5, p.6 | Syllables/words per minute and pause duration |
| Stress frequency | — | model units (ratio-driven) | 0 | −10 to 10 | p.5, p.6 | Ratio of stressed to stressable (pitch-accentable) words; function words never accent regardless of value |
| Breathiness | — | model units | 0 | −10 to 10 | p.5, p.6 | Frication noise co-present with non-fricative phonemes (e.g., vowels) |
| Brilliance | — | model units | 0 | −10 to 10 | p.5, p.6 | Ratio of low to high frequency energy; **high value = strong high-frequency energy** |
| Laryngealization | — | model units | 0 | −10 to 10 | p.5, p.6 | Creaky voice: minimal subglottal pressure, small open quotient, narrow glottal pulse, irregular fundamental period. Asymmetric: −10→0 difference minimal, 0→+10 significant |
| Loudness | — | model units | 0 | −10 to 10 | p.5, p.6 | Perceived loudness; result of subglottal pressure, perceptual response to signal amplitude |
| Pause discontinuity | — | model units | 0 | −10 to 10 | p.5, p.6 | Smoothness/abruptness of pause onset; added to compensate for DECtalk's abrupt cessation of phonation at the silence phoneme |
| Pitch discontinuity | — | model units | 0 | −10 to 10 | p.6 | Smoothness/abruptness of F0 transitions; reflects speaker motor control |
| Tremor | — | model units | 0 | −10 to 10 | p.6 | Vocal jitter: irregularities between successive glottal pulses; observed in fearful utterances [Williams & Stevens 1972]. **Not implemented** — DECtalk3 cannot produce tremor |
| Precision of articulation | — | model units | 0 | −10 to 10 | p.6 | Degree of slurring vs enunciation, for all phoneme classes; realized by phoneme substitution or addition |

### DECtalk3 settings observed in the Sad worked example

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| DECtalk pitch range | `pr` | DECtalk units | 50 (Sad) | — | p.10 | Derived from acoustical `<topline: 1>` |
| DECtalk assertiveness | `as` | DECtalk units | 30 (Sad) | — | p.10 | Derived from acoustical `<lowering: 1>` |
| DECtalk speaking rate | `:ra` | words/minute | 122 (Sad) | — | p.10 | Derived from acoustical `<rate: 1>`; corresponds to speech rate = −10 |
| Phoneme duration (inserted `IX`) | — | ms | 185 | — | p.10 | Pause-onset phoneme for hesitation after *I* |
| Phoneme duration (inserted `AX`) | — | ms | 287 | — | p.10 | Pause insertion after *saw* |
| Phoneme duration (`MHX`) | — | ms | 5 + 236 silence | — | p.10 | Phoneme 5 ms plus 236 ms silence after *name* |
| Phoneme duration (`N`) | — | ms | 45 + 185 silence | — | p.10 | Phoneme 45 ms plus 185 ms silence after *in* |
| Phoneme duration (`R`) | — | ms | 15 | — | p.10 | Utterance-final on *paper* |

### Experiment design quantities

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Chance recognition level | — | % | 17 | — | p.14 | Six-alternative forced choice |
| Subjects | N | count | 28 | — | p.12 | 9 women, 19 men, ages 19-35 |
| Stimuli per subject | — | count | 30 | — | p.12 | 5 sentences × 6 affects |
| Total presentations | — | count | 834 | — | p.15 | Across all subjects |
| Random presentation orders | — | count | 9 | — | p.14 | One of nine used per run |
| Run duration | — | minutes | — | 8-28 | p.14 | Subjects could replay stimuli freely |
| Chi-squared statistic | χ² | — | 823.21 | df = 5 | p.14 | Significant at p = .01 |

## Effect Sizes / Key Quantitative Results

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---|---|---|---|---|---|---|
| Overall exact recognition | % correct | 53.5 | — | .01 (χ²=823.21, df=5) | All 834 presentations, 28 subjects | p.14-15 |
| Overall adjusted recognition | % correct | 78.7 | — | — | Substituted descriptor counted correct | p.15 |
| Sad exact recognition | % correct | 91 | — | — | 127/140 | p.15 |
| Sad adjusted recognition | % correct | 97.1 | — | — | 136/140 | p.15 |
| Scared exact recognition | % correct | 51.8 | — | — | 72/139 | p.15 |
| Glad exact recognition | % correct | 48.2 | — | — | 66/137 | p.15 |
| Angry exact recognition | % correct | 43.9 | — | — | 61/139 | p.15 |
| Surprised exact recognition | % correct | 43.9 | — | — | 61/139 | p.15 |
| Disgusted exact recognition | % correct | 42.1 | — | — | 59/140 | p.15 |
| Disgusted adjusted recognition | % correct | 80.7 | — | — | 113/140; substitution is Angry | p.15 |
| Glad adjusted recognition | % correct | 83.2 | — | — | 114/137; substitution is Surprised | p.15 |
| Scared adjusted recognition | % correct | 72.7 | — | — | 101/139; substitution is Surprised | p.15 |
| Surprised adjusted recognition | % correct | 72.7 | — | — | 101/139; substitution is Glad | p.15 |
| Angry adjusted recognition | % correct | 65.5 | — | — | 91/139; substitution is Disgusted | p.15 |
| Chance baseline | % correct | 17 | — | — | Six-alternative forced choice | p.14 |

## Key Equations / Statistical Models

The paper reports no formal equations. The only statistical model is a chi-squared test of the forced-choice contingency data:

$$
\chi^2 = 823.21, \quad df = 5, \quad p = 0.01
$$
Where: χ² is the Pearson chi-squared statistic computed from the forced-choice response counts, df is degrees of freedom (five, i.e. six response categories minus one), and p is the significance threshold at which the null hypothesis of chance-level (17%) recognition is rejected. *(p.14)*

## Methods & Implementation Details
- Parameters are quantified on a −10..+10 scale, 0 = neutral affect; effects may be asymmetric above vs below zero. *(p.6)*
- Descriptive quantifiers *more* / *less* are implemented as moving parameter values away from / toward zero. *(p.6)*
- Utterance input is a clause tree annotated per case-frame analysis; prosodic annotations attach at both clause level (pitch range, speech rate) and word level (pitch accents). *(p.7)*
- Initial analysis enumerates **all possible** pitch accent and pause locations from phrase structure and syntactic category; the emotion's parameter values then act as a **filter on the most extreme effects**, selecting which possibilities are realized. *(p.7)*
- Pitch accent assignment combines *stress frequency* with per-word pitch-accent probability, which depends on how central the word is to utterance meaning; changing those probabilities may change utterance interpretation. *(p.7)*
- Output is two strings: a settings string (prosody and voice quality) and an utterance string (English text + ARPAbet phonemes + phoneme durations + pauses + intonation markings). *(p.7-8)*
- Non-lexical (phrase-level and voice-quality) instructions are sent **before** the utterance is processed. *(p.8)*
- Four internal representations in sequence: emotion acoustical correlates + clause tree → linear phonology with acoustic features → synthesizer phonology → synthesizer instruction string. *(p.8, Fig. 1 p.9, Fig. 2 p.10)*
- Contour slope realized by placing a high F0 on the utterance-final word (rising) or the utterance-initial word (falling). *(p.8)*
- Pauses realized by inserting a silence character; pause-onset smoothness by inserting phonemes before the silence. *(p.8)*
- Precision of articulation realized by phoneme substitution or addition. *(p.8)*
- Amplifier bass/treble/balance fixed at mid-points across all subjects for experimental control. *(p.12)*
- Acclimation paragraph spoken in relatively neutral affect before stimuli. *(p.14)*

## Figures of Interest
- **Fig 1 (p.9):** Affect Editor program flow of control, illustrated by data structure creation and transformation. Input emotion + utterance; the dotted line separates synthesizer-independent activity (above) from synthesizer-dependent (below). Left branch produces synthesizer settings from acoustical correlates; right branch produces synthesizer phonology from the acoustic-feature-annotated phonology.
- **Fig 2 (p.10):** Affect Editor user interface. Left column is a scrolling EMOTIONS list showing 13 selectable emotions: Afraid, Angry, Annoyed, Disgusted, Distraught, Glad, Indignant, Mild, Plaintive, Pleasant, Pouting, Sad (selected, shown bold), Surprised. Middle column is the parameter panel grouped PITCH / TIMING / VOICE QUALITY / ARTICULATION. Right column shows five stacked panes: SENTENCES, phrase structure, phonology, DECtalk phonology, DECtalk string.
- **Fig 3 (p.16):** Bubble-plot confusion matrix, stimulus emotion on x, subject response on y, bubble area and inscribed number giving the response count over all subjects.

## Results Summary
Six emotions synthesized through the Affect Editor and DECtalk3 were recognized at 53.5% exact and 78.7% adjusted, against a 17% chance baseline, χ² = 823.21 (df = 5), significant at p = .01. Sadness was by far the most recognizable (91% exact, 97.1% adjusted), consistent with its acoustically extreme profile. Errors were structured, not random, mirroring human-speech confusion patterns: substitutions clustered among emotions sharing acoustical features (glad/surprised, angry/surprised) and, more strongly, among emotions sharing semantics (angry/disgusted, glad/surprised). Utterance semantics measurably colored judgments despite the effort to use affectively neutral sentences. *(p.14-15)*

## Limitations
- The authenticity of the affect is limited by synthesizer capabilities and by incomplete descriptions of the acoustical and perceptual phenomena. *(p.1)*
- The subjective semantic aspect of emotion is entirely ignored; only acoustic correlates are modeled. *(p.2)*
- The prior literature is few, sporadic, and contradictory or unclear about the more intentional (speaker-controlled) effects; findings agree only on physiologically based correlates. *(p.2)*
- **Exaggeration** was not implemented: its implementation introduced unwanted side effects, and DECtalk could not handle instructions in which many ASCII characters specify a short-lived event. *(p.4-5, p.11)*
- **Tremor** was not implemented: DECtalk3 cannot produce tremor in its output. *(p.6, p.11)*
- Precise word-by-word pitch contour control was prevented by the same instruction-density limit; too many pitch and duration instructions caused the synthesizer to temporarily stop speaking. *(p.11)*
- Specifying a word with phonemes rather than English text lowers its F0 as an unwanted side effect. *(p.8)*
- Word stress markings sometimes affect the pitch contour of the entire utterance by preventing other stressed words from receiving stress. *(p.8, p.11)*
- Changes to average pitch automatically change pitch range, so listeners perceive a change of **speaker** rather than of **affect**. *(p.11)*
- Synthesizer limitations made it hard to tell whether an emotion was poorly specified or correctly specified but poorly reproduced. *(p.8)*
- Affectively neutral sentences proved unusable; the stimulus criterion had to be relaxed to plausibility in each affective context, and utterance semantics still colored judgments. *(p.12, p.15)*
- Only forced-choice data were analyzed; magnitude, certainty and comment data were collected but unused in the tabulations. *(p.14, p.15)*
- The model deliberately incorporates few assumptions about parameter interactions, so known correlations (pitch range, speech rate, loudness, timbre, enunciation) are not encoded. *(p.3, p.17)*

## Arguments Against Prior Work
- Prior emotion-in-speech studies (acoustics and psychology traditions alike) are **few and occur sporadically over the course of years**, and are **contradictory or unclear** precisely about the intentional effects the speaker most controls; they agree only on physiologically based correlates. *(p.2)*
- Psychoacoustic work shows that acoustically similar but semantically different emotions (anger/enthusiasm, boredom/sadness) are routinely confused, so acoustic description alone under-determines emotion identity [Davitz 1964]. *(p.2)*
- Semantic models of emotion, independent of speech correlates [Davitz 1964, Scherer 1974], are set aside as premature: the main task at this stage is completing the **acoustical** model with the right parameters in the right relation. *(p.2)*
- The generative (speaker) model, though theoretically preferred, requires a more complete understanding of speech production than exists, and its parameters are not explicit and quantified in a way that permits direct perceptual testing. *(p.3)*
- DECtalk's global intonation control is criticized against the **two-tone, primarily local** annotation of Pierrehumbert and colleagues, which would avoid the whole-utterance side effects of word stress markings. *(p.11)*

## Design Rationale
- **Acoustical (listener) model over generative (speaker) model**: simpler, requires less complete understanding of speech production, and its perceptual parameters are explicit and quantified so their effects can be directly manipulated to test perceptual responses and thereby improve the model. More is known about acoustic correlates of emotion than about speaker cognition and physiology. *(p.3)*
- **Independent parameters with few interaction assumptions**: gives direct individual control, supports investigation of relationships among parameters, and avoids overgeneralizing from the observation that physiologically influenced parameters covary. *(p.3)*
- **Scale centered at 0 with range −10..+10**: places neutral affect at mid-range so *more* and *less* map directly onto distance from zero, providing a basis for eventual automation. Also supports correlating perceptual effects and thresholds with model quantities. *(p.6)*
- **Synthesizer-independent acoustical representation with a per-synthesizer interpretation layer**: the same emotion description can drive different synthesizers; one-to-many and many-to-one mappings are handled at the interpretation step, and parameters the synthesizer lacks are implemented in software. *(p.8)*
- **Pause discontinuity introduced purely as a compensation parameter** for a synthesizer artifact (abrupt cessation of phonation at the silence phoneme), an explicit case of a model parameter existing to cancel a synthesizer defect. *(p.5-6)*
- **Filter semantics for realization**: enumerate all possible pitch-accent and pause sites structurally, then let emotion parameter values filter the most extreme effects, rather than generating sites from the emotion directly. *(p.7)*
- **Emotion selection for the experiment**: six semantically distinct, often acoustically or semantically extreme emotions, so judgments reflect the system's performance rather than subjects' internal emotion semantics. *(p.12)*
- **Optional magnitude / certainty / comment channels**: added to reduce the frustration of forced choice and let subjects feel their responses conveyed their perceptions. *(p.14, p.15)*
- **DECtalk3 chosen** for the scope and variety of its prosodic and voice quality controls. *(p.8)*

## Testable Properties
- Every model parameter lies in [−10, +10] with 0 denoting neutral affect. *(p.6)*
- The effect of a parameter need not be symmetric about zero: for laryngealization the −10→0 difference is minimal while the 0→+10 difference is significant. *(p.6)*
- Higher *stress frequency* ⇒ more stressable words become stressed ⇒ more peaks in the pitch contour. Monotonic. *(p.4, p.5)*
- Words classified as non-stressable (usually function words) receive no distinctive pitch at any value of *stress frequency*. Invariant. *(p.5)*
- Higher *contour slope* ⇒ rising pitch contour. *(p.12)*
- Lower *precision of articulation* ⇒ slurred speech. *(p.12)*
- Higher *brilliance* ⇒ stronger high-frequency energy (the parameter is defined as a low-to-high energy ratio but a high value means strong high frequency energy). *(p.5)*
- Sympathetic-arousal emotions (fear, anger, joy) should show high loudness, high speech rate, high precision, and strong high-frequency energy; parasympathetic-arousal emotions (boredom, sadness) should show low speech rate, low average pitch, and weak high-frequency energy. Table 1 satisfies this for Scared and Angry (loudness 10, brilliance 10, speech rate 10 and 8) and for Sad (speech rate −10, brilliance −9, loudness −5). *(p.2, p.13)*
- Recognition of intended affect must exceed the 17% chance level for the approach to be validated; observed 53.5% exact, 78.7% adjusted. *(p.14, p.15)*
- The most acoustically distinct emotion should be the most recognizable; sadness at 91% exact is the maximum in the set. *(p.14, p.15)*
- Misrecognitions should fall on emotions with similar acoustic or semantic correlates, not be uniformly distributed. Confirmed by the structure of Figure 3. *(p.14, p.16)*
- Changing average pitch in DECtalk3 necessarily changes pitch range, producing a perceived change of speaker. Any synthesizer intended for affect control must decouple these. *(p.11)*
- The number of ASCII characters per unit time in a DECtalk3 instruction stream has an upper bound above which the synthesizer temporarily stops speaking. *(p.11)*

## Relevance to Project
This is the canonical source for **emotion control by rule in a Klatt-family formant synthesizer**, and it is directly usable rather than merely historical:

1. **A ready-made emotion parameter set.** Table 1 gives 17 named parameters × 6 emotions of concrete values on a normalized −10..+10 scale. A formant synthesizer project wanting emotion presets can adopt this table wholesale as the specification of Angry, Disgusted, Glad, Sad, Scared, Surprised, and it comes with published recognition rates so the implementation can be validated against a known target (53.5% exact / 78.7% adjusted, sadness 91%).
2. **The parameter taxonomy maps onto source-filter controls.** Breathiness (aspiration noise mixed with voicing at non-fricative phonemes), brilliance (spectral tilt / high-frequency energy), laryngealization (open quotient, glottal pulse width, F0 period irregularity), loudness (subglottal pressure → amplitude of voicing), tremor (cycle-to-cycle jitter) are all direct Klatt-synthesizer source parameters (AH, TL/spectral tilt, OQ, AV, FL/jitter). The paper's descriptions of each in physiological terms are the bridge from the affect layer to a glottal-source model.
3. **The layering is the right architecture.** Synthesizer-independent acoustical correlates → per-synthesizer interpretation → instruction string is exactly the separation a modern project wants between an emotion/voice-quality API and a specific back end. Figure 1 is a usable architecture diagram.
4. **The −10..+10 normalized scale with neutral at zero** and *more*/*less* as distance from zero is a clean, implementable interpolation scheme for a voice-quality or emotion API, and it makes blending and intensity scaling trivial.
5. **The failure list is a requirements list.** Every DECtalk limitation Cahn names is something a modern implementation should get right: decouple average pitch from pitch range; make word-level stress marks strictly local; allow dense per-phoneme pitch and duration control without dropouts; support tremor/jitter; support duration exaggeration; expose precision of articulation and overall contour slope as first-class controls. A project that provides these directly outperforms the 1990 baseline on the same parameter set.
6. **Rule-level realization techniques** that transfer: contour slope by placing a high F0 on the first or last word; pauses as inserted silence; pause-onset smoothness by inserting phonemes before the silence; articulation precision by phoneme substitution or addition; hesitation pause placement after the first function word in a clause.
7. **Evaluation methodology** transfers directly: six-alternative forced choice, chance baseline of 17%, exact vs adjusted scoring, the five affectively plausible carrier sentences, and the finding that affectively neutral carriers do not work.

## Open Questions
- [ ] What are the actual DECtalk3 numeric ranges behind `pr`, `as` and `:ra`? The paper gives only the Sad instance (50, 30, 122 wpm), not the mapping function from the −10..+10 scale.
- [ ] The paper never states the transfer functions from model parameters to synthesizer settings, only that the mappings are one-to-many and many-to-one. The concrete rules live in Cahn (1989), the master's thesis.
- [ ] What do the integer suffixes in `[FLUENT-1]`, `[FLUENT-2]`, `[FLUENT-3]`, `[HESITATION-1]` denote? Pause strength, pause duration class, or site rank?
- [ ] How are `<topline>` and `<lowering>` computed from the six pitch parameters? Both are single scalars while six pitch parameters feed them.
- [ ] The interface (Fig. 2) offers at least 13 emotions (Afraid, Angry, Annoyed, Disgusted, Distraught, Glad, Indignant, Mild, Plaintive, Pleasant, Pouting, Sad, Surprised, in a scrolling list that may hold more) but only six were evaluated. Parameter values for the others are not published here.
- [ ] Figure 3's Angry column sums to 138 against 139 presentations, and the caption says "glad in thirteen" where the plotted bubble reads 12. One response is unaccounted for.
- [ ] How would the model change if parameter dependencies were added, as the conclusion proposes? Which parameters should merge or be removed?
- [ ] The difference between **recognizability** and **naturalness** was raised by the unused magnitude/certainty data but not investigated.
- [ ] How does the perception of speaker identity interact with the perception of affect? Subject #20's comment makes this concrete.

## Related Work Worth Reading
- **Cahn, J. E. (1989). Generating expression in synthesized speech. Master's thesis, MIT.** The full account, including the parameter-to-DECtalk transfer functions this paper only summarizes. Highest priority follow-up.
- **Williams, C. E. & Stevens, K. N. (1972). Emotions and speech: Some acoustical correlates. JASA 52(4 Pt 2):1238-1250.** Source of the tremor/jitter observation in fearful speech; primary acoustic measurements.
- **Williams, C. E. & Stevens, K. N. (1981). Vocal correlates of emotional states.** Source of the sympathetic/parasympathetic physiological account that grounds the whole model.
- **Davitz, J. (1964). The Communication of Emotional Meaning, pp. 57-68, 105-154. McGraw-Hill.** Source of the confusion structure among acoustically and semantically similar emotions, and of the covariation of pitch range, rate, loudness, timbre and enunciation.
- **Pierrehumbert, J. B. (1980). The Phonology and Phonetics of English Intonation. PhD thesis, MIT.** The two-tone local intonation description Cahn proposes as the fix for global side effects.
- **Anderson, M., Pierrehumbert, J. B. & Liberman, M. Y. (1984). Synthesis by rule of English intonation patterns. ICASSP, 2.8.1-2.8.4.** Source of the *reference line* concept.
- **Fairbanks, G. & Pronovost, W. (1939). An experimental study of the pitch characteristics of the voice during the expression of emotions. Speech Monographs 6:87-104.** Early per-emotion F0 measurements feeding Table 1.
- **Scherer, K. R. (1974). Acoustic concomitants of emotional dimensions: Judging affects from synthesized tone sequences.** Perceptual judgments from synthesized stimuli.

## Quotes Worth Preserving
- "Synthesized speech need not be expressionless." *(p.1)*
- "The findings agree on the speech correlates that are physiologically based, and are contradictory or unclear about effects that are more intentional, that is, those effects over which the speaker has the most control." *(p.2)*
- "Parameters are quantified on a scale centered at zero and whose values range from negative ten to ten." *(p.6)*
- "The mapping of Affect Editor parameters to DECtalk3 capabilities involves both one-to-many and many-to-one mappings from the acoustical parameters to the synthesizer settings." *(p.8)*
- "Its limitations made it hard to determine whether an emotion had been poorly specified or correctly specified but poorly reproduced." *(p.8)*
- "Changes to average pitch automatically affect the pitch range as well, such that one perceives a change of speaker rather than affect." *(p.11)*
- "The most limiting feature, however, was the synthesizer's inability to handle an instruction in which many ASCII characters specified a short-lived event." *(p.11)*
- "Errors were not random, but followed the pattern of errors made in the identification of affect in human speech." *(p.14)*
- "Ultimately, the automatic generation of affect in synthesized speech will be best served with a generative model, most likely a representation of the speaker's mental and physiological states." *(p.17)*

## Author Biography *(p.19)*
Janet Cahn was at the time a doctoral student in the Speech Research Group at the MIT Media Laboratory, also working with the Natural Language Group at Hewlett Packard Laboratories in Palo Alto, California. The affect work was the subject of her master's thesis at the Media Laboratory.

---
*Provenance: read from `pngs/page-000.png` through `pngs/page-018.png` (19 pages, all read) via the paper-reader page-image lane. Figure 2's DECtalk panes were additionally verified at 9x magnification.*
