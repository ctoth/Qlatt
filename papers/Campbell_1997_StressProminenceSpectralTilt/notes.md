---
title: "Stress, Prominence, and Spectral Tilt"
authors: "Nick Campbell, Mary Beckman"
year: 1997
venue: "ESCA Workshop on Intonation: Theory, Models and Applications, Athens, Greece, 18-20 September 1997"
doi_url: "https://www.isca-archive.org/int_1997/campbell97_int.html"
pages: "67-70"
affiliations: "ATR Interpreting Telecommunications Research Laboratories; Ohio State University"
---

# Stress, Prominence, and Spectral Tilt

> **Source note.** The archived PDF is a scan with no usable text layer. All content below was
> extracted by reading the four page images (`pngs/page-000.png` .. `page-003.png`) at 200 dpi.
> Printed page numbers 67-70 correspond to PDF indices 0-3. Numeric values read off Figures 4, 5
> and 6 are **graph digitizations, not tabulated numbers** — the paper publishes no result tables,
> so every per-speaker number in the tables below is an eyeball reading of a plotted point and is
> marked as such. Treat them as approximate (roughly +/- 5 ms for durations, +/- 3 Hz for F0,
> +/- 0.5 dB for H2-H1).

## One-Sentence Summary
In American English, the spectral-tilt correlate of prominence (more relative energy in high
frequency bands) tracks **nuclear pitch accent**, not lexical stress: accented vowels differ from
unaccented-but-stressed vowels above roughly ERB channel 60, while stressed and unstressed vowels
in the *same* intonational context are not distinguished at all — so a synthesizer cannot get
accentual prominence from duration and F0 manipulation alone. *(pp.67, 70)*

## Problem Addressed
Sluijter & van Heuven (1996) reported that spectral balance (energy in higher bands relative to
lower bands) is an acoustic correlate of **lexical stress** in Dutch, present even outside focal
accent position, and argued this rescues "loudness" as a stress correlate after Fry's experiments
had discredited overall RMS intensity. Every earlier English study confounded stress with accent,
because a stressed syllable in citation-style materials is almost always also the accented one.
This paper builds an English corpus that varies lexical stress **independently** of accentual
prominence, and asks whether the Dutch spectral-balance-for-stress result replicates in English.
*(p.68)*

The structural distinction under test *(p.67)*:
- **'stress' proper** = lexical marking of which syllable is *accentable*.
- **'accent'** = intonational marking of the syllable that actually carries the nuclear pitch accent.
- Two fundamental questions posed: (a) are there reliable phonetic correlates of this structural
  difference in English, and (b) what are they? *(p.67)*

## Key Contributions
- A three-way controlled English corpus (`Baddle` vs `Badd-Ellis`) that dissociates full primary
  lexical stress from unreduced-but-unstressed syllables, crossed with accented / postnuclear-High /
  postnuclear-Low intonational contexts. *(p.68)*
- Evidence that **accent** (not stress) drives the spectral tilt difference in English: accented
  tokens have considerably higher energy in ERB channels 60 and above than
  unaccented-but-stressed tokens; stressed vs unstressed tokens are not separated by this pattern.
  *(p.70)*
- A **failure to replicate** Sluijter & van Heuven's stress effect in English, plus a
  cross-linguistic explanation (Dutch reduces initial unstressed syllables far less than English,
  citing Booij 1995; van Heuven 1987 vs Huss 1977). *(p.70)*
- H2-H1 (the standard phonation-type spectral tilt measure) is shown to be an **unreliable**
  prominence correlate because it is contaminated by other uses of phonation type, notably
  creaky voice on the low tone. *(p.70)*
- A direct synthesis implication: duration + F0 stretching are insufficient to model nuclear-accent
  prominence; a larger inventory of **source units** is required. *(p.70)*

## Study Design
- **Type:** Controlled laboratory production study, within-speaker repeated measures. *(p.68)*
- **Population:** 4 speakers of American English — 3 female (JV, MB [the second author], MO) and
  1 male (KL). *(p.68)*
