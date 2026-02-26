# Intonational Phonology (2nd Edition)

**Authors:** D. Robert Ladd
**Year:** 2008
**Venue:** Cambridge University Press (Cambridge Studies in Linguistics, 79)
**DOI/URL:** ISBN 978-0-521-67843-5

## One-Sentence Summary

This book provides the definitive theoretical framework for representing intonation as sequences of discrete H and L tonal targets associated with metrically prominent syllables and prosodic boundaries, with explicit rules for F0 scaling (downstep ratio k ~0.6), segmental anchoring of tonal targets, pitch range normalization, and prosodic phrasing -- all directly implementable in a TTS F0 generation module.

## Problem Addressed

The study of intonation historically suffered from a split between impressionistic linguists describing categorical pitch patterns and experimental phoneticians measuring continuous F0 correlates, with neither approach producing a complete phonological account. Ladd bridges these traditions through the Autosegmental-Metrical (AM) framework, demonstrating that intonation has genuine phonological structure analogous to segmental phonology -- a finite set of categorically distinct tonal elements that map systematically to continuous F0 contours.

## Key Contributions

- Comprehensive exposition of the AM (Autosegmental-Metrical) theory of intonation as a mature phonological framework, unifying work from Pierrehumbert (1980), Beckman, Bruce, Bolinger, and the IPO tradition
- Complete inventory and phonetic description of English pitch accent types, phrase accents, and boundary tones with Pierrehumbert-to-British-school correspondence mappings (Table 3.1, p. 91)
- Resolution of the levels-vs-configurations debate by reducing distinctive levels to two (H and L) while acknowledging pitch accents as compositional units
- Treatment of declination as iterated local downstep rather than a global overlay, with constant-proportion downstep ratio (k ~0.6)
- Distinction between association (phonological) and alignment (phonetic) of tonal targets, with the segmental anchoring hypothesis
- Three-way classification of pitch range scaling factors: intrinsic (tonal identity), extrinsic (paralinguistic range modification), and metrical (downstep, nested register effects)
- Pitch range normalization model with independent level and span parameters
- Metrical theory of sentence stress linking focus to designated terminal elements (DTEs) rather than directly to pitch accents
- Compound Prosodic Domain (CPD) framework allowing recursive prosodic structure while preserving the flatness of prosodic trees
- Extensive cross-linguistic survey (~30 languages) demonstrating both universals and systematic variation in intonational phonology

## Book Structure Overview

- **Part I: Preliminaries** (Ch. 1-2): Defines intonation, reviews the IPO tradition, introduces AM theory's four tenets (sequential tonal structure, accent/stress distinction, level tone analysis, local sources for global trends), and covers pitch accent, stress, metrical structure, and tune-text association
- **Part II: Pitch** (Ch. 3-5): Pierrehumbert's English analysis, ToBI transcription, cross-linguistic AM descriptions (calling contour, HRT, suspended-fall), issues in tonal identification and organization, semantic compositionality, tone-intonation interactions, alignment/segmental anchoring, and pitch range scaling
- **Part III: Phrasing and Prominence** (Ch. 6-8): Sentence stress patterns (broad/narrow focus, deaccenting, predicate/argument accentability), metrical theory of sentence stress, prosodic structure (Strict Layer Hypothesis, Compound Prosodic Domains), and the three-layer pitch scaling model

## Methodology

Ladd uses the AM (Autosegmental-Metrical) theoretical framework, combining:
- Autosegmental phonology (tones as independent entities on separate tiers from segments)
- Metrical phonology (prominence as relational structure in binary-branching trees)
- Extensive cross-linguistic comparison organized by a four-way typological taxonomy (semantic, systemic, realisational, phonotactic differences)
- Integration of experimental phonetic data (F0 measurements, perceptual studies) with phonological analysis

## Core Theoretical Framework: AM (Autosegmental-Metrical) Theory

### Four Basic Tenets (p. 44)

