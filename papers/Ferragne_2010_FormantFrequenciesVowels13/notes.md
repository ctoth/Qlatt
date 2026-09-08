---
title: "Formant frequencies of vowels in 13 accents of the British Isles"
authors: "Emmanuel Ferragne, François Pellegrino"
year: 2010
venue: "Journal of the International Phonetic Association, 40(1), 1-34"
doi_url: "https://doi.org/10.1017/S0025100309990247"
---

# Formant frequencies of vowels in 13 accents of the British Isles

## One-Sentence Summary
Acoustic (formant-based) description of male vowel systems in 13 accents of the British Isles using the ABI corpus, reporting F1/F2 in Bark z-scores (with Hz also given in text/some figures) for 11 monophthongs and 7 diphthongs per accent, plus methodological detail on semi-automatic formant measurement.

## Problem Addressed
No prior publication provided acoustic (formant) data for vowels across a large number of British Isles accents using one consistent methodology; this paper fills that gap using the Accents of the British Isles (ABI) corpus.

## Key Contributions
- F1/F2 plots (Lobanov z-scored, Bark-transformed) for 13 accents (of 14 ABI regions; Inner London `ilo` excluded for phonetic heterogeneity).
- Detailed automatic/semi-automatic formant measurement methodology (Praat + Burg algorithm, screening, Bark transform, regression smoothing, Lobanov normalization).
- Discussion of lexical set mergers/splits per accent (FOOT-STRUCT, TRAP-BATH, NURSE-SQUARE, etc.)
- Diphthong trajectory description (start/end median points with IQR error bars) for 5 closing diphthongs (FACE/hade, PRICE/hide, CHOICE/hoid, GOAT/hoed, MOUTH/howd) per accent.
- Notes centring diphthongs (SQUARE/hared, NEAR/heered) mostly via prose + spectrograms, not plotted in F1/F2 plane (excluded CURE/hured test-word as unreliable).