- **Materials:** 3 vowels ([ae], [i], [u]) x 2 initial-syllable types x 3 intonational contexts,
  10 repetitions each. *(p.68)*
- **Tokens analysed:** 720 excised target vowel portions. *(p.69)*
- **Recording:** noiseless acoustically treated chamber. *(p.68)*
- **Primary measures:** vowel duration (ms), mean F0 (Hz), H2-H1 (dB), 128-channel ERB power
  spectrum. *(p.69)*
- **Statistics:** none reported. No ANOVA, no p-values, no confidence intervals appear in the
  paper; all conclusions are read off per-speaker mean plots. *(pp.69-70)*

### Word set *(p.68)*
| Syllable type | Words | Description |
|---|---|---|
| 1 | Baddle, Beedle, Boodle | full primary lexical stress on initial syllable |
| 2 | Badd-Ellis, Beede-Ellis, Boode-Ellis | initial syllable unreduced but **unstressed** |

The `Baddle` / `Badd-Ellis` minimal pair is the crux: both have a full (unreduced) first syllable,
but only `Baddle` has primary lexical stress there; in `Badd-Ellis` the nuclear accent would fall
on the second syllable. *(p.67)*

### Intonational contexts *(p.68)*
1. **Target syllable carries the High\* nuclear pitch accent**, tone `(L+)H*  H-`:
   > "He's met ALL of the men from that gang. He's met Tony LUCIANO, Jonathan BADDLE, Nathaniel JACKSON..."
2. **Postnuclear unaccented syllable in High context**, tone `H*  ...  H-`:
   > "He's written books on ALL of the famous Baddles. He's done MATTHEW Baddle, JONATHAN Baddle, MIRIAM Baddle, ..."
3. **Postnuclear unaccented syllable in Low context**, tone `H*  ...  L-`:
   > "No, it's not JONATHAN Baddle I interviewed, but his brother, Matthew."

In contexts 2 and 3 the nuclear accent is pulled onto the preceding given name, leaving the target
syllable postnuclear and unaccented while its lexical stress status still varies. *(p.67)*

### Table 1 — cell design *(p.68)*
| | Accent: accented | unaccented | unaccented |
|---|---|---|---|
| **Tone:** | (L+)H\* | H- | L- |
| **stressed** | 1-1 | 2-1 | 3-1 |
| **unstressed** | *(not possible)* | 2-2 | 3-2 |

The accented + unstressed cell is empty by construction: an unstressed syllable cannot bear the
nuclear accent except in very marked contexts such as metalinguistic correction of
pronunciation. *(p.67)*

### The three planned comparisons *(p.69)*
- **1-1 vs 2-1** — *accented* syllable vs *unaccented-but-stressed* syllable (Baddle, etc.) in the
  `H-` tone context. F0 rises to the `H*` peak in 1-1, but the value at V centre and the mean F0
  over V are the same as the `H-` level in 2-2. This is the accent contrast **with F0 held
  effectively constant at vowel centre**.
- **2-1 vs 2-2** — *unaccented-but-stressed* (Baddle) vs *unstressed* (Badd-Ellis) in postnuclear
  `H-` context. F0 is level and high in the target V in both contexts. This is the stress contrast
  with accent absent.
- **3-1 vs 3-2** — same stress contrast in postnuclear `L-` context; the F0 trace for the
  unstressed counterpart is identical.

Plot abscissa across Figs 4-6 has 5 levels in this order: `H*,Acc` (=1-1), `H,+` (=2-1, stressed),
`H,-` (=2-2, unstressed), `L,+` (=3-1, stressed), `L,-` (=3-2, unstressed). *(pp.69, 70)*