1. **Sequential tonal structure**: Tonal structure is a string of local events at defined points in the segmental string. Between events, pitch is phonologically unspecified (transitions). Main event types: pitch accents (at prominent syllables) and edge tones (at prosodic boundaries).
2. **Distinction between pitch accent and stress**: Pitch accents are intonational features associated with syllables per prosodic principles. Perceived prominence involves metrical strength and/or dynamic stress, distinguishable from pitch accent.
3. **Analysis in terms of level tones**: Pitch accents and edge tones are composed of primitive level tones: High (H) and Low (L). By reducing to two levels, the levels-vs-configurations debate is eliminated (p. 72).
4. **Local sources for global trends**: The scaling of any H or L tone depends on factors orthogonal to its identity. Global trends like declination reflect localized but iterated scaling changes rather than a single global function.

### Pitch Accent Types

**Pierrehumbert's original 7 types** (p. 92): H*, L*, L+H*, L*+H, H+L*, H*+L, H*+H

**Revised Beckman-Pierrehumbert / MAE_ToBI inventory** (p. 105): 5 pitch accents:
- **H***: Local F0 peak aligned with accented syllable. Between two H* accents, a "sag" (local dip) occurs rather than straight interpolation (pp. 92, 112, 155-157).
- **L***: Local F0 valley on accented syllable.
- **L+H***: Rise to H* with preceding L target; more substantial rising movement than plain H* (p. 96). L precedes accented syllable.
- **L*+H**: L target on accented syllable, rise follows. The starred tone L aligns with the accented syllable.
- **H+!H***: Downstepped accent stepping down from preceding level. Replaces Pierrehumbert's H*+L (p. 100).

**Downstep diacritic** (!): Applicable to any H tone preceded by another H tone in the same phrase.

**Correspondence to British nuclear tones** (Table 3.1, p. 91):
| Pierrehumbert | British-style |
|---|---|
| H* L L% | fall |
| H* L H% | fall-rise |
| H* H H% | high rise |
| L* L L% | low fall |
| L* L H% | low rise (narrow range) |
| L* H H% | low rise |
| L+H* L L% | rise-fall |
| L+H* L H% | rise-fall-rise |
| L*+H L L% | rise-fall ('scooped') |
| L*+H L H% | rise-fall-rise ('scooped') |
| H+L* L L% | low fall (with high head) |
| H*+L H L% | stylised fall ('calling contour') |

### Boundary Tones

Two levels of edge tones in the revised analysis:

**Phrase accents** (edge tones of the intermediate phrase, ip):
- **H-**: High pitch following the last pitch accent. Maintains elevated F0 until boundary.
- **L-**: Low pitch following the final pitch accent. F0 drops to low level and stays low (tone-spreading). Fall occurs fairly soon after the nuclear accent (pp. 101-103).

**Boundary tones** (edge tones of the intonation phrase, IP):
- **H%**: Final rise at the very end of the phrase. After L phrase accent, requires an upstep rule to ensure H% exceeds preceding levels (pp. 103-104).
- **L%**: Not a final fall but the absence of final rise. After L phrase accent = gradual continued fall to bottom of range. After H phrase accent = sustained level pitch (pp. 103-104).

**Initial boundary tone**: %H (one type in MAE_ToBI).

### Tonal Composition

Tunes are generated by a finite-state grammar (Pierrehumbert 1980, Figure 3.1, p. 89):
```
[%T] -> T* ... T* -> T- -> T%
```
where T = H or L. All combinations of accent types with edge tones are legal (free combination). The tune has constituent structure (p. 285-286):
- A **nucleus** (head) -- the nuclear/last accent, obligatory
- **Postnuclear** elements (complement) -- phrase accent and boundary tone
- Optional **prenuclear** elements -- their number depends on how many metrically strong syllables are available

The tune is "more abstract than a string of tones" (p. 286) -- tonal elements are not intrinsically accent tones or edge tones; their surface realization depends on the metrical structure of the text.

## Key Concepts

### Downstep and Pitch Range

