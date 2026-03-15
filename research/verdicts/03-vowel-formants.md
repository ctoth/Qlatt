# Verdict: Vowel Formants

## Papers Considered

| # | Paper | Year | Role |
|---|-------|------|------|
| 1 | Peterson & Barney | 1952 | Canonical F1-F3 formant data, 76 speakers, spectrograph |
| 2 | Hillenbrand et al. | 1995 | Modern replication of P&B, 139 speakers, LPC, F0-F4 + duration |
| 3 | Delattre et al. | 1952 | Two-formant synthetic vowel targets, pattern playback |
| 4 | Stevens & House | 1955 | Articulatory-to-acoustic mapping, 35-section electrical analog |
| 5 | Fant | 1960 | Source-filter theory, Russian vowel data, bandwidth tables |
| 6 | Chistovich & Lublinskaya | 1979 | Center-of-gravity effect, 3.0-3.5 Bark critical distance |
| 7 | Carlson, Granstrom & Klatt | 1979 | Perceptual salience: frequency >> tilt > amplitude > bandwidth |
| 8 | Flanagan | 1957 | Formant frequency JND ~3%, quantization bounds |
| 9 | Harrington et al. | 2011 | /u/ fronting in SSBE, tongue advancement not lip unrounding |
| 10 | Hao | 2002 | Cross-racial F1-F3 for 9 vowels, 120 speakers, VT dimensions |
| 11 | Barreda | 2015 | Formant-speaker size perception, uniform scaling validation |
| 12 | Ericsson | 2020 | Formant estimation evaluation, LPC accuracy vs F0 |
| 13 | Strong | 1967 | Machine-aided formant determination, parallel synthesizer |
| 14 | Story, Titze & Hoffman | 1996 | MRI-derived vocal tract area functions, single male subject |
| 15 | Lyzenga & Carlyon | 2005 | Formant FM detection, place-of-excitation cues dominate |
| 16 | Lienard & Di Benedetto | 1999 | Vocal effort: F1 shifts 3.5 Hz/dB, F2/F3 stable |
| 17 | Espy-Wilson et al. | 2000 | Acoustic modeling of American /r/, sublingual space critical for F3 |
| 18 | Deloche | 2020 | Statistical structure of speech, time-frequency trade-off by phoneme |
| 19 | Fitch & Giedd | 1999 | VTL morphology across age/sex, pharyngeal elongation at puberty |
| 20 | Collins & Missing | 2003 | Vocal attractiveness, formant dispersion vs body size |

## Historical Timeline

- **1952** Peterson & Barney: First large-scale (N=76) vowel formant measurement. 10 vowels in /hVd/, spectrograph with calibrated templates. Men/Women/Children. No duration data. No /e/ or /o/.
- **1952** Delattre et al.: Two-formant synthesis of 16 cardinal vowels. Established that synthetic F2 must be elevated to compensate for missing F3. F0 fixed at 120 Hz.
- **1955** Stevens & House: Three-parameter articulatory model mapped to F1-F3 via 35-section electrical analog. Used P&B data as validation.
- **1957** Flanagan: Formant frequency JND = ~3%. This means a 20 Hz shift in F1 or a 50 Hz shift in F2 is perceptible. Below these thresholds, differences are irrelevant.
- **1960** Fant: Foundational acoustic theory. Russian vowel data (Table 2.31-1). Bandwidth data (Table 2.34-1). Not AE vowels.
- **1967** Strong: Semi-automatic formant extraction. Fixed bandwidths: B1=70, B2=80, B3=100, B4=140 Hz (voiced).
- **1979** Chistovich & Lublinskaya: Critical distance of 3.0-3.5 Bark for formant integration. Back vowels: F1-F2 within this range, perceived as single spectral peak.
- **1979** Carlson, Granstrom & Klatt: Formant frequency is 20x more perceptually important than bandwidth. 40% bandwidth change < 4% frequency change.
- **1995** Hillenbrand et al.: Modern replication of P&B. N=139. 12 vowels (adds /e/ and /o/). LPC with 14-pole analysis. F0-F4 + duration. Michigan dialect.
- **1996** Story et al.: MRI area functions for 12 vowels from one male speaker. Calculated vs natural formants. Single subject.
- **1999** Lienard: F1 increases 3.5 Hz/dB with vocal effort; F2/F3 do not shift. Vowel identity preserved.
- **2000** Espy-Wilson: /r/ F3 target 1500-1800 Hz for males. Sublingual space lowers F3 by 200-300 Hz.
- **2002** Hao: 120 speakers across 3 races. F1-F3 for 9 vowels in /hVd/. Tract dimensions explain only 18% of F1 variance.
- **2011** Harrington: SSBE /u/ fronted to near-/i/ tongue position. Only relevant for British English targets.
- **2015** Barreda: Validates uniform formant scaling across speakers (2.3% average error). F4/F5 contribute to size perception.
- **2020** Ericsson: LPC estimation fails at high F0. Both optimized and generic ceiling methods fail similarly above F0=300 Hz.