## Methodology / Acoustic measures *(p.69)*
After recording and digitization, the 720 target vowel portions were excised, then:
1. **Duration** — length of the target vowel interval, in ms.
2. **Mean F0** — mean fundamental frequency computed over every excised vowel token, in Hz.
3. **Formants** — vowel formant frequencies computed at 10 ms frames, averaged over **3 frames at
   the centre of the vowel** (F1, F2 in Hz). *(reported as measured; no formant results are shown
   in the paper)*
4. **H2-H1** — amplitudes of harmonics averaged over a **30 ms window at vowel centre**, then the
   intensity ratio between the first and second harmonics (H2-H1 in dB); described as "a standard
   measure of spectral tilt in phonetic studies of contrastive phonation type (see Jackson 1985)".
5. **ERB spectrum** — a **128-channel ERB-scaled filterbank** analysis for successive **10 ms**
   frames through the vowel (after Patterson 1986), with an average power spectrum computed over
   the **centre 3 frames** of each token.
6. **RMS amplitude** from the waveform was also measured. *(p.69)*

## Key Equations / Statistical Models

$$
\mathrm{tilt} = L_{H2} - L_{H1}
$$
Where: $L_{H1}$ is the level (dB) of the first harmonic and $L_{H2}$ the level (dB) of the second
harmonic, both taken from a 30 ms window centred on the vowel; more negative values mean H1
dominates H2 more strongly (the breathier / steeper-tilt direction). *(p.69)*

No other equation is given in the paper. The ERB filterbank is cited to Patterson & Moore (1986)
rather than restated, and no regression or ANOVA model is specified anywhere. *(pp.69-70)*

## Parameters

### Analysis parameters
| Name | Symbol | Units | Default | Range | Page | Notes |
|---|---|---|---|---|---|---|
| Formant analysis frame step | - | ms | 10 | - | 69 | F1, F2 computed per frame |
| Formant averaging window | - | frames | 3 | - | 69 | 3 frames at vowel centre (~30 ms) |
| Harmonic-amplitude window | - | ms | 30 | - | 69 | centred at vowel centre, for H2-H1 |
| ERB filterbank channels | - | channels | 128 | 1-128 | 69 | after Patterson 1986 |
| ERB frame step | - | ms | 10 | - | 69 | successive frames through the vowel |
| ERB averaging window | - | frames | 3 | - | 69 | centre 3 frames of each token |
| Accent/no-accent ERB split channel | - | ERB channel | 60 | 60-128 | 70 | accented tokens have considerably higher energy at **ERB 60 and above** |

### Corpus parameters
| Name | Symbol | Units | Default | Range | Page | Notes |
|---|---|---|---|---|---|---|
| Speakers | - | count | 4 | - | 68 | 3 female (JV, MB, MO), 1 male (KL) |
| Vowel types | - | count | 3 | - | 68 | [ae], [i], [u] |
| Initial-syllable types | - | count | 2 | - | 68 | stressed (Baddle) / unstressed-unreduced (Badd-Ellis) |
| Intonational contexts | - | count | 3 | - | 68 | H\* accented, postnuclear H-, postnuclear L- |
| Repetitions per cell | - | count | 10 | - | 68 | "produced 10 times each" |
| Analysed vowel tokens | - | count | 720 | - | 69 | excised target vowel portions |
| Comparison contexts plotted | - | count | 5 | - | 69 | H\*,Acc / H,+ / H,- / L,+ / L,- |

## Effect Sizes / Key Quantitative Results

No effect sizes, confidence intervals or p-values are reported anywhere in the paper. The tables
below are **digitizations of the per-speaker mean plots**, provided because the paper contains no
numeric tables at all.

### H2-H1 spectral tilt, per speaker (Fig. 6, digitized, dB) *(p.69)*
| Speaker | H\*,Acc (1-1) | H,+ (2-1) | H,- (2-2) | L,+ (3-1) | L,- (3-2) | Plot y-range |
|---|---|---|---|---|---|---|
| JV (F) | +1.2 | +1.8 | +4.0 | -2.0 | -1.8 | -4 to +4 |
| MB (F) | -9.3 | -6.3 | -6.0 | -1.8 | -2.7 | -10 to 0 |
| KL (M) | -11.5 | -4.6 | -5.2 | -4.7 | -5.1 | -15 to 0 |
| MO (F) | -1.0 | +4.8 | +7.7 | -0.4 | +0.7 | -5 to +10 |