**Downstep** (pp. 76-78, 97-100, 305-308): The stepwise lowering of pitch at specific pitch accents. Each accent peak in a downstep series is a constant proportion of the previous peak:
```
F0_n = F0_initial * k^n    (k ~ 0.6, from Pierrehumbert 1980)
```
Confirmed for English (Liberman and Pierrehumbert 1984), Dutch (van den Berg et al. 1992), and German (Truckenbrodt 2002).

**Declination vs. downstep** (p. 76, Figure 2.5): Two competing models:
- (a) Gradual declination: overall contour slope directly specified (Fujisaki, IPO)
- (b) Iterated downstep: apparent slope emerges from repeated local lowering at each accent
AM models prefer (b) -- targets generated left-to-right with local lookback only.

**Final lowering** (pp. 79-80): The final accent in a series is invariably lower than the constant-proportion model predicts. Two distinct effects: downstep AND final lowering, each making its own contribution.

**Nested downstep** (p. 307): Downstep within phrases can be superimposed on an overall downward trend from phrase to phrase across the utterance. Metrical h-l relations apply at both accent level and phrase level.

**Three kinds of pitch range scaling factors** (p. 306):
1. **Intrinsic**: Different specifications relative to the tonal space (e.g., H tone vs. L tone)
2. **Extrinsic**: Overall modifications of level and span (paralinguistic emphasis, emotion)
3. **Metrical**: Localized, structurally-conditioned modifications (downstep, nested register effects)

**Pitch range level vs. span** (pp. 197-198): Two partially independent dimensions. Level = overall height of voice. Span = width of frequency range. These cannot be collapsed into a single parameter. Raising the voice primarily expands span from the bottom up (bottom of range is approximately constant, pp. 203-205).

**Pitch range normalization model** (p. 204):
```
F0 = F_R * T * N * r
```
- F_R = bottom-of-range reference level (Hz), relatively constant per speaker
- T = abstract pitch value for target in normal range
- N = speaker-specific span normalisation factor
- r = range multiplier (1.00 for normal)

An additive component is also needed: pitch range modification involves both multiplicative scaling AND an additive shift to the reference level (p. 205).

### Alignment

**Association vs. alignment** (p. 179): Association is phonological ("belonging together"). Alignment is phonetic (relative timing of F0 events and segmental landmarks). Association entails no detailed predictions about alignment -- a tone associated with a syllable may peak early, late, or even outside the syllable.

**Segmental anchoring** (pp. 174-178): F0 turning points are aligned with specific segmental landmarks rather than having fixed slopes or durations. Key finding from Greek prenuclear accents (Arvaniti, Ladd, and Mennen 1998):
- Beginning of accentual rise: aligned at beginning of accented syllable
- End of accentual rise (peak): aligned at beginning of following unstressed vowel
- Rise duration is NOT fixed -- it depends on the interval between these two segmental anchors
- Slope of rise adjusts according to available time
- F0 levels at turning points are roughly constant per speaker

Replicated across many languages: English, Japanese, Catalan, Chinese.

**Sagging transition** (pp. 92, 134, 155-157): Between two H* accents, pitch does not interpolate linearly. Instead it gradually sags after first H*, then rises abruptly just before second H*. The rise beginning is abrupt and simultaneous with onset of accented syllable; the F0 level of the rise onset is consistent regardless of distance between accents -- evidence for an actual L tonal target (Ladd and Schepman 2003, 2005).

**Compression vs. truncation** (pp. 181-183):
- **Compression** (English): All tones squeezed onto available segmental material (e.g., L*+H L H% on monosyllable "Sue!?")
- **Truncation** (Hungarian): Trailing tones dropped when insufficient material (question tune L*_H_L% on monosyllable only realizes L*+H)
- **Replacement** (German/Dutch): Different tune substituted to avoid phonetic pressure

**Prenuclear vs. nuclear peak alignment**: Nuclear accent peaks are generally aligned earlier in the syllable than prenuclear peaks (Steele 1986, Silverman and Pierrehumbert 1990).

### Focus and Prominence

**Focus-to-Accent (FTA) theory** (pp. 217-218): Separates semantic/pragmatic focus specification from phonological accent placement. Normal stress = broad focus; contrastive stress = narrow focus; both involve the same kind of accent, only placement differs.