## Findings by Category

### WRONG

None of the papers contain formant values that are demonstrably wrong for the populations they measured. The measurements are internally consistent.

### SUPERSEDED

**Peterson & Barney 1952 is superseded by Hillenbrand et al. 1995 for use as synthesis targets.**

Evidence:
- Hillenbrand had 139 speakers vs P&B's 76 (1.8x larger sample)
- Hillenbrand used digital recording (16 kHz, 12-bit) and LPC analysis (14-pole); P&B used a sound spectrograph with calibrated Plexiglass templates
- Hillenbrand provides F4 data that P&B does not
- Hillenbrand provides duration data that P&B does not
- Hillenbrand measured 12 vowels (adding /e/ and /o/); P&B measured only 10
- Hillenbrand provides spectral change data (20%/80% of vowel duration) showing that static targets alone yield only 68% classification accuracy
- Both studies achieved identical listener identification accuracy (94.4%)
- Hillenbrand's Michigan dialect is more controlled than P&B's mixed dialect pool

**Specific differences (male steady-state):**

| Vowel | P&B F1 | H95 F1 | Delta | P&B F2 | H95 F2 | Delta | P&B F3 | H95 F3 | Delta |
|-------|--------|--------|-------|--------|--------|-------|--------|--------|-------|
| /i/ | 270 | 342 | +72 | 2290 | 2322 | +32 | 3010 | 3000 | -10 |
| /I/ | 390 | 427 | +37 | 1990 | 2034 | +44 | 2550 | 2684 | +134 |
| /e/ | -- | 476 | N/A | -- | 2089 | N/A | -- | 2691 | N/A |
| /E/ | 530 | 580 | +50 | 1840 | 1799 | -41 | 2480 | 2605 | +125 |
| /ae/ | 660 | 588 | -72 | 1720 | 1952 | +232 | 2410 | 2601 | +191 |
| /A/ | 730 | 768 | +38 | 1090 | 1333 | +243 | 2440 | 2522 | +82 |
| /O/ | 570 | 652 | +82 | 840 | 997 | +157 | 2410 | 2538 | +128 |
| /o/ | -- | 497 | N/A | -- | 910 | N/A | -- | 2459 | N/A |
| /U/ | 440 | 469 | +29 | 1020 | 1122 | +102 | 2240 | 2434 | +194 |
| /u/ | 300 | 378 | +78 | 870 | 997 | +127 | 2240 | 2343 | +103 |
| /V/ | 640 | 623 | -17 | 1190 | 1200 | +10 | 2390 | 2550 | +160 |
| /3r/ | 490 | 474 | -16 | 1350 | 1379 | +29 | 1690 | 1710 | +20 |