Reading: the accent contrast (col 1 vs col 2) is large and in the **same direction for all four
speakers** — accented tokens have the lowest H2-H1 of the two — but the stress contrasts
(col 2 vs col 3, and col 4 vs col 5) are small and inconsistent in sign. The tone context (H vs L)
shifts H2-H1 by as much as the accent does for MB and MO, which is exactly the confound the
authors flag. *(p.70)*

### Vowel duration, per speaker and vowel (Fig. 5, digitized, ms) *(p.69)*
| Speaker | Vowel | H\*,Acc | H,+ | H,- | L,+ | L,- |
|---|---|---|---|---|---|---|
| JV | [ae] | 212 | 205 | 168 | 160 | 153 |
| JV | [u] | 176 | 165 | 137 | 112 | 107 |
| JV | [i] | 148 | 152 | 122 | 105 | 105 |
| MB | [ae] | 228 | 213 | 178 | 155 | 163 |
| MB | [u] | 168 | 152 | 118 | 100 | 105 |
| MB | [i] | 157 | 148 | 118 | 88 | 103 |
| KL | [ae] | 196 | 165 | 137 | 133 | 141 |
| KL | [u] | 176 | 165 | 110 | 100 | 104 |
| KL | [i] | 145 | 126 | 100 | 93 | 95 |
| MO | [ae] | 178 | 168 | 121 | 113 | 110 |
| MO | [u] | 126 | 116 | 96 | 79 | 87 |
| MO | [i] | 127 | 119 | 94 | 78 | 78 |

Consistent orderings visible in every panel: [ae] > [u] >= [i] for intrinsic duration, and a
monotone-ish decline from accented through postnuclear-High to postnuclear-Low. The
stressed-vs-unstressed duration difference (`H,+` vs `H,-`) is present in the H- tone context but
largely collapses in the L- context. *(p.70)*

### Mean vowel F0, per speaker (Fig. 4, digitized, Hz) *(p.69)*
| Speaker | Plot y-range | H\*,Acc | H,+ | H,- | L,+ | L,- |
|---|---|---|---|---|---|---|
| JV (F) | 170-220 | ~199-205 | ~200-207 | ~211 | ~180-183 | ~182-184 |
| MB (F) | ~85-220 | ~202-215 | ~203-212 | ~198-212 | ~85-100 | ~107-135 |
| KL (M) | 80-120 | ~103-111 | ~96-99 | ~96-101 | ~83-89 | ~86-90 |
| MO (F) | 180-240 | ~203-218 | ~212-222 | ~206-214 | ~186-195 | ~188-195 |

Per-panel spread reflects the three vowels ([ae] plotted as `a` is consistently the lowest F0 of the
three, an intrinsic-F0 effect; [i] and [u] run higher). The critical design property holds: mean F0
over V is essentially the same for `H*,Acc` and `H,+`/`H,-` for JV, KL and MO, so the accent effect
found in the spectrum is **not** an F0 artefact. *(pp.69-70)*

### ERB spectrum (Fig. 7) *(p.70)*
- For speaker MO, all three vowels: accented tokens are separated from unaccented-but-stressed
  tokens by **considerably higher energy in the higher frequency bands, ERB channel 60 and above**.
- Stressed and unstressed tokens are **not** differentiated by this pattern.
- Caveat recorded by the authors: in the High tone context, energy is higher in the unstressed [ae]
  in those bands, **but not relatively higher compared with the lower bands** — i.e. an overall
  level difference, not a tilt difference.
- The other three talkers showed the same pattern, "albeit with a less striking difference, and
  somewhat less consistency across the three vowel types".