**Broad focus**: The prominence pattern appropriate in a wide range of contexts. In English, accent defaults to the last content word in the phrase (pp. 213-215, 258). This is the nuclear accent (DTE of the largest phrase).

**Narrow focus**: Accent on a non-default word, implying contrastive or corrective reading. "The special significance of the last accent lies not in any actual phonetic prominence it may have, but in the key role it plays in defining the pattern of prominence. It need not be specially prominent; it need only be present." (p. 259)

**Emphasis vs. accent**: Emphasis (increased pitch range, intensity) is gradient and paralinguistic. Accent placement is categorical and linguistic. They are independently controllable (pp. 255-257).

**Deaccenting** (pp. 231-236): Removal of accent from given/repeated material. Cross-linguistic typology:
- **Deaccenting languages** (English, Dutch, German): freely deaccent given material
- **Non-deaccenting languages** (Italian, Romanian, Spanish): resist deaccenting; use word order changes instead
- Treated as metrical reversal, not just accent removal (pp. 270-271)

**Metrical theory of sentence stress** (pp. 263-280): Focus is signaled by relative metrical strength (DTEs), not directly by pitch accents. Accommodates accent without focus, focus without accent, deaccenting as metrical reversal.

### Phrasing

**Prosodic hierarchy** (pp. 288-299):
- Intonation Phrase (IP): boundary tone T% at edge, break index 4
- Intermediate phrase (ip): phrase accent T- at edge, break index 3
- Prosodic Phrase/Word: lower-level grouping

**Break Index Scale** (ToBI, pp. 105-107):
- 0: Special closeness (cliticization)
- 1: Normal word boundary
- 2: Mismatch between tonal and other cues
- 3: Intermediate phrase boundary (requires phrase accent)
- 4: Intonation phrase boundary (requires phrase accent + boundary tone)

**Strict Layer Hypothesis** (pp. 291-293): Prosodic structure has fixed depth with strictly ranked domain types. No recursion, no level-skipping.

**Compound Prosodic Domains** (pp. 297-304): Ladd's alternative allowing recursive prosodic structure -- a domain of type X whose immediate constituents are also type X. Preserves flatness while accounting for variable boundary strength. Boundary strength correlates with F0 reset height and pause duration (p. 295).

### Cross-linguistic Patterns

**Calling contour** (pp. 116-119): Universal pattern with two sustained notes stepping down ~3 semitones. Language-specific association rules:
- English/German: accent-driven (H* on stressed syllable, !H on following)
- Hungarian/French: last two syllables regardless of stress
- Dutch: accent-driven with multiple postnuclear !H steps possible

**Question intonation** is NOT universally rising (pp. 81-84, 224-228):
- English: H* H H% (rising)
- Hungarian/Greek/Romanian: L* H L% (Eastern European Question Tune -- low nucleus, then rise-fall)
- Russian: L+H* L (high peak on verb)

**Sentence stress typology** (pp. 222-253):
- YNQ accent: English-type (same as statement) vs. Russian-type (accent on verb)
- WHQ accent: WH-word accented (Romanian, Hungarian, Greek) vs. not specially accented (English, Germanic)
- Deaccenting: plastic (English) vs. non-plastic (Italian) languages
- Predicate/argument: nouns more accentable (English) vs. rightmost word (Italian)

**Focus expression** (pp. 278-280):
- Deaccenting languages (English, Dutch): focus via presence/absence of pitch accents
- Dephrasing languages (Japanese, Korean, Chichewa): focus via presence/absence of phrase boundaries
- Both are "different surface symptoms of the same deeper structural effects" (p. 280)

## Parameters