## Study Design
- **Type:** Cross-sectional acoustic-phonetic corpus study.
- **Population:** Accents of the British Isles (ABI) corpus (D'Arcy et al. 2004); 14 regions, ~20 subjects/region (10M/10F), ages nominally 18-50 (actual range 16-79 in some areas); recorded early 2003. Male-only data reported here (145 male speakers total screened). *(p.2, p.3-4)*
- **Test material:** List of 19 /hVd/ words read 5 times each: heed, hid, head, had, hard, hod, hoard, hood, who'd, Hudd, heard, hade, hide, hoid, hoed, howd, hared, heered, hured. *(p.3, Table 2)*
- **Accents analyzed (13, abbrev in Table 1):** brm=Birmingham, crn=Cornwall(Truro), ean=East Anglia(Lowestoft), eyk=East Yorkshire(Hull), gla=Glasgow, lan=Lancashire(Burnley), lvp=Liverpool, ncl=Newcastle, nwa=North Wales(Denbigh), roi=Republic of Ireland(Dublin), shl=Scottish Highlands(Elgin), sse=Standard Southern English(London), uls=Ulster(Belfast). ilo=Inner London excluded (substantial within-sample variability, ethnic background differences). *(p.2, Table 1)*
- **N speakers per accent (monophthong / diphthong analysis):** brm 7/6; crn 2/2; ean 7/5; eyk 8/6; gla 7/7; lan 10/9; lvp 8/5; ncl 2/2; nwa 7/7; roi 7/6; shl 11/11; sse 6/6; uls 6/5. Total 88 (monophthong)/77(diphthong) speakers, 6624 vowel tokens used. *(p.2, Table 1)*
- **Typicality screening:** expert phonetician rated typicality/homogeneity of each of 145 male speakers on 5-point scale from the ABI read passage (~300 words); ilo dropped entirely on this basis. sse sample scored typicality/homogeneity 3/5 (i.e., fairly "diluted" RP). *(p.4, p.8)*

## Methodology
- Formants extracted via Praat (Boersma & Weenink 2008), Burg algorithm, default parameters, for each of 26,408 vowels; each spectrogram+formant-track visually inspected, mismatches rejected -> 22,331 vowels retained after screening. *(p.4)*
- Word-level segmentation from ABI corpus; vocalic nuclei extracted via automatic F0 detection (Snack Sound Toolkit, Sjölander 2004), voiced portion kept. For rhotic accents (crn, gla, lan, roi, shl, uls) where /r/ follows vowel as approximant, F0 detection could not separate vowel from following /r/, so whole voiced portion (vowel+/r/) retained — hence comments on rhoticity/r-coloring included where relevant. *(p.4)*
- Formant tracks resampled (linear interpolation) to 13 points per vowel regardless of duration, for uniform-length vectors (introduces slight information loss since formant steady-state/transition ratio varies by vowel & speech rate — Gay 1968, 1978). *(p.4)*
- Monophthongs vs diphthongs: category assigned a priori by conventional label (Table 2) but token-level check via listening+visual inspection; whichever phonetic pattern was most frequent for a vowel type in a given accent determined its treatment (monophthong vs diphthong) in that accent. Medians/IQR (not mean/SD) used as central tendency/spread estimators due to large within-dialect variability. *(p.4-5)*
- Regression smoothing of formant tracks: robust (weighted least squares) linear regression for most monophthongs (superior to classic OLS regression — Fig 1 example: *hade* F2 by speaker PDK, `lan`). Cubic polynomial regression used for PRICE vowel to capture S-shaped trajectories (Fig 2 example: *hide* F2, speaker CTS, `lvp`) — choice of regression type depended on accent and vowel type. *(p.5)*
- Bark transform (Traunmüller 1990) applied to Hz formant values; then Lobanov (z-score) normalization (Lobanov 1971; Adank et al. 2004) applied per speaker per formant separately, using values at temporal midpoint for monophthongs. Requires each speaker to produce ≥1 token of each vowel type (not always true after screening → variable speaker N per accent, Table 1). *(p.5-6)*
- Closing-diphthong formant measurement taken at 2/13 and 11/13 of vowel duration (near start/end, to minimize coarticulation impact); plotted as median F1/F2 arrows (tail=onset, head=offset) with IQR error bars.
- Centring diphthongs (SQUARE/hared, NEAR/heered) NOT plotted in F1/F2 plane due to high within-dialect variability; illustrated via spectrograms instead. CURE/hured test-word excluded entirely from analysis — highly inconsistent within- and between-speaker realization, unclear phonological interpretation by subjects. *(p.6, p.9)*
- Some duration data reported occasionally (e.g. Fig 16) but NOT included systematically — authors judged that monosyllabic list-reading task inflated durations vs. natural speech, adding noise. *(p.6)*
- Kernel-smoothed probability density estimates (Everitt, Landau & Leese 2001) used for some close vowel-pair comparisons (e.g. NURSE vs STRUT in `ean`, Fig 16) plotting F1(Hz), F2(Hz), and duration(ms) densities. *(p.6, p.14)*

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| Vowel tokens before screening | — | count | 26,408 | — | p.4 | All monophthong+diphthong tokens, 145 male speakers |
| Vowel tokens after screening | — | count | 22,331 | — | p.4 | After spectrogram/formant-track visual mismatch rejection |
| Vowel tokens used in final acoustic analysis | — | count | 6,624 | — | p.2,p.6 | After removing speakers w/ incomplete vowel sets (needed for Lobanov normalization) |
| Formant resample points per vowel | — | count | 13 | — | p.4 | Linear interpolation to constant-length vector |
| Diphthong measurement points | — | fraction of duration | 2/13 and 11/13 | — | p.6 | Onset/offset measurement points for closing diphthongs |
| sse typicality/homogeneity score | — | 1-5 scale | 3/5 | — | p.8 | Assessed by British phonetician; "quite lax" RP definition |
| ean Hudd/heard median duration | — | ms | Hudd 166 / heard 281 | — | p.14 | From Fig 16 density estimate discussion |

## Figures of Interest (pages 0-15)
- **Fig 1 (p.5):** F2 track of *hade* (lan, speaker PDK) — robust vs classic regression comparison, illustrates smoothing method choice for monophthongs.
- **Fig 2 (p.6):** F2 track of *hide* (lvp, speaker CTS) — cubic polynomial regression for S-shaped PRICE trajectory.
- **Fig 3 (p.7):** sse 11-monophthong F1/F2 median+IQR plot (reference accent).
- **Fig 4 (p.8):** sse 5 closing diphthongs, median start/end points. Shows PRICE-MOUTH "crossover": PRICE has back starting element, MOUTH has front starting element — reversal vs. traditional RP transcription (contra Jones 2003, Wells 2008 who use [aɪ]/[aʊ]; consistent w/ Upton 2004 [ʌɪ]/[aʊ]; discussion of Windsor Lewis 2003 skepticism, and Wells 1982's "PRICE-MOUTH crossover" in Popular London).
- **Figs 5-6 (p.9):** Spectrograms of *hared* (monophthong, contra dictionary treatment as diphthong /ɛə/) and *heered* (centring diphthong) in sse.
- **Figs 7-8 (p.10-11):** brm monophthongs & diphthongs. hood/Hudd (FOOT/STRUT) only slightly overlap in medians but only ~half of 20 brm speakers show a clean FOOT-STRUCT split auditorily — averaging formants across speakers w/ and w/o the split is potentially misleading. STRUT vowel is centralized (near NURSE/heard) rather than open as in sse — attributed to "mobile northerner" accommodation (Evans & Iverson 2004). No PRICE-CHOICE merger found despite Wells (1982) noting the possibility. PRICE starting quality noticeably back/close in brm vs sse.
- **Figs 9-10 (p.11):** crn monophthongs, 2 individual speakers plotted separately (too few speakers for median/IQR). GOOSE highly variable: back, front, and diphthongized variants attested (Figs 11-12 spectrograms, p.12).
- **Figs 13-14 (p.12-13):** crn diphthongs per speaker. MOUTH and GOAT point same direction (unlike sse where MOUTH pointed toward hoard/hood direction differently).
- crn: hared = long monophthong (sometimes r-colored) or monophthong+approximant; heered = almost unanimously monophthong+approximant (rhotic accent). *(p.13)*
- **Fig 15 (p.14):** ean 11-monophthong plot. FLEECE/heed and GOOSE/who'd treated as monophthongs (despite Trudgill 1999:129 calling them diphthongs) per authors' auditory judgment of degree of diphthongization. NURSE/heard and STRUT/Hudd conspicuously close.
- **Fig 16 (p.14):** ean NURSE(heard, dashed) vs STRUT(Hudd, solid) — probability density estimates of F1(Hz, ~200-800), F2(Hz, ~1100-2000), duration(ms, ~-100 to 400). NURSE ~twice as long as STRUT on average (median duration 281ms vs 166ms); F1 curve asymmetry + F2 bimodality for STRUT suggest genuine sub-population spectral separation for some speakers, spectral proximity (duration-reliant) for others.
- **Fig 17 (p.15):** ean diphthongs: PRICE(hide) and CHOICE(hoid) starting qualities close; GOAT(hoed) has back starting point. hared exclusively monophthongal; heered mostly monophthongal too.
- **Figs 18-19 (p.15):** eyk (East Yorkshire/Hull) monophthongs & diphthongs. GOOSE and FOOT-STRUT (single phoneme, not split) retain comparatively back qualities vs most other accents in this paper. TRAP/START close together, some speakers may rely on duration alone for contrast. head/heard (DRESS/NURSE) show overlapping F1/F2 distributions — median durations 166ms vs 281ms respectively suggest duration is a (partial) cue. eyk not rhotic; NURSE-SQUARE merger common (Williams & Kerswill 1999:146).

## Testable Properties (so far)
- sse: PRICE starting F2 is more back (lower F2 in conventional terms / less front) than MOUTH starting F2 — the "PRICE-MOUTH crossover" *(p.7-8)*.
- ean: STRUT (Hudd) and NURSE (heard) F1/F2 medians nearly coincide; duration is the more reliable cue (NURSE ≈281ms vs STRUT ≈166ms) *(p.14)*.
- Across accents, FOOT-STRUT split is not simply present/absent per accent but can vary within a nominally non-splitting accent's speaker population (brm) *(p.10)*.

## Relevance to Project
Directly informs per-accent vowel target design for a formant synthesizer: gives qualitative F1/F2 layout (relative positions, not raw Hz table) for 13 real British-Isles accents, explicit lexical set merger/non-merger patterns (FOOT-STRUCT, TRAP-START, NURSE-STRUT, NURSE-SQUARE), diphthong trajectory shapes (2-point onset/offset targets, regression curve shape differences for PRICE vs other diphthongs), and cautions about within-accent/within-speaker heterogeneity (e.g., partial phonemic splits, duration-only contrasts) — these are important caveats for setting single canonical per-accent target formants. NOTE: primary data are z-scored Bark plots (relative positions), not absolute Hz tables — remaining pages (16-33) need to be checked for an appendix with raw Hz/Bark tables suitable for direct target extraction.

## Per-Accent Notes (Sections 3.6–3.13, pages 15-27)

### Glasgow (gla), p.15-17
- Rhotic but /r/ realization highly variable (flap, approximant, schwa-like, or no acoustic trace) — ongoing loss of coda /r/ (Stuart-Smith 2007, Scobbie 2007); Fig 20 spectrogram shows a non-rhotic *hard* with no spectral cue for /r/.
- FOOT-GOOSE merger typical of Scottish English generally attested; LOT-THOUGHT merger typical too but untestable with this word list; NORTH-FORCE opposition generally preserved but untestable. *(p.16)*
- Scottish Vowel Length Rule (SVLR): vowel lengthens before suffixal /d/. *hood* vs *who'd* spectrally near-identical but *who'd* median duration 244ms vs *hood* 163ms (Δ=81ms) — supports SVLR applying to *who'd*, raising possibility hood/who'd are separate phonemes distinguished mainly by duration. *(p.16)*
- KIT (*hid*) markedly retracted/centralized (Eremeeva & Stuart-Smith 2003 confirmed). *(p.17)*
- Diphthongs: PRICE (*hide*) = typically Scottish [ɛɪ]; FACE (*hade*) and GOAT (*hoed*) = monophthongs; *hared* = [e] or [ɪ]-type monophthong + /r/; *heered* = same vowel as *heed* + /r/. *(p.17)*

### Lancashire (lan), p.17-19
- Burnley: nominally part of rhotic Central Lancashire area per Hughes/Trudgill/Watt (2005) typology, but the actual lan sample is almost entirely non-rhotic (continuation of 18th-c RP-driven non-rhoticity spread). *(p.17, p.30)*
- No FOOT-STRUT split (Fig 23); GOOSE relatively front (unlike eyk); TRAP/hard farther apart than in eyk though partial overlap remains. *(p.17)*
- FACE/GOAT = monophthongs, GOAT perceptibly more back than eyk average; some speakers merge *hoed*/*hoard*; PRICE narrow formant movement, monophthong variant more frequent than diphthong; *hared* = long monophthong; *heered* mostly centring diphthongs. *(p.17)*
- Figs 25-26: same speaker (PDK) produces both monophthongal and diphthongal *hide* — within-speaker variation, not just between-speaker. *(p.19)*

### Liverpool (lvp), p.17-20
- Heavy Anglo-Irish phonetic influence (19th-c Irish immigration) though phonologically still northern (Knowles 1978:80 "interesting hybrid"). *(p.17-19)*
- Salient NURSE-SQUARE merger, especially working-class speech (Beal 2004:125); no FOOT-STRUT split; BATH-broadening from middle class upward. *(p.19)*
- Fig 27: *hod*/*hard* spectrally close but distinguished by duration; *hood*/*Hudd* stay back while *who'd* is clearly front (unlike most other systems here); *heard* long monophthong, quality similar to *hid*. *(p.19)*
- Unlike most northern accents, lvp HAS phonetic closing diphthongs in FACE and GOAT (Fig 28) — GOAT's first element more back in men than women. *hared* long monophthong, homophonous with *heard* (NURSE-SQUARE merger visible in Fig 29 density plot). *(p.19-20)*
- Fig 29: lvp *heard*(solid)/*hared*(dashed) probability densities — F1(Hz ~250-750), F2(Hz ~1400-2400, bimodal ~1750 & ~2200), duration(ms ~-50-400) — near-total overlap confirming the merger.

### Newcastle (ncl), p.19-21
- Only 2 speakers pass screening (Table 1) — authors explicitly caution against over-confidence in ncl (and crn) results. *(p.6)*
- NURSE vowel fronted/raised, between [ø] and [œ] (confirms Watt & Allen 2003). *(p.19)*
- Complex *Hudd*/*hood*/*who'd* pattern (Figs 30-31): no FOOT-STRUT split, but some speakers (e.g. TXR) rhyme *hood* with *who'd*. Auditory check of *took/cook/looked/foot* in the read passage showed these differ perceptibly from *who'd* → homophony of *hood*/*who'd* is due to *hood* itself patterning with GOOSE lexically for many ncl speakers (fluctuating lexical incidence, not a FOOT-GOOSE merger) — cites Wells (1982:362) on north-of-England ⟨-ook⟩ words joining GOOSE. *(p.20-21)*
- Auditory analysis of the full (pre-screening) ncl sample: vast majority have a centring diphthong for FACE; two example speakers plotted individually: GGC = closing diphthong FACE + monophthong GOAT (Fig 32); TXR = centring diphthong FACE + monophthong GOAT (Fig 33). *hared* = long monophthong; *heered* = centring diphthong. *(p.20-21)*

### North Wales (nwa; Denbigh), p.21-23
- Welsh English generally non-rhotic but /r/ can be fully realized in traditional Welsh-speaking (western) areas or near rhotic English counties (Penhallurick 2004); STRUT may merge with schwa (Wells 1982:380; Penhallurick 2004:103); in NE Wales (Denbigh, this sample) some STRUT words pattern with FOOT as in nearby northern England. *(p.21)*
- GOOSE clearly back (Fig 34) — contrasts with the fronting trend elsewhere in the corpus. Of 20 nwa speakers, 13 rely solely on duration to separate *had*/*hard*; 7 use both duration and F1/F2 front/back distinction. *(p.21-22)*
- Some speakers monophthongize FACE and GOAT (Fig 35); *hared* = long monophthong; *heered* = centring diphthong. *(p.22)*

### Republic of Ireland (roi; Dublin), p.22-23
- Considered relatively impermeable to Anglo-English/American change (Wells 1982:418); RP is an "extra-national norm not aspired to" (Hickey 1999:265). Rhotic, rhoticity level varies even within Dublin, more rhotic = higher prestige (Hickey 1999:272). *(p.22)*
- NURSE-SQUARE merger is the best-known systemic feature and, unlike Liverpool, NOT stigmatized (Wells 1982:421). *(p.22-23)*
- Fig 36: *Hudd*/*hood* overlap supports lack of FOOT-STRUT split — a "Popular Dublin" (vs "Fashionable Dublin") feature per Hickey (2004:91). *(p.23)*
- Diphthongs (Fig 37): some *hade* realizations monophthongal; *hide* starting quality varies front/back by speaker; *hoed* ranges quasi-monophthong to full diphthong; *howd* final element often clearly [ʊ]. *(p.23)*

### Scottish Highlands (shl; Elgin), p.23-27
- Scottish Gaelic substrate influence, mainly consonantal (Wells 1982; Stuart-Smith 2004:50). Rhoticity maintained by ALL speakers (some with trill rather than approximant) — contrast with gla. *(p.23)*
- KIT less centralized than gla and the centralized variant less frequent (Figs 38-39 show close vs central spectrogram variants). *(p.24-25)*
- Unlike expectation, NO clear support for FOOT-GOOSE merger (Fig 40): *hood*/*who'd* have similar F1 and duration but distinct F2 (non-overlapping) — Fig 42 density plot confirms F2 separation despite F1/duration overlap; so, unlike gla, *who'd* is not a Scottish-Vowel-Length-Rule candidate here — realizations of *hood*/*who'd* inconsistent across speakers (some identical, some spectrally distinct). *(p.24, p.26)*
- *hod*/*hoard* very close spectrally but the /r/ marks the difference; proximity suggests possible LOT-THOUGHT merger in some speakers (untestable directly). *(p.24)*
- FACE and GOAT both unanimously monophthongal and particularly close; GOAT (*hoed*) in shl (and gla) is probably the closest vowel to cardinal [u] in the whole corpus. PRICE (*hide*) = [ɛj] type. *(p.24, p.26)*
- Diphthongs Fig 41: *hade* arrow points upward — attributed to an artefact of multiple co-occurring variants (centring diphthong is the main variant; monophthongs and closing diphthongs also occur); *hoid* onset quite open/variable. *hared*/*heard* homophonous for 14/20 speakers (NURSE-SQUARE merger in about half); realized as [ɜ] or [ɛ]. *(p.26-27)*

### Ulster (uls; Belfast), p.25-27
- Shares many features with Scottish English via 17th-c Scots settlement (Hickey 2004:68). Rhotic; /r/ generally a retroflex approximant (Wells 1982:446). *(p.25)*
- Restricted role for vowel length as a systemic feature (as in shl); FOOT-GOOSE effectively one phoneme, and (potentially) LOT-THOUGHT one phoneme too (Wells 1982:438-440). *(p.26)*
- Fig 43: FOOT/GOOSE overlap and retracted KIT most notable; FOOT and GOOSE more front than their shl counterparts; lengthening of *who'd* not unanimous. *(p.26)*

## 3.14 Summary (p.27-28)
- Authors caution that averaging quantitative formant data across speakers without prior *qualitative* (phonetic-category) assessment can be misleading — e.g. averaging ncl FACE across its 3 distinct realizational variants (monophthong/centring/closing diphthong) is not meaningful without first classifying tokens.
- **Table 3 — Median formant values for the 11 monophthongs (Hz), by accent** *(p.28, verbatim)*. Columns: heed(FLEECE), hid(KIT), head(DRESS), had(TRAP), hard(START), hod(LOT), hoard(FORCE), hood(FOOT), who'd(GOOSE), Hudd(STRUT), heard(NURSE). Two rows per accent: F1, F2.

| Accent | Formant | heed | hid | head | had | hard | hod | hoard | hood | who'd | Hudd | heard |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| brm | F1 | 289 | 350 | 502 | 679 | 639 | 576 | 454 | 414 | 318 | 482 | 491 |
| brm | F2 | 2219 | 2058 | 1811 | 1479 | 1103 | 1293 | 882 | 1194 | 1620 | 1246 | 1573 |
| crn | F1 | 285 | 402 | 500 | 641 | 629 | 556 | 461 | 400 | 332 | 569 | 508 |
| crn | F2 | 2346 | 2022 | 1818 | 1560 | 1203 | 1062 | 905 | 1400 | 1297 | 1365 | 1568 |
| ean | F1 | 335 | 407 | 499 | 692 | 702 | 580 | 428 | 416 | 325 | 569 | 562 |
| ean | F2 | 2277 | 2142 | 2047 | 1717 | 1241 | 1143 | 835 | 1509 | 1666 | 1577 | 1570 |
| eyk | F1 | 281 | 394 | 560 | 700 | 725 | 578 | 551 | 399 | 278 | 426 | 588 |
| eyk | F2 | 2266 | 2058 | 1873 | 1463 | 1316 | 1114 | 988 | 1210 | 1035 | 1216 | 1717 |
| gla | F1 | 301 | 446 | 473 | 636 | 693 | 530 | 463 | 327 | 345 | 480 | 543 |
| gla | F2 | 2164 | 1780 | 2046 | 1490 | 1178 | 1215 | 973 | 1723 | 1751 | 1545 | 1561 |
| lan | F1 | 310 | 423 | 576 | 697 | 689 | 615 | 571 | 483 | 354 | 485 | 542 |
| lan | F2 | 2276 | 2024 | 1811 | 1454 | 1112 | 1138 | 1037 | 1144 | 1746 | 1130 | 1575 |
| lvp | F1 | 299 | 465 | 607 | 730 | 638 | 599 | 536 | 491 | 328 | 496 | 488 |
| lvp | F2 | 2211 | 1854 | 1631 | 1393 | 1200 | 1182 | 1033 | 1126 | 1690 | 1130 | 1796 |
| ncl | F1 | 279 | 430 | 514 | 694 | 633 | 591 | 489 | 382 | 309 | 423 | 478 |
| ncl | F2 | 2263 | 1793 | 1668 | 1333 | 1020 | 1096 | 837 | 1079 | 1084 | 1129 | 1492 |
| nwa | F1 | 276 | 444 | 596 | 762 | 767 | 612 | 541 | 493 | 283 | 545 | 471 |
| nwa | F2 | 2280 | 1925 | 1733 | 1415 | 1300 | 1056 | 954 | 1172 | 999 | 1540 | 1567 |
| roi | F1 | 276 | 420 | 561 | 709 | 639 | 674 | 495 | 484 | 317 | 509 | 529 |
| roi | F2 | 2247 | 1912 | 1831 | 1510 | 1491 | 1214 | 1100 | 1212 | 1555 | 1209 | 1552 |
| shl | F1 | 248 | 364 | 410 | 558 | 618 | 439 | 434 | 258 | 258 | 427 | 532 |
| shl | F2 | 2217 | 1849 | 1949 | 1335 | 1183 | 1207 | 1073 | 1587 | 1441 | 1514 | 1646 |
| sse | F1 | 273 | 386 | 527 | 751 | 655 | 552 | 452 | 397 | 291 | 623 | 527 |
| sse | F2 | 2289 | 2038 | 1801 | 1558 | 1044 | 986 | 793 | 1550 | 1672 | 1370 | 1528 |
| uls | F1 | 279 | 413 | 573 | 681 | 642 | 614 | 480 | 334 | 376 | 466 | 537 |
| uls | F2 | 2200 | 1813 | 1825 | 1495 | 1347 | 1183 | 1097 | 1747 | 1754 | 1329 | 1553 |

Values are Hz, at temporal midpoint, median across speakers per accent (chosen over mean due to large within-dialect variability); no per-vowel F3 is reported anywhere in the paper (F1/F2 only); no separate table for female speakers (paper is male-only by design, p.4). No numeric table given for diphthong onset/offset Hz values — those exist only as Bark z-score plots (Figs 4,8,13,14,17,19,22,24,28,32,33,35,37,41,44); diphthong Hz values would have to be back-derived from the plots or are not published.

## 4 Discussion (p.28-31)

### Findings-level discussion
- brm: FOOT-STRUT split is genuinely bimodal across speakers (evenly split with/without), consistent with Wells (1982:352) — the word list can't test lexical-incidence uncertainty. Birmingham is a transitional area for the STRUT criterion (north/south boundary); all *other* "northern" accents in the sample are unambiguously northern on this criterion. *(p.28-29)*
- NURSE-SQUARE merger is the norm in eyk, lvp, roi, uls. *(p.29)*
- FOOT-GOOSE merger holds (at least partially) for gla, shl, uls. Duration-based SVLR effect (median *who'd* − *hood* duration): gla 81ms, shl 32ms, uls 32ms → SVLR morphologically-conditioned lengthening is more robust/typical of Glasgow than of shl or uls. *(p.29)*
- ncl *hood* may lexically belong to GOOSE for many speakers rather than reflecting a true FOOT-GOOSE merger — authors suggest using a distinct keyword (e.g. BREWED) to separate morphologically-conditioned-long GOOSE members from the core set, per Foulkes & Docherty (1999:7) convention. *(p.29)*
- GOOSE fronting is widespread but not phonetically diagnostic of accent identity alone (between-accent variation is compensated by huge within-accent variability — cites Ferragne 2008:295-296). Conservative (back GOOSE) accents in this corpus: crn, eyk, ncl, nwa, shl (though roi not fully back), gla (variably). Three apparent chain-shift stages identified: (i) neither GOOSE nor FOOT fronted (eyk); (ii) only GOOSE fronted, not FOOT (lan, lvp); (iii) both GOOSE and FOOT fronted (sse, ean). *(p.29)*
- Labov's 3rd principle (back vowels front) broadly supported for FOOT/GOOSE in many accents (esp. sse, ean); push-chain mechanism argued unlikely (FLEECE doesn't move, and front unrounded+rounded close vowel pairs are cross-linguistically stable — 24/451 languages in UPSID have both). A drag-chain (FORCE/hoard rising as GOOSE fronts) is more plausible; ean/sse (fronted GOOSE/FOOT) do show closer *hoard* than eyk/nwa (back GOOSE/FOOT), consistent with drag-chain, but Hawkins & Midgley (2005) RP apparent-time data do NOT support this (F2 of *who'd* rose 994→1616 Hz youngest-to-oldest reversed [sic, oldest→youngest], but F1 of *hoard* stayed flat 391-392 Hz across age groups). *(p.29-30)*
- Rhoticity: lan sample is virtually non-rhotic (surprising given the Central Lancashire rhotic-area typology) — attributed to continuation of the RP-driven 18th-c loss of /r/, associated with prestige/BBC newsreader norms (Trudgill 1990:53) in England but NOT in Scotland (loss of /r/ in Glasgow is a working-class phenomenon — Stuart-Smith 2004:62-63). Derhoticization is gradient, not just present/absent (Stuart-Smith 2007); Scobbie (2007) ultrasound tongue imaging found a "derhoticized" speaker retained covert rhotic tongue gesture despite no acoustic/auditory /r/. *(p.30)*
- Post-/r/-loss monophthonging of centring diphthongs (per Wells 1982:213-222 on RP) is attested to varying degrees in the sample's non-rhotic accents: monophthongal *hared* occurs in ALL non-rhotic accents studied, and is usually more frequent than the diphthong variant — parallels historical RP development where CURE (Wells 1982:361) has already fully monophthongized. If this trajectory continues, duration may become an increasingly important phonological parameter in these accents (as with the *hood*/*who'd* duration-only distinctions already observed). *(p.30)*

### Methodological discussion
- Lobanov z-score normalization deliberately erases between-accent centroid/spread differences (voice quality, articulatory settings) that may be linguistically real — Fig 45 (p.31) plots per-accent mean+95% CI vowel-space centroids (mean of 11 monophthong F1/F2 Bark means per speaker, then accent-level mean/SD) and shows apparent between-accent centroid differences (e.g. shl has distinctly higher/fronter mean F1/F2 centroid than ncl) that z-scoring hides in all other figures — unclear if genuine or a sampling artifact. Suggested future fix: compute per-accent centroids and add them back onto z-scored per-speaker values. *(p.31)*
- Word-list limitations: the 19 /hVd/ words were designed to elicit SSE/RP phonemes and cannot test quasi-phonemic contrasts absent from SSE (e.g. dialect-specific TRAP-BATH-type splits), nor test known allophonic conditioning such as: north-of-England /eɪ/ vs /ɛɪ/ (⟨wait⟩ vs ⟨weight⟩, Beal 2004:123); Newcastle PRICE conditioned by following consonant ([ɛɪ] before voiceless stops/fricatives, [aɪ] elsewhere — Watt & Milroy 1999:28-29); Hull (eyk) PRICE diphthong/monophthong alternation conditioned by following-consonant voicing (Williams & Kerswill 1999:146); Scottish Vowel Length Rule conditioning (Scobbie et al. 1999); Southern Irish English ⟨pair⟩/⟨per⟩/⟨purr⟩ having 3, 2, or 1 phoneme depending on sub-accent (Wells 1982:421). *(p.31-32)*
- The *hured* (CURE) test-word specifically failed to reliably elicit the intended lexical set — attributed possibly to non-transparent spelling-to-pronunciation mapping (unlike e.g. *heered*, *hoid* which worked despite also being rare/non-words); CURE is independently known to be undergoing an "all-England" merger with NORTH-FORCE (Wells 2008:628 opinion-poll data: 74% prefer /pɔː/ over /pʊə/ for *poor*, correlated with speaker age). *(p.32)*

## 5 Conclusion (p.32)
Provides up-to-date acoustic description of vowels in 13 British Isles accents via z-scored Bark F1/F2 plots (monophthongs+diphthongs), supplemented by probability-density plots for closely-spaced vowel pairs, spectrograms illustrating within-dialect variation, and a summary Hz table (Table 3) for monophthongs. Two main limitations acknowledged: (1) lack of stratified sampling (age, social class) that could have reduced apparent individual variation by clustering into more homogeneous sub-accents (cf. Labov 2001); (2) automatic-formant-extraction method, while fully reproducible (unlike hand-corrected methods), necessitated substantial data rejection (26,408→22,331→6,624 usable tokens) and some residual erroneous values despite robust/smoothing techniques. Future work will target other automatically-extractable acoustic parameters. *(p.32)*

## Limitations
- Male-speakers-only design (typicality scores only available for males) — no female formant data reported. *(p.4)*
- crn and ncl have only 2 usable speakers each — explicit low-confidence caveat. *(p.6)*
- No demographic/sociolinguistic metadata on ABI speakers (age, class) available, precluding control for known confounds (Labov 1994; Foulkes & Docherty 1999; Hawkins & Midgley 2005). *(p.2)*
- Non-word/rare test-words (e.g. *hured*) may not reliably elicit intended lexical sets. *(p.32)*
- Duration systematically NOT reported (except spot examples) because monosyllabic list-reading inflates/distorts duration relative to natural speech. *(p.6)*
- Z-score (Lobanov) normalization erases potential real between-accent centroid/spread differences (voice quality, articulatory setting). *(p.31)*
- Word list built around SSE/RP phonology cannot test non-SSE contrasts, splits, or known allophonic/positional conditioning in other accents. *(p.31-32)*
- Automatic formant extraction, even after screening+regression smoothing, still contains "definitely erroneous" residual values. *(p.32)*

## Design Rationale
- Chose semi-automatic (Praat/Burg + visual-inspection screening) over fully manual formant correction specifically for full reproducibility across the whole corpus, accepting data loss as the cost. *(p.4-5)*
- Chose median/IQR over mean/SD as central-tendency/spread estimators throughout, because of large within-dialect variability — direct methodological response to the risk of misleading averages combining phonetically distinct variants. *(p.6, p.27)*
- Chose robust (weighted) linear regression for most monophthongs but cubic polynomial regression specifically for PRICE, to capture its characteristic S-shaped (not simply monotonic) formant trajectory — vowel/accent-specific regression choice rather than one-size-fits-all smoothing. *(p.5)*
- Chose NOT to plot centring diphthongs in the F1/F2 plane (unlike closing diphthongs) due to high within-dialect variability and the unreliability of the *hured* test-word; relied on prose + spectrograms instead. *(p.6)*
- Excluded Inner London (ilo) entirely rather than retain a substantially phonetically heterogeneous sample, on the basis of one expert phonetician's typicality/homogeneity rating. *(p.4)*
- Reported monophthong table (Table 3) in Hz rather than Bark or z-scores specifically to ease comparison with the wider (mostly Hz-based) literature. *(p.28)*

## Testable Properties (full set)
- sse: PRICE starting F2 is more back (lower F2 / less front) than MOUTH starting F2 — the "PRICE-MOUTH crossover", contra traditional RP transcription. *(p.7-8)*
- ean: STRUT (Hudd, median ~166ms) and NURSE (heard, median ~281ms) F1/F2 medians nearly coincide; duration is the primary reliable cue between them. *(p.14)*
- brm: FOOT-STRUT split status is bimodal across individual speakers within one nominally-non-splitting accent, not simply present/absent at the accent level. *(p.10, p.28)*
- gla: *who'd* vs *hood* spectrally near-identical; separated primarily by duration (SVLR), Δmedian duration ≈81ms. *(p.16, p.29)*
- shl: *who'd* vs *hood* have overlapping F1/duration but distinct (non-overlapping) F2 — separated spectrally, not (primarily) by duration; contrast with gla mechanism. *(p.24, p.26, p.29)*
- uls: Δmedian duration(who'd−hood) ≈32ms, same as shl, both less than gla's 81ms — SVLR-type lengthening is comparatively weak/inconsistent outside Glasgow. *(p.29)*
- eyk: Δmedian duration(hard−had) ≈106ms is the primary/sole cue separating an otherwise spectrally-close TRAP/START pair for some speakers. *(p.29)*
- nwa: 13/20 speakers separate *had*/*hard* by duration alone; 7/20 use duration + F1/F2 (front/back) distinction jointly. *(p.22)*
- lvp: *heard* and *hared* are acoustically merged (NURSE-SQUARE), confirmed by near-total overlap in F1/F2/duration probability densities (Fig 29). *(p.19-20)*
- shl: *hared*/*heard* homophonous in 14/20 speakers (NURSE-SQUARE merger in ~70% of sample, not universal). *(p.26-27)*
- Across all non-rhotic accents in the sample, monophthongal *hared* occurs and is typically MORE frequent than the diphthongal variant — general post-rhotic-loss monophthonging trend paralleling historical RP. *(p.30)*
- Between-accent vowel-space centroid/spread differences are visible in raw Bark means (Fig 45) even though the z-score-normalized F1/F2 plots (all other figures) are, by construction, centered/scaled to look similar across accents — any per-accent target-formant scheme built solely from the z-scored plots would omit this centroid information; Table 3's raw Hz values partially preserve it (subject to the caveat that male-vocal-tract-length differences are NOT normalized out of Table 3).

## Related Work Worth Reading
- Ferragne, E. (2008). PhD dissertation, University of Lyon — "more detailed [phonetic] analysis" of the same/related data, incl. auditory-only phenomena omitted here for brevity. *(p.2)*
- Ferragne & Pellegrino (2007) — automatic dialect identification using this same acoustic framework (speaker classification II).
- Hawkins & Midgley (2005) — RP monophthong formants across 4 age groups; directly relevant apparent-time comparison data (cited to test/refute a drag-chain hypothesis, p.30).
- Wells (1982) *Accents of English* — the baseline descriptive reference for nearly every accent-specific claim in this paper.
- Foulkes & Docherty (1999, eds.) *Urban Voices* — sociophonetic descriptions of several of the same UK urban accents (Newcastle, Liverpool, Glasgow, Dublin, etc.), used as cross-check/citation throughout.
- Schneider et al. (2004, eds.) *A Handbook of Varieties of English: Phonology* — source of several accent-specific phonology chapters (West Midlands/Clark, Scottish English/Stuart-Smith, Welsh English/Penhallurick, Irish English/Hickey) cited per-accent.
- D'Arcy et al. (2004) — original ABI corpus description paper.
- Scobbie, Hewlett & Turk (1999) — Scottish Vowel Length Rule, foundational for gla/shl/uls discussion.
- Labov (1994, 2001) *Principles of Linguistic Change* — chain-shift principles (used/tested against GOOSE/FOOT fronting) and stratified-sampling methodology suggestion for future work.


## Collection Cross-References

### Already in Collection
- (none - no papers directly cited by this paper are yet in the collection; Wells 1982 "Accents of English", Hawkins & Midgley 2005, and D'Arcy et al. 2004 ABI corpus paper are cited heavily but not found in `papers/index.md`)

### Cited By (in Collection)
- [King & Ferragne (2020) - Labial gesture in Anglo-English /r/](../King_2020_LabialGestureAngloEnglishR/notes.md) - co-authored by Ferragne; cites this paper for background acoustic-phonetic description of British Isles accent variation.

### New Leads (Not Yet in Collection)
- Hawkins & Midgley (2005). "Formant frequencies of RP monophthongs in four age-groups of speakers." *JIPA* 35(2), 183-199 - apparent-time RP formant data used in this paper's drag-chain discussion; would let us check GOOSE/FOOT fronting trends against age cohorts.
- Wells, John C. (1982). *Accents of English* (3 vols). Cambridge University Press - the standard descriptive reference underlying nearly every accent-specific claim in this paper; also the origin of the lexical-set naming convention (FLEECE, KIT, TRAP, etc.) used throughout.
- D'Arcy, Russell, Browning & Tomlinson (2004). "The accents of the British Isles (ABI) corpus." - primary source describing the corpus this paper's data is drawn from.
- Scobbie, Hewlett & Turk (1999). "Standard English in Edinburgh and Glasgow: The Scottish Vowel Length Rule revealed." - foundational SVLR paper needed for the gla/shl/uls duration discussion.

### Conceptual Links (not citation-based)
- [Acoustic characteristics of the vowel systems of six regional varieties of American English](../Clopper_2005_AcousticCharacteristicsVowelSystems/notes.md) - Strong. Both papers are large-scale, multi-accent/multi-dialect formant studies of English (13 British Isles accents here vs 6 American regions there), both use Lobanov z-score normalization as the primary between-group comparison method, both use hVd-type test words, and both independently document and caution about the same normalization artifact: this paper notes (p.31) that z-scoring erases real between-accent centroid/spread differences, while Clopper et al. document (p.8, p.14) that z-scoring can artifactually "back" already-fronted vowels for talkers with extreme shifts - convergent methodological warnings from two independent research groups about the same technique. Both papers also treat within-region heterogeneity as a first-class finding: this paper's brm FOOT-STRUT bimodal split parallels Clopper et al.'s Midland talkers showing individually-inconsistent NCCS/SVS features.
- [The Formants of Monophthong Vowels in Standard Southern British English Pronunciation](../Deterding_1997_FormantsMonophthongVowelsStandard/notes.md) - Strong. Deterding's Standard Southern British (SSB) connected-speech male formant means are directly comparable to this paper's `sse` (Standard Southern English) accent, the same target variety, for the same 11-vowel monophthong inventory. This paper's `sse` Table 3 values run systematically more open/higher-F1 than Deterding's connected-speech values for several vowels (e.g. TRAP F1 751 here vs 690 in Deterding), suggesting the ABI /hVd/ list-reading task (this paper) elicited somewhat more peripheral vowels than Deterding's natural BBC-broadcast connected speech - directly relevant to deciding how much to centralize per-accent vowel targets for continuous synthesized speech versus isolated-word citation forms.
- [Synthesis of Regional English Using a Keyword Lexicon](../Fitt_Isard_1999_SynthesisRegionalEnglishKeywordLexicon/notes.md) - Strong. Unisyn's accent-independent lexicon uses Wells-style lexical-set keysymbols (the same FLEECE/KIT/TRAP/etc. inventory this paper reports acoustic targets for) resolved per-accent by post-lexical rules; this paper supplies exactly the kind of per-accent acoustic realization data (median F1/F2 Hz, lexical-set mergers like FOOT-STRUT/NURSE-SQUARE/FOOT-GOOSE, diphthong trajectories) that would parameterize Unisyn-style per-accent resolution rules for Scottish, Irish, and English regional accents.
- [Kent & Vorperian 2018 - Static Measurements of Vowel Formant Frequencies and Bandwidths: A Review](../Kent_Vorperian_2018_VowelFormantBandwidths/notes.md) - Moderate. Both papers provide normative F1-F3 vowel formant tables intended as synthesis targets; Kent & Vorperian's review spans age/sex-based scaling of American English formants while this paper covers accent-based variation in British Isles English formants (male-only) - together they bound two of the major axes (age/sex vs. regional accent) a formant synthesizer's vowel target system needs to parameterize.
- [Investigating the Use of Formant Frequencies in Listener Judgments of Speaker Size](../Barreda_2015_FormantSpeakerSize/notes.md) - Moderate. Both papers work with Lobanov-style speaker vowel-space normalization/scaling; this paper's Discussion (p.31) explicitly notes that z-score normalization erases between-speaker/between-accent centroid and vocal-tract-length differences that Barreda's speaker-size work treats as a primary signal, a direct methodological tension worth flagging for anyone using Table 3's raw Hz values as synthesis targets without correcting for the source speakers' (male, mixed-accent) vocal tract lengths.
- [Rhythm in Read British English: Interdialect Variability](../Ferragne_Pellegrino_2004_RhythmReadBritishEnglish/notes.md) - Strong. Same first author (Ferragne) and same underlying corpus (Accents of the British Isles, ABI): the 2004 paper supplies the rhythmic/durational half of the per-accent profile (PVI and vowel-vs-consonant duration variability across the same set of British dialects) that this 2010 paper's spectral (F1/F2) formant targets leave out - together they give a duration+spectrum per-accent vowel profile drawn from the same speaker population.