## Methods & Implementation Details
- Excision is of the **target vowel portion only**, not the whole syllable. *(p.69)*
- All spectral measures are taken at **vowel centre**, deliberately away from transitions: 3 frames
  for formants and ERB, a 30 ms window for the harmonics. *(p.69)*
- The design deliberately equalises mean F0 over the vowel between the accented and the
  postnuclear-High conditions so that the accent comparison is not simply an F0 comparison; F0 rises
  to the H\* peak in 1-1 but the value at vowel centre matches the `H-` level. *(p.69)*
- Only 3 of 4 speakers produced the intended pattern in type 1-1: **KL produced a level H\* accent
  rather than a rising L+H\***, which raised his mean F0 for the type 1-1 vowel above that of the
  unaccented vowel and so partially breaks the F0-matching for the 1-1 vs 2-1 comparison. *(p.70)*
- **Two of the four talkers used creaky-voice phonation as the correlate of the percept of the low
  tone in intonation pattern 3**, which contaminates H2-H1 in the `L,+` / `L,-` cells. *(p.70)*
- The three-context nesting is what makes the design work: contexts 2 and 3 place the target
  syllable **postnuclear**, where lexical stress is still present but accent is absent. *(p.68)*
- No formant results are reported despite F1/F2 having been measured. *(pp.69-70)*

## Figures of Interest
- **Fig. 1 (p.67):** Spectrogram, RMS intensity and F0 for 'Jonathan **Baddle**' in pattern 1, target
  syllable (delimited with cursors) is the accented syllable. F0 track rises from ~200 Hz to a peak
  ~265 Hz over the target; RMS peaks on the accented syllable.
- **Fig. 2 (p.68):** Same triple display for pattern 2, target syllable after the accented syllable.
  F0 peaks ~255 Hz on the *preceding* accented syllable and is level/high (~200 Hz) over the target.
- **Fig. 3 (p.68):** Same for pattern 3, target after the accented one in a Low context. F0 falls
  from ~290 Hz on the accent to a low plateau (~190 Hz) across the target.
- **Fig. 4 (p.69):** 2x2 panel grid (JV, MB / KL, MO), mean vowel F0 across the 5 comparison
  contexts, one line per vowel labelled `a`, `i`, `u`. Shows the intended intonation patterns were
  produced and shows the KL exception.
- **Fig. 5 (p.69):** 2x2 grid, vowel duration across the 5 contexts, one line per vowel. Consistent
  [ae] > [u] > [i] ordering, decline from accented to postnuclear-Low.
- **Fig. 6 (p.69):** 2x2 grid, H2-H1 intensity ratio across the 5 contexts, single line per speaker
  (pooled over vowels). Note the wildly different y-axis ranges per speaker — this is itself the
  evidence that H2-H1 is speaker-idiosyncratic here.
- **Fig. 7 (p.69):** 3x2 grid of ERB power spectra for speaker MO: rows are [ae], [i], [u]; columns
  are high F0 and low F0 contexts. **KEY: solid line = accented, dotted line = stressed, dashed line
  = unstressed.** X axis is ERB channel 0-128, y axis is level in dB. The accented/unaccented
  separation opens up in the right-hand (high-channel) part of each panel.

## Results Summary
- **F0 (Fig. 4):** the four talkers were consistent in producing the intended intonation patterns,
  with the single exception of KL's level H\* in pattern 1-1. *(p.70)*
- **Duration (Fig. 5):** the four talkers **varied in how reliably** they differentiated accented
  from unaccented syllables by duration. They differentiated stressed from unstressed syllables
  **only in the H- tone context**. *(p.70)*
- **H2-H1 (Fig. 6):** differentiated accented target vowels from unaccented vowels **in some
  contexts**, but was **not a reliable correlate of either level of prominence contrast** because it
  was very sensitive to other uses of phonation type contrast — specifically the creaky voice two
  talkers used for the low tone. *(p.70)*