| Name | Description | Units | Range | Notes |
|------|-------------|-------|-------|-------|
| k (downstep ratio) | Proportional reduction per downstepped accent | ratio | ~0.6 | From Pierrehumbert 1980; confirmed cross-linguistically |
| F_R | Speaker's bottom-of-range reference frequency | Hz | speaker-dependent | Relatively constant within a speaker |
| T | Abstract pitch target value in normal range | ratio | >1.0 | H maps near top of tonal space, L near bottom |
| N | Speaker-specific span normalization factor | ratio | speaker-dependent | Normalizes for inter-speaker span differences |
| r | Utterance-level range multiplier | ratio | ~1.0 | 1.0 for normal; >1.0 for expanded range |
| Calling contour interval | Step between H and !H in calling contour | semitones | ~3 | Appears universal across languages |
| Peak alignment (high-fall) | Peak position after vowel onset | ms | ~35 | Ashby 1978; little variation |
| Low rise slope | Fixed slope of low-rise contour | oct/sec | 6.7 | Ashby 1978 |
| Peak control precision | SD of sentence-initial accent peak F0 | Hz | 3.7-11.5 (avg 7.5) | English speakers; comparable to tone language speakers |
| Declination total drop | Total F0 drop across domain | Hz | ~constant | Inversely related to domain length for slope |

## Implementation Details

### F0 Contour Generation from AM Representation

1. **Two-level tone targets**: All F0 contours derive from sequences of H and L targets. Map H to top of tonal space, L to bottom. Tonal space declines across the utterance.

2. **Finite-state tune grammar**: Legal English tunes follow:
   ```
   [%T] T* ... T* T- T%
   ```
   All combinations are legal. Every intermediate phrase must have at least one pitch accent (the nuclear accent).

3. **Downstep**: Apply constant-proportion scaling (k ~0.6) to each successive H target after a downstep trigger. Implement left-to-right with local lookback only.
   ```
   F0_n = F0_initial * k^n
   ```

4. **Final lowering**: Apply additional lowering to the final accent beyond what the downstep ratio predicts. Separate effect from downstep.

5. **Sagging transition between H* accents**: Do NOT use linear interpolation. Pitch gradually sags after first H*, then rises abruptly at onset of next accented syllable. The rise onset F0 is consistent regardless of inter-accent distance.

### Pitch Scaling Algorithm

Three independent layers:
1. **Intrinsic layer**: Tonal string (H/L targets) determines basic pitch relative to current local tonal space
2. **Extrinsic layer**: Global pitch range modifications for paralinguistic effects -- scales entire tonal space (level and span independently)
3. **Metrical layer**: Localized, structurally-conditioned pitch range shifts:
   - Downstep: compress tonal space by k for subsequent H targets
   - Nested downstep: phrase-level declination superimposed on accent-level
   - Declination reset: upward pitch range modification at discourse/paragraph boundaries
   - Final lowering: downward modification at utterance-final positions

**Pitch range model**:
```
F0 = F_R * T * N * r + additive_shift
```
where F_R (reference) is approximately constant per speaker, T varies by tonal target, and r modifies for utterance-level range.

**Level vs. span**: Manipulate independently for paralinguistic modulation:
- Excited/emphatic: raise level AND widen span
- Bored/depressed: lower level AND narrow span
- Bottom of range stays relatively constant when raising voice

### Alignment Rules for Tonal Targets

1. **Segmental anchoring**: Align F0 turning points with segmental landmarks, not fixed durations/slopes:
   - Rise onset: beginning of accented syllable
   - Rise peak: beginning of following unstressed vowel
   - Rise duration varies with segmental distance; slope adjusts accordingly
   - F0 levels at turning points approximately constant per speaker

2. **Accent type alignment**:
   - H*: peak aligned with accented syllable
   - L+H*: L precedes accented syllable, H peak on it
   - L*+H: L valley on accented syllable, H follows
   - H+!H*: peak on accented syllable with step-down following

3. **Nuclear vs. prenuclear**: Nuclear peaks aligned earlier in syllable than prenuclear. Prenuclear peaks align proportionally earlier when under time pressure from nearby accents.

4. **Compression** (English): When multiple tones on limited material, compress all tones into available time. L*+H L H% realizable on single syllable.

### Phrasing and Boundary Insertion