**Key systematic discrepancies (exceeding Flanagan's 3% JND threshold):**
- /ae/ F1: P&B 660 vs H95 588 Hz (72 Hz, 11% difference). P&B's value is substantially higher.
- /ae/ F2: P&B 1720 vs H95 1952 Hz (232 Hz, 12% difference). P&B's value is substantially lower.
- /A/ F2: P&B 1090 vs H95 1333 Hz (243 Hz, 18% difference). P&B's value is substantially lower.
- /O/ F2: P&B 840 vs H95 997 Hz (157 Hz, 16% difference). P&B's value is substantially lower.
- /U/ F2: P&B 1020 vs H95 1122 Hz (102 Hz, 9% difference).
- /u/ F1: P&B 300 vs H95 378 Hz (78 Hz, 21% difference).
- /u/ F2: P&B 870 vs H95 997 Hz (127 Hz, 13% difference).
- F3 systematically higher in H95 for most vowels by 80-194 Hz.

**Hillenbrand's notes report** that F1/F2 values show "increased crowding in F1-F2 space" and "general tendency toward lower tongue positions" compared to P&B. F3 values for men average +113 Hz higher than P&B.

**Why H95 wins for synthesis targets:**
The Hillenbrand deviations from P&B are systematic, not random noise. They reflect: (a) more accurate measurement methodology (LPC vs spectrograph), (b) dialect differences (controlled Michigan vs mixed), and (c) a larger, more homogeneous sample. For a synthesizer targeting modern American English, Hillenbrand's values are more appropriate.

**Delattre 1952 is superseded for AE vowel targets.** The Delattre values were two-formant synthetic approximations of IPA cardinal vowels, not measurements of American English natural speech. Their systematic F2 elevation (to compensate for missing F3) makes them inappropriate as direct synthesis targets in a system that has F3.

**Fant 1960 vowel data is INCOMPARABLE** for AE synthesis. Fant measured Russian vowels. The formant data (Table 2.31-1) is for a different language with a different vowel inventory. The bandwidth data (Table 2.34-1) remains valuable.

### LIMITED

**Peterson & Barney 1952:** Limited by (a) no duration data, (b) only 10 vowels (missing /e/ and /o/), (c) mixed-dialect speakers, (d) spectrographic measurement, (e) single time-slice steady-state only.

**Hao 2002:** Limited by (a) Chinese speakers were L2 English, (b) only 20 speakers per race-gender cell, (c) 12th-order LPC at 10 kHz sampling (lower than Hillenbrand's 14-pole at 16 kHz). The White American male formant values are broadly consistent with Hillenbrand but show differences:

| Vowel | H95 F1 M | Hao WA M F1 | H95 F2 M | Hao WA M F2 |
|-------|----------|-------------|----------|-------------|
| /i/ | 342 | 303 | 2322 | 1927 |
| /I/ | 427 | 441 | 2034 | 1751 |
| /E/ | 580 | 556 | 1799 | 1584 |
| /ae/ | 588 | 653 | 1952 | 1595 |
| /A/ | 768 | 727 | 1333 | 1240 |
| /U/ | 469 | 459 | 1122 | 1347 |
| /u/ | 378 | 362 | 997 | 1254 |

Hao's F2 values for front vowels are systematically lower than H95, and /U/ F2 is anomalously high (1347 vs 1122). These differences likely reflect the smaller, less controlled sample. Not recommended as primary targets.

**Story et al. 1996:** Limited by single subject (one 29-year-old male). The calculated formants from MRI area functions diverge from natural speech by up to 43.6% for individual vowels. Useful for understanding articulatory-acoustic mapping, not for population-level formant targets.

### INCOMPARABLE

**Fant 1960 Russian vowels:** Different language, different vowel system. Bandwidth data (Table 2.34-1) is cross-linguistically useful: B1=40-70, B2=50-125, B3=77-240 Hz.

**Delattre 1952 two-formant vowels:** These are perceptual equivalents for a two-formant synthesizer, not natural speech measurements. The elevated F2 values compensate for missing F3.

**Harrington 2011 SSBE /u/ fronting:** British English, not American English. Demonstrates /u/ F2 of 2050-2250 Hz for young SSBE females — irrelevant for AE targets but critical if Qlatt ever adds a British English frontend.

**Ericsson 2020 Swedish vowels:** Different language. The formant estimation accuracy data is useful for understanding measurement limits, not for synthesis targets.

**Collins 2003, Fitch 1999, Deloche 2020:** These papers do not provide AE vowel formant targets. Collins provides attractiveness perception data. Fitch provides vocal tract morphology. Deloche provides time-frequency analysis.

## What Subsumes What

```
Hillenbrand 1995
  ├── supersedes Peterson & Barney 1952 (all 10 P&B vowels + 2 more, better method, larger N)
  ├── supersedes Delattre 1952 (for natural AE targets; Delattre's 2-formant synthetic targets are obsolete)
  └── contextualizes Hao 2002 (Hao's WA male data is broadly consistent but less precise)

Carlson et al. 1979 (perceptual salience)
  └── contextualizes Fant 1960 bandwidth data (bandwidths are 20x less perceptually important than frequencies)

Flanagan 1957 (JND)
  └── provides threshold for when formant differences matter: ~3% of frequency value
```

## Genuinely Uncertain

1. **The /ae/ question.** P&B gives F1=660, F2=1720. H95 gives F1=588, F2=1952. These are dramatically different values (72 Hz in F1, 232 Hz in F2). Hillenbrand's paper notes increased F1-F2 crowding compared to P&B. The Michigan dialect in H95 may have a different /ae/ realization than P&B's mixed pool. Hao's White American males give F1=653, F2=1595 — closer to P&B in F1 but lower in F2 than either. Without a third independent large-sample study of General American /ae/, this vowel has the most uncertain target of all.

2. **The /u/ problem.** P&B gives F1=300, F2=870. H95 gives F1=378, F2=997. Hao WA males give F1=362, F2=1254. The high Hao F2 value likely reflects /u/ fronting in some speakers (Harrington 2011 documents this for SSBE; it is also progressing in AE). For a conservative AE synthesizer, H95's values are the safest bet.

3. **F3 for non-rhotic vowels.** H95 F3 values are systematically 80-194 Hz higher than P&B for most vowels. This is a large and consistent offset. Whether it reflects measurement methodology differences (LPC vs spectrograph), dialect differences, or real population differences is unclear. H95's LPC method is more reliable.

4. **Spectral change vs steady-state.** H95 demonstrates that static formant targets alone classify vowels at only 68% accuracy (F1-F2 only) to 84.7% (F0, F1-F3). Adding spectral change (two samples at 20% and 80% of vowel duration) jumps to 94.1%. Qlatt's current inventory uses only steady-state targets. The diphthong `diph:` entries partially address this but monophthongs have no trajectory data.

## Best Current Understanding

The best available formant targets for American English male synthesis are from Hillenbrand et al. 1995 Table V (steady-state). For vowels not in Hillenbrand (/e/ = EY nucleus, /o/ = OW nucleus), Hillenbrand provides these directly.

### Complete Male Target Table

| ARPABET | IPA | Word | F1 | F2 | F3 | F4 | Dur (ms) | Source |
|---------|-----|------|-----|------|------|------|----------|--------|
| IY | /i/ | heed | 342 | 2322 | 3000 | 3657 | 243 | H95 |
| IH | /I/ | hid | 427 | 2034 | 2684 | 3618 | 192 | H95 |
| EY (nucleus) | /e/ | hayed | 476 | 2089 | 2691 | 3649 | 267 | H95 |
| EH | /E/ | head | 580 | 1799 | 2605 | 3677 | 189 | H95 |
| AE | /ae/ | had | 588 | 1952 | 2601 | 3624 | 278 | H95 |
| AA | /A/ | hod | 768 | 1333 | 2522 | 3687 | 267 | H95 |
| AO | /O/ | hawed | 652 | 997 | 2538 | 3486 | 283 | H95 |
| OW (nucleus) | /o/ | hoed | 497 | 910 | 2459 | 3384 | 265 | H95 |
| UH | /U/ | hood | 469 | 1122 | 2434 | 3400 | 192 | H95 |
| UW | /u/ | who'd | 378 | 997 | 2343 | 3357 | 237 | H95 |
| AH | /V/ | hud | 623 | 1200 | 2550 | 3557 | 188 | H95 |
| ER | /3r/ | heard | 474 | 1379 | 1710 | 3334 | 263 | H95 |

### Complete Female Target Table

| ARPABET | IPA | F1 | F2 | F3 | F4 | Source |
|---------|-----|-----|------|------|------|--------|
| IY | /i/ | 437 | 2761 | 3372 | 4352 | H95 |
| IH | /I/ | 483 | 2365 | 3053 | 4334 | H95 |
| EY (nucleus) | /e/ | 536 | 2530 | 3047 | 4319 | H95 |
| EH | /E/ | 731 | 2058 | 2979 | 4294 | H95 |
| AE | /ae/ | 669 | 2349 | 2972 | 4290 | H95 |
| AA | /A/ | 936 | 1551 | 2815 | 4299 | H95 |
| AO | /O/ | 781 | 1136 | 2824 | 3923 | H95 |
| OW (nucleus) | /o/ | 555 | 1035 | 2828 | 3927 | H95 |
| UH | /U/ | 519 | 1225 | 2827 | 4052 | H95 |
| UW | /u/ | 459 | 1105 | 2735 | 4115 | H95 |
| AH | /V/ | 753 | 1426 | 2933 | 4092 | H95 |
| ER | /3r/ | 523 | 1588 | 1929 | 3914 | H95 |

## Synthesizer Audit

Qlatt's `qlatt-english` frontend inventory at `public/rules/frontends/qlatt-english/inventory.yaml` uses Peterson & Barney 1952 adult male averages for F1-F3 of all core vowels, as stated in the file's comment. The DECtalk frontend uses different values derived from DECtalk 4.63 source code.

### Qlatt-English Vowel Comparison (Current vs Best Available)

| Phoneme | Current F1 | Best F1 | Delta F1 | Current F2 | Best F2 | Delta F2 | Current F3 | Best F3 | Delta F3 | Action |
|---------|-----------|---------|----------|-----------|---------|----------|-----------|---------|----------|--------|
| IY1 | 270 | 342 | **+72** | 2290 | 2322 | +32 | 3010 | 3000 | -10 | UPDATE F1 |
| IH1 | 390 | 427 | **+37** | 1990 | 2034 | +44 | 2550 | 2684 | **+134** | UPDATE F1, F3 |
| EH1 | 530 | 580 | **+50** | 1840 | 1799 | -41 | 2480 | 2605 | **+125** | UPDATE F1, F3 |
| AE1 | 660 | 588 | **-72** | 1720 | 1952 | **+232** | 2410 | 2601 | **+191** | UPDATE ALL |
| AA1 | 730 | 768 | +38 | 1090 | 1333 | **+243** | 2440 | 2522 | +82 | UPDATE F2, consider F1 |
| AO1 | 570 | 652 | **+82** | 840 | 997 | **+157** | 2410 | 2538 | +128 | UPDATE F1, F2, F3 |
| UH1 | 440 | 469 | +29 | 1020 | 1122 | **+102** | 2240 | 2434 | **+194** | UPDATE F2, F3 |
| UW1 | 300 | 378 | **+78** | 870 | 997 | **+127** | 2240 | 2343 | +103 | UPDATE F1, F2, F3 |
| AH1 | 640 | 623 | -17 | 1190 | 1200 | +10 | 2390 | 2550 | **+160** | UPDATE F3 |
| ER1 | 490 | 474 | -16 | 1350 | 1379 | +29 | 1690 | 1710 | +20 | OK (within JND) |
| EY1 (nucleus) | 480 | 476 | -4 | 1720 | 2089 | **+369** | 2520 | 2691 | **+171** | UPDATE F2, F3 |
| OW1 (nucleus) | 540 | 497 | -43 | 1100 | 910 | **-190** | 2300 | 2459 | **+159** | UPDATE F2, F3 |

**Bolded** deltas exceed the 3% JND threshold from Flanagan 1957 (roughly: 15 Hz for F1 around 500 Hz, 50 Hz for F2 around 1500 Hz, 75 Hz for F3 around 2500 Hz).

### Summary of Required Changes

**Every vowel except ER needs updating.** ER's current P&B values are within JND of Hillenbrand's values (F1: -16 Hz, F2: +29 Hz, F3: +20 Hz).

The most egregious mismatches:
1. **EY1 F2:** Current 1720, should be 2089 (+369 Hz, 18% off). This is not an /e/ target at all by H95 standards.
2. **AA1 F2:** Current 1090, should be 1333 (+243 Hz, 18% off).
3. **AE1 F2:** Current 1720, should be 1952 (+232 Hz, 12% off).
4. **UH1 F3:** Current 2240, should be 2434 (+194 Hz, 8% off).
5. **AE1 F3:** Current 2410, should be 2601 (+191 Hz, 7% off).
6. **OW1 F2:** Current 1100, should be 910 (-190 Hz, 21% off).

### Replacement Values Table

These are the recommended formant values for `inventory.yaml`, sourced from Hillenbrand et al. 1995 Table V male steady-state averages:

| Phoneme | F1 | F2 | F3 |
|---------|-----|------|------|
| IY | 342 | 2322 | 3000 |
| IH | 427 | 2034 | 2684 |
| EY (nucleus) | 476 | 2089 | 2691 |
| EH | 580 | 1799 | 2605 |
| AE | 588 | 1952 | 2601 |
| AA | 768 | 1333 | 2522 |
| AO | 652 | 997 | 2538 |
| OW (nucleus) | 497 | 910 | 2459 |
| UH | 469 | 1122 | 2434 |
| UW | 378 | 997 | 2343 |
| AH | 623 | 1200 | 2550 |
| ER | 474 | 1379 | 1710 |

### Bandwidth Assessment

Qlatt's current bandwidths cite Kent & Vorperian 2018. Carlson et al. 1979 demonstrates that bandwidth changes are 20x less perceptually important than formant frequency changes. A 40% bandwidth change produces less perceptual distance than a 4% formant frequency change. Therefore, current bandwidth values are adequate and do not require updating from this literature review.

### What This Verdict Does Not Cover

- Diphthong trajectory shapes (requires separate analysis of spectral change data)
- F4/F5 targets (Barreda 2015 shows they matter for speaker size perception but Qlatt currently holds them constant)
- Female/child voice targets (Hillenbrand provides the data; implementation requires speaker profile system)
- Connected speech formant reduction (Hillenbrand's /hVd/ durations are ~67% longer than connected speech)

## Open Questions

1. Should Qlatt implement spectral change (formant trajectories) for monophthongs? Hillenbrand shows classification accuracy jumps from 68% to 94% with 20%/80% sampling. Current inventory only has trajectory data for diphthongs.

2. The /ae/ F1 discrepancy between P&B (660), H95 (588), and Hao WA (653) needs resolution. P&B and Hao agree on a higher F1 than H95. This may be a genuine Michigan dialect difference. Recommend using H95 but flagging /ae/ for perceptual testing.

3. EY1's current F2 of 1720 Hz looks like it was taken from P&B's /ae/ rather than interpolated for /e/. P&B had no /e/ vowel. This value needs to be replaced with H95's 2089 Hz.

4. OW1's current F2 of 1100 Hz is much higher than H95's 910 Hz. P&B had no /o/ vowel either. This value also needs to be replaced.

5. Should the citation block in inventory.yaml be updated to list Hillenbrand 1995 as the primary source, with Peterson & Barney 1952 as historical reference only?