- **ERB spectra (Fig. 7):** for all three vowels, accented tokens are differentiated from
  unaccented-but-stressed tokens by considerably higher energy just in the higher frequency bands
  (ERB 60 and above); stressed and unstressed tokens are not differentiated by this pattern.
  Replicated in the other three talkers with a less striking difference. *(p.70)*
- **Overall:** a difference between accented and unaccented syllables was found, replicating Sluijter
  & van Heuven's spectral-balance result for Dutch focal accent; but **virtually no difference for
  this measure between stressed vs unstressed syllables in the absence of the accent contrast**.
  Other correlates of 'stress' proper were variable across speaker and vowel and interacted with the
  pitch range defined by the intonation pattern. *(p.70)*

## Limitations
- Only four speakers, and the second author is one of them (MB). *(p.68)*
- **No inferential statistics of any kind** — no ANOVA, no significance tests, no error bars beyond
  the small tick marks in Fig. 4. Every conclusion is a visual reading of per-speaker means.
- Fig. 7 shows ERB spectra for **one speaker only (MO)**; the other three are asserted to show the
  same pattern qualitatively, "albeit with a less striking difference, and somewhat less consistency
  across the three vowel types". *(p.70)*
- Speaker KL did not produce the intended rising L+H\*, weakening the 1-1 vs 2-1 comparison for him.
  *(p.70)*
- H2-H1 is confounded by voice-quality use of the low tone (creak in 2 of 4 talkers). *(p.70)*
- The ERB high-band difference for unstressed [ae] in the High tone context is an absolute level
  difference, not a relative tilt difference — the authors explicitly disclaim it. *(p.70)*
- The stress contrast is only fully controlled in unreduced syllables (`Badd-Ellis`); it says nothing
  about reduced syllables, which is where English differs most from Dutch. *(p.70)*
- Formants were measured (F1, F2) but no formant results are reported. *(p.69)*

## Arguments Against Prior Work
- **Against Fry (1955, 1958) and successors:** overall RMS intensity can differentiate stressed from
  unstressed syllables, but it "is not a reliable indicator of the structural difference in the
  absence of rigid control for other things that affect RMS intensity — including the fundamental
  frequency." Moreover, varying overall RMS intensity to match the acoustic differences has **very
  little effect on the percept of stress**, particularly by comparison to the perceptually very
  salient effects of manipulating F0 to make even the roughest approximations to intonation patterns
  that can be parsed as placing nuclear accent on the target vowel. *(pp.67-68)*
- **Against Fry and all subsequent similar studies (via Sluijter & van Heuven 1996):** they
  **co-vary accent and stress**, so their stress conclusions are unidentified. *(p.68)*
- **Against Sluijter & van Heuven (1996) themselves:** their spectral-balance-as-stress-correlate
  result does **not** transfer to English. Campbell & Beckman replicate the accent part but find
  virtually no stress effect in English. The proposed explanation is cross-linguistic: Dutch has
  relatively fewer words in which unstressed syllables are reduced, particularly word-initially
  (Booij 1995), and stress in the absence of accent or vowel-reduction contrasts is more perceptible
  in Dutch than English (van Heuven 1987 vs Huss 1977). *(p.70)*
- **Against traditional accounts of stress as a local increase in loudness** that is separable from
  the intonational event of the pitch accent — these results "contradict traditional descriptions of
  stress as a cross-linguistic phonetic property separable from accent." *(pp.67, 70)*
- **For Bolinger (1958):** the results lend support to the claim that stress in English "is nothing
  more than a structural marking of potential for a syllable to bear pitch accent". *(p.70)*

## Design Rationale
- **Why `Baddle` vs `Badd-Ellis`:** both names have strong (unreduced) first syllables, so vowel
  reduction is held constant; only the location of accentability differs, since nuclear accent would
  fall on the second syllable in `Badd-Ellis`. This isolates stress from reduction. *(p.67)*