- Break 3 (ip boundary): insert phrase accent (H- or L-)
- Break 4 (IP boundary): insert phrase accent + boundary tone
- Boundary strength is gradient: stronger boundaries show higher F0 reset and longer pauses
- Sentence length affects phrasing: short sentences form single ip; long sentences split into multiple ips each with own nuclear accent

### Accent Placement

1. **Default (broad focus)**: Nuclear accent on last content word in phrase (DTE)
2. **Deaccenting**: Given/repeated material deaccented; accent shifts to other word (metrical reversal)
3. **Indefinite pronouns** deaccented: "They've DISCOVERED something"
4. **Semantically empty nouns** deaccented: "He KILLED a man"
5. **Predicate vs. argument**: Transitive = accent object; unaccusative intransitive = accent subject; generic = accent verb
6. **Prenuclear accents**: Number depends on available metrically strong syllables; same tune identity regardless of count

### Edge Tone Implementation

**After nuclear accent**:
- L phrase accent: drop F0 to low level quickly; maintain low until boundary tone. Duration spans multiple syllables.
- H phrase accent: maintain elevated F0 until boundary.

**At phrase boundary**:
- H%: final rise. After L phrase accent, upstep rule ensures H% exceeds preceding H.
- L%: after L phrase accent = gradual fall to bottom. After H phrase accent = sustained level (no movement).

### Calling Contour

- Two sustained level pitches: H* on nucleus, !H on first postnuclear syllable
- Interval ~3 semitones
- If nucleus is utterance-final, split syllable for two docking sites
- Sustained (level, not falling) pitch on each tone

### Paralinguistic Modulation

Paralinguistic effects modify the realization of phonological categories, not the categories themselves (p. 35). Implement as a post-phonological transformation layer:
- Pitch range expansion/compression (extrinsic scaling)
- Rate changes
- Independent of the tonal sequence

## Figures of Interest

- **Figure 1.1** (p. 7): Independence of tune and relative prominence -- 2x2 matrix showing falling/rising x weak-strong/strong-weak
- **Figure 1.2** (p. 15): IPO "hat pattern" -- pointed hat and flat hat variants with declination lines
- **Figure 1.3** (p. 43): Fujisaki's F0 model block diagram
- **Figure 2.2** (p. 70): Scatter plot of Peak 1 vs Peak 2 F0 (Anna/Manny experiment), showing constant relationship
- **Figure 2.5** (p. 76): Gradual declination vs. iterated downstep -- the two competing models
- **Figure 3.1** (p. 89): Finite-state grammar for English intonation
- **Figure 3.2** (p. 93): "Ramona's a lawyer" as echo question H* H H% vs declarative H* L L%
- **Figure 3.5** (p. 98): Non-downstepping vs. downstepping H* sequences
- **Figure 4.6** (p. 167): Swedish Accent 1 vs Accent 2 under increasing emphasis
- **Figure 5.1** (p. 175): Segmental anchoring in Greek prenuclear accents
- **Figure 5.8** (p. 204): Simple pitch range modification model -- bottom constant, targets scale
- **Figure 7.1** (p. 262): Smoothly declining F0 in broad focus with no obvious medial pitch peaks
- **Figure 8.1** (p. 292): Strict Layer Hypothesis prohibited configurations
- **Tree (33)** (p. 307): Nested downstep -- h-l relations at both accent and phrase levels

## Results Summary

- Intonation in English (and cross-linguistically) has genuine phonological structure: a finite set of categorically distinct tonal elements that combine compositionally
- All F0 contours derive from sequences of just two tones (H and L) combined as pitch accents, phrase accents, and boundary tones
- Declination is best modeled as iterated local downstep (k ~0.6) rather than a global overlay function
- Tonal targets align with specific segmental landmarks (segmental anchoring) rather than having fixed durations or slopes
- Pitch range involves at least two independent dimensions (level and span) and three categories of scaling factors (intrinsic, extrinsic, metrical)
- Focus is signaled by metrical prominence relations (location of DTEs) rather than directly by pitch accent presence
- Deaccenting and dephrasing are surface variants of the same underlying structural mechanism for marking information status
- Cross-linguistically, languages share the same basic AM architecture but differ in tone inventories, association rules, and phonetic realization