- **Why postnuclear contexts:** placing the nuclear accent on the *preceding* given name (Matthew,
  Jonathan, Miriam) strips accent from the target while leaving lexical stress intact — the only way
  to break the stress/accent confound that vitiated the earlier literature. *(p.68)*
- **Why both an H- and an L- postnuclear context:** it separates the stress effect from the tone
  effect and gives two independent replications of the stress contrast at different pitch levels.
  *(p.68)*
- **Why measure at vowel centre:** to avoid consonantal transition effects and to give a stable
  window for harmonic and filterbank analysis. *(p.69)*
- **Why match mean F0 across the accent comparison:** so that a spectral difference between 1-1 and
  2-1 cannot be attributed to F0 differences at the measurement point. *(p.69)*
- **Why an ERB-scaled filterbank rather than a plain FFT band ratio:** it puts the band comparison on
  an auditory frequency scale (Patterson & Moore 1986), so a "high band" difference corresponds to
  something the auditory system resolves as such. *(p.69)*
- **Why report H2-H1 at all if it fails:** it is the standard spectral-tilt measure for contrastive
  phonation type (Jackson et al. 1985), so its failure here is itself the finding — the accent effect
  is not simply a phonation-type effect measurable at the first two harmonics. *(pp.69-70)*

## Testable Properties
- Accented vowels have higher energy than unaccented-but-stressed vowels at **ERB channel 60 and
  above**, with the low-channel energy comparable — i.e. a tilt difference, not a gain difference.
  *(p.70)*
- Stressed vs unstressed (unreduced) vowels in the **same** intonational context show no reliable
  ERB high-band difference in American English. *(p.70)*
- Mean F0 at vowel centre is approximately equal between the accented (1-1) and
  postnuclear-High-stressed (2-1) conditions by design; any measured spectral difference between
  them must therefore be independent of F0. *(p.69)*
- Vowel duration decreases monotonically (or near-monotonically) across accented > postnuclear-High
  > postnuclear-Low for all four speakers and all three vowels. *(Fig. 5, p.69)*
- Intrinsic vowel duration ordering [ae] > [u] >= [i] holds in all four speakers in all five
  contexts. *(Fig. 5, p.69)*
- The stressed-vs-unstressed duration difference appears in the H- tone context and disappears in
  the L- tone context. *(p.70)*
- H2-H1 varies by more than 10 dB across speakers within the same condition (KL's accented value is
  around -11.5 dB, JV's around +1.2 dB), so any absolute H2-H1 threshold for prominence is
  speaker-dependent and not portable. *(Fig. 6, p.69)*
- Low tone can be realized as creaky phonation, which shifts H2-H1 independently of prominence, so
  H2-H1 must not be used as a prominence feature in a system that also models phrase-final low
  tones. *(p.70)*
- Manipulating overall RMS intensity alone produces little change in the stress percept, whereas
  crude F0 manipulation that places nuclear accent on the target is perceptually very salient.
  *(p.68)*

## Relevance to Project
This is a direct rules paper for a formant / source-filter synthesizer that needs prominence.

1. **Prominence lives in the source, not just in F0 and duration.** The paper's closing argument is
   explicitly about synthesis: "the commonly used prosodic modifications (duration and fundamental
   frequency stretching) will be insufficient to model the prominence characteristics of nuclear
   accents in English speech." *(p.70)* A synthesizer that implements accent purely as an F0 target
   plus a duration multiplier will under-realize focal prominence.
2. **The knob to turn is high-band source energy on nuclear-accented syllables only.** Concretely:
   raise the relative level above roughly ERB channel 60 (about 2.4 kHz in Hz terms; the exact
   mapping is Patterson's, not restated in the paper) in the vowel of the nuclear-accented syllable,
   holding the low-band level roughly fixed. In a Klatt-style source this corresponds to reducing
   the spectral tilt parameter (flatter glottal source, shorter effective closing phase, more
   emphatic phonation), not to a gain increase.
3. **Do not apply the same treatment to merely-stressed syllables.** The central negative finding is
   that lexical stress in English carries no spectral tilt signature of its own. Stress should
   affect segmental identity (reduction vs not) and duration, and should gate accentability, but it
   should not open the source spectrum. Applying a tilt boost to every lexically stressed syllable
   would over-brighten unaccented content words.
4. **Do not use H2-H1 as the control variable.** It is speaker-idiosyncratic here (a ~13 dB spread
   across four speakers in the same condition) and it is captured by the low-tone phonation
   contrast. If the synthesizer models creak or breathiness at phrase-final low tones, H2-H1 will
   collide with that. Use a broadband high/low band-energy ratio on an auditory scale instead.
5. **Stress vs accent must be separate features in the linguistic front end.** The paper's structural
   argument (stress = accentability, accent = intonational marking) maps directly onto keeping a
   lexical stress bit and an independent accent/tone assignment. Bolinger's position endorsed here
   is that stress is *nothing more* than accentability in English. *(p.70)*
6. **Duration rules:** decline from accented through postnuclear-High to postnuclear-Low, roughly
   30-45% shrinkage from accented to postnuclear-Low for [u] and [i] and ~25-30% for [ae] in this
   corpus; intrinsic duration ordering [ae] > [u] >= [i]. Stress-only lengthening should be applied
   in high/level postnuclear contexts and suppressed in the low-tone tail.
7. **Concatenative caveat, generalized:** the authors conclude that since current technology cannot
   modify spectral characteristics without noticeable degradation, a larger inventory of **source
   units** is required. *(p.70)* A parametric formant synthesizer does not have this constraint —
   the tilt is a free parameter — which is precisely the advantage a source-filter architecture has
   here, and this paper says what to do with it.

## Open Questions
- [ ] What Hz value does "ERB 60" correspond to under Patterson & Moore (1986)? The paper never
  converts the channel index; the 128-channel bank's frequency limits are not stated. Needed before
  the finding can be turned into a filter specification.
- [ ] How large is the accented/unaccented high-band difference in dB? Fig. 7's y-axis tick labels
  are not legible in the archived scan, and the text says only "considerably higher".
- [ ] The paper measured F1 and F2 but never reports them. Does the accent effect include formant
  shifts (sonority expansion), which would matter for a formant synthesizer?
- [ ] Does the effect hold for consonants and for the whole syllable, or only for the vowel centre?
- [ ] Would the stress effect appear in English if the comparison used reduced vs unreduced rather
  than unreduced-unstressed vs stressed? The Booij-based explanation implies the reduction contrast
  is where English puts the stress information.
- [ ] Sluijter, van Heuven & Pacilly (1997) is in the reference list but never cited in the body —
  what does the perception result add?

## Related Work Worth Reading
- **Sluijter & van Heuven (1996), JASA 100, 2471-2485** — the paper this one is arguing with;
  the source of the spectral-balance-as-stress-correlate claim, in Dutch. Highest priority.
- **Sluijter, van Heuven & Pacilly (1997), JASA 101, 503-513** — the perception counterpart:
  spectral balance as a *cue* in the perception of linguistic stress.
- **Jackson, Ladefoged, Huffman & Antonanzas-Barroso (1985), UCLA WPP 61, 72-8, "Measures of
  spectral tilt"** — the definitional source for the H2-H1 measure and its alternatives.
- **Patterson & Moore (1986), "Auditory filters and excitation patterns as representations of
  frequency resolution"** — the ERB filterbank used for the key analysis; needed to convert the
  ERB-60 threshold to Hz.
- **Fry (1955, 1958)** — the classic duration/intensity stress experiments this paper reinterprets.
- **Bolinger (1958), "A theory of pitch accent in English", Word 14, 109-149** — the theoretical
  position the results support.
- **Campbell (1992), "Synthesis Units for Natural English Speech"** — the author's own synthesis
  context for the unit-selection implication.