## Limitations

- The book is primarily theoretical/descriptive, not a synthesis implementation manual; no F0 generation algorithms are provided directly
- The boundary between linguistic and paralinguistic pitch variation remains unresolved (p. 309)
- The gradient vs. categorical status of some accent type distinctions (e.g., H* vs. L+H*) is unclear (pp. 151-156)
- Alignment as a quantitative phonetic variable is treated abstractly; the segmental anchoring hypothesis needs further refinement for different languages
- The three-tone-maximum constraint on pitch accents is debated (Grice proposes larger accent structures for some Italian dialects, pp. 138-140)
- The starred-tone notation conflates phonological association with phonetic alignment (p. 187)
- Sparse treatment of timing/duration aspects of prosody compared to pitch

## Testable Properties

- Downstepped H* must be lower than preceding H* by a constant proportion (k ~0.6)
- Between two H* accents, F0 must show a sagging transition with abrupt rise at onset of second accented syllable, NOT linear interpolation
- Final accent in a downstep series must be lower than the constant-proportion prediction (final lowering)
- H% boundary tone must be higher than any preceding H in the same phrase (upstep rule)
- Calling contour H-to-!H interval should be approximately 3 semitones
- Nuclear accent must be present in every intermediate phrase (obligatory)
- For broad focus, the last accent in the phrase must fall on the last content word
- Moving the last accent away from the default position must imply narrow focus
- Peak F0 at turning points should be approximately constant per speaker regardless of rise duration (segmental anchoring)
- Raising the voice should primarily expand the span above a relatively constant F_R floor
- Prenuclear peaks should be aligned later in the syllable than nuclear peaks

## Relevance to Project

This book provides the theoretical foundation for Qlatt's F0 generation module. It directly complements:

- **Pierrehumbert_1980_EnglishIntonation**: Ladd's book is essentially the mature theoretical exposition of Pierrehumbert's framework, with extensive refinements. The downstep ratio (k ~0.6), finite-state tune grammar, and tone scaling rules from Pierrehumbert are presented here with full cross-linguistic validation and theoretical justification.

- **Beckman_2022_ToBISystem**: The MAE_ToBI inventory presented by Ladd (5 pitch accents, 2 phrase accents, 2 boundary tones, break indices 0-4) is the same system described in Beckman's work. Ladd provides deeper theoretical motivation for why the system works and how it should be extended.

- **OShaughnessy_1976_F0_Prosody**: Ladd's framework supersedes O'Shaughnessy's accent priority and declination rules with a more principled AM-based system, but the practical implementation concerns (word class effects, declination modeling) remain relevant.

- **Taylor_2000_TiltModelIntonation**: The Tilt model's continuous parameters for pitch accents can be seen as a phonetic realization layer under Ladd's categorical AM system.

For Qlatt's TTS frontend, this book motivates:
1. A categorical intonation representation layer using AM primitives (H*, L*, L+H*, etc.)
2. A scaling/realization layer implementing downstep, pitch range, and segmental anchoring
3. A paralinguistic modulation layer for emotional/stylistic variation
4. Prosodic phrasing with variable boundary strength
5. Focus-driven accent placement using metrical structure

## Open Questions

- [ ] What is the exact additive component needed alongside multiplicative pitch range scaling?
- [ ] How should the tonal space decline rate be parameterized for different utterance lengths?
- [ ] Should F0 generation use the segmental anchoring model or fixed-duration pitch movements?
- [ ] How to implement the gradient emphasis dimension independently of categorical accent placement?
- [ ] Is the sagging transition between H* accents an actual L target or just an interpolation artifact?
- [ ] How should compound prosodic domains be implemented -- as recursive boundary strength or as flat structure with strength weights?
- [ ] What are the quantitative parameters for compression vs. truncation when tones must fit limited segmental material?

## Collection Cross-References

### Already in Collection
- **Pierrehumbert_1980_EnglishIntonation** — foundation of AM theory; Ladd's book is the mature theoretical exposition of Pierrehumbert's framework
- **Beckman_2022_ToBISystem** — the MAE_ToBI inventory that Ladd presents and provides deeper theoretical motivation for
- **OShaughnessy_1976_F0_Prosody** — practical F0 generation rules; Ladd's framework supersedes but the implementation concerns remain relevant
- **Taylor_2000_TiltModelIntonation** — Tilt model's continuous accent parameters as phonetic realization under Ladd's categorical AM system
- **Fujisaki_InformationProsodyModeling** — Fujisaki's F0 model (block diagram shown in Fig 1.3); Ladd contrasts the IPO/Fujisaki superpositional approach with the AM sequential approach

### New Leads (Not Yet in Collection)
- Anderson, Pierrehumbert, and Liberman (1984) — "Synthesis by rule of English intonation patterns" — direct TTS F0 synthesis
- Liberman and Pierrehumbert (1984) — Intonational invariance under pitch range changes
- Gussenhoven (2004) — "The Phonology of Tone and Intonation" — comprehensive AM with three-tone system
- Arvaniti, Ladd, and Mennen (1998) — Segmental anchoring experimental evidence
- Pierrehumbert and Hirschberg (1990) — Compositional semantics of intonation
- Prevost and Steedman (1994) — "Specifying intonation from context for speech synthesis"
- 't Hart, Collier, and Cohen (1990) — "A perceptual study of intonation" (IPO approach)
- Monaghan (1991/1992) — "Intonation in a text to speech conversion system"

### Supersedes or Recontextualizes
- **Pierrehumbert_1980_EnglishIntonation**: Ladd's 2008 treatment refines and extends the original 1980 framework — the 7-accent inventory is reduced to 5 in MAE_ToBI, alignment is treated more carefully, and cross-linguistic validation is provided. The original remains essential for the formal finite-state grammar and implementation rules.
- **OShaughnessy_1976_F0_Prosody**: Ladd provides a more principled phonological basis for accent placement and declination modeling, though O'Shaughnessy's practical word-class accent hierarchy and phonetic adjustment rules remain implementationally useful.

## Related Work Worth Reading

**Already in collection:**
- Pierrehumbert (1980) -- Foundation of AM theory [Pierrehumbert_1980_EnglishIntonation]
- Beckman (2022) -- ToBI transcription system [Beckman_2022_ToBISystem]
- O'Shaughnessy (1976) -- F0 prosody rules [OShaughnessy_1976_F0_Prosody]
- Taylor (2000) -- Tilt model [Taylor_2000_TiltModelIntonation]
- Fujisaki -- F0 model (referenced extensively)

**Not in collection, worth acquiring:**
- Anderson, Pierrehumbert, and Liberman (1984) -- "Synthesis by rule of English intonation patterns" -- direct TTS F0 synthesis implementation
- Liberman and Pierrehumbert (1984) -- Intonational invariance under changes in pitch range and length
- Gussenhoven (2004) -- "The Phonology of Tone and Intonation" -- comprehensive AM treatment with three-tone system
- Silverman and Pierrehumbert (1990) -- Alignment effects of prosodic context on prenuclear peaks
- Arvaniti, Ladd, and Mennen (1998) -- Segmental anchoring experimental evidence
- Pierrehumbert and Hirschberg (1990) -- Compositional semantics of intonation
- Bruce (1977) -- Swedish word prosody (foundational for segmental anchoring and metrical theory)
- Steedman (2000) -- Information structure and intonation semantics
- Prevost and Steedman (1994) -- "Specifying intonation from context for speech synthesis"
- 't Hart, Collier, and Cohen (1990) -- "A perceptual study of intonation" (IPO approach)
- Monaghan (1991/1992) -- "Intonation in a text to speech conversion system"
- Willems, Collier, and de Pijper (1988) -- "A synthesis scheme for British English intonation"
- Shriberg et al. (1996) -- "Modeling pitch range variation within and across speakers"
- Truckenbrodt (2002) -- Nested downstep evidence
