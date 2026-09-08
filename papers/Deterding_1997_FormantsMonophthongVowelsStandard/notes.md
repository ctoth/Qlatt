---
title: "The Formants of Monophthong Vowels in Standard Southern British English Pronunciation"
authors: "David Deterding"
year: 1997
venue: "Journal of the International Phonetic Association, 27(1-2), 47-55"
doi_url: "https://doi.org/10.1017/S0025100300005417"
---

# The Formants of Monophthong Vowels in Standard Southern British English Pronunciation

## One-Sentence Summary
Reports F1/F2/F3 formant measurements of the 11 monophthong vowels of Standard Southern British (SSB, ≈RP) English from connected (natural, continuous) speech of 5 male and 5 female BBC broadcasters in the MARSEC corpus, and shows these connected-speech vowels are significantly less peripheral (more centralized) than earlier citation-word measurements by the same author.

## Problem Addressed
Most standard formant reference values for English vowels (e.g. Gimson & Ramsaran 1989, Cruttenden 1994, and the author's own Deterding 1990) were derived from citation words (isolated /hVd/-type words spoken specially for measurement), which may not represent how vowels are actually realized in natural connected speech. Modern formant-tracking software and standard speech corpora now make it feasible to measure vowels directly from continuous, naturally-occurring speech instead.

## Key Contributions
- New F1/F2/F3 monophthong formant measurements for 11 SSB vowels from connected (broadcast) speech, from a public, replicable corpus (MARSEC), for 5 male + 5 female speakers.
- A direct, matched statistical comparison (same author, same measurement method) between connected-speech and citation-word formant values, showing connected speech is significantly more centralized for male speakers.
- Individual per-speaker average formant tables (Appendix, Tables A1/A2) allowing between-speaker variability inspection.
- Discussion of normalization approaches (F2-F1 for frontness, F1-F0 for openness) and why they remain imperfect/unresolved.

## Study Design
- **Type:** Descriptive acoustic-phonetic corpus study with a paired (matched-vowel) statistical comparison against prior citation-word data.
- **Population/Data:** MARSEC database (Roach, Knowles, Varadi & Arnfield, 1993) — BBC broadcast monologues (newsreading, commentary) from the 1980s, distributed on CD-ROM. 10 speakers analyzed: 5 male, 5 female, labeled A-K by their source directory's first letter (A=ASIG female religious-affairs broadcast, B=BSIG male newsreading, C=CSIG male economics lecture, D=DSIG female arts lecture on Dada, E=ESIG female prayers/Bible reading [breathy voice], F=FSIG female financial/share analysis [frequent creaky phonation], G=GSIG female story reading, H=HSIG male poetry reading [old-fashioned less-open /æ/ close to [ɛ]], J=JSIG male sports-meeting report, K=KSIG male discussion on employment [traces of Northern accent, fronted vowel instead of /ɑː/ in "pass"/"chance" — those tokens excluded from /ɑː/ measurement]). *(p.2, Table 1)*
- All speakers judged to have "Standard Southern British" accent, "RP or close to it" (Roach et al. 1993:48), with only minor individual voice-quality/accent variation noted above. *(p.2)*
- **Comparison data:** Deterding (1990) Ph.D. thesis (Cambridge University) — citation-word ([hVd] words e.g. heed, hid, head) measurements from 8 male + 8 female speakers, used as the "citation forms" baseline for comparison.

## Methodology
- Formant measurement software: CSL (Computerized Speech Lab) from Kay, running on a 486 PC. *(p.2)*
- Clear instances of each vowel identified first by listening, then digital spectrograms derived with overlaid linear-prediction-based formant tracks, pre-emphasis coefficient 0.9. *(p.2)*
- MARSEC audio digitized at 16 kHz; 16th-order linear prediction used uniformly for all data (per Ladefoged 1996:212 advice to try different analysis orders and pick the most interpretable) — acknowledged as sometimes insufficient (no clear F1 for some open-vowel tokens, e.g. /æ/, /ʌ/); an 18th-order filter (per Ladefoged's rule of thumb: 1 LPC coefficient per kHz of sample rate + 2) might have been more appropriate for those cases but a single consistent setting was kept across all measurements. *(p.2-3)*
- Vowel tokens after /j/, /w/, /r/ or before /l/ deliberately avoided where possible (strong coarticulatory effects on F1-F3), except when insufficient alternative tokens existed for some vowels (particularly /ʊ/ and /uː/). *(p.3)*
- ≈10 tokens of each of the 11 monophthongs measured per speaker (F1, F2, F3); minimum 5 tokens per vowel per speaker except /ʊ/ for speaker A (2 tokens) and speaker E (2 tokens). *(p.3-4)*
- Hz→Bark conversion via Zwicker & Terhardt (1980) formula (for Figures 1-2 plots and Tables 5-6). *(p.3)*
- Peripherality/centroid-distance analysis: per-vowel Euclidean distance (in Bark, F1×F2 plane) from the centroid (mean F1, mean F2 across the 11 vowels, excluding the central vowel /ɜː/ itself from the distance target but its own distance from centroid still reported); compared connected-speech vs. citation-form average distances via correlated-samples (paired) t-test. *(p.4, p.53-54)*

## Key Equations / Statistical Models

$$
Z = 13\arctan(0.00076F) + 3.5\arctan\left(\frac{F}{7500}\right)^2
$$
Where: Z = frequency in Bark, F = frequency in Hz (Zwicker & Terhardt 1980 auditory Bark-scale conversion, used for all Bark-scale figures/tables in this paper). *(p.3, p.50)*

Peripherality/centroid distance: for each vowel, Euclidean distance (in Bark) between that vowel's (F1, F2) point and the centroid, where centroid = (mean F1, mean F2) computed across all 11 vowels; the central vowel /ɜː/ is excluded when computing the centroid's own reference set but its distance value is still reported (in parentheses, since /ɜː/ is by definition central/near-centroid, not peripheral) *(p.53-54)*.

Paired-samples significance test: correlated-samples (paired) t-test comparing per-vowel average centroid-distance between connected speech and citation forms. Male: t=4.29, df=9, p<0.01 (significant — citation forms more peripheral). Female: t=0.77, df=9, p>0.05 (not significant). *(p.54)*

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|------|--------|-------|---------|-------|------|-------|
| LPC analysis order | — | coefficients | 16th-order | (18th-order suggested alternative) | p.2-3 | Kept constant for all data despite occasional insufficiency for open vowels |
| Pre-emphasis coefficient | — | — | 0.9 | — | p.2 | Used for all spectrogram/formant-track derivation |
| Sample rate | — | kHz | 16 | — | p.2 | MARSEC digitization rate |
| Tokens measured per vowel per speaker | — | count | ~10 | 2-10+ (min 5 except /ʊ/ for 2 speakers) | p.3-4 | Formants F1-F3 measured per token |
| Male connected-speech avg centroid distance | — | Bark | 2.04 | — | p.53 (Table 5) | Avg across 11 vowels (excl. /ɜː/ target row) |
| Male citation-form avg centroid distance | — | Bark | 2.57 | — | p.53 (Table 5) | Significantly larger than connected (t=4.29, df=9, p<0.01) |
| Female connected-speech avg centroid distance | — | Bark | 2.81 | — | p.53 (Table 6) | Not significantly different from citation (t=0.77, p>0.05) |
| Female citation-form avg centroid distance | — | Bark | 2.90 | — | p.53 (Table 6) | — |

## Effect Sizes / Key Quantitative Results

| Outcome | Measure | Value | CI | p | Population/Context | Page |
|---------|---------|-------|----|---|--------------------|------|
| Connected vs citation vowel peripherality (male) | paired t-test | t=4.29, df=9 | — | p<0.01 | 5 male MARSEC speakers vs. 8-male citation-form data (Deterding 1990) | p.54 |
| Connected vs citation vowel peripherality (female) | paired t-test | t=0.77, df=9 | — | p>0.05 (n.s.) | 5 female MARSEC speakers vs. 8-female citation-form data (Deterding 1990) | p.54 |

### Table 2 — Average F1, F2, F3 (Hz) by sex, connected speech, MARSEC (p.49, verbatim)

| Vowel | Male F1 | Male F2 | Male F3 | Female F1 | Female F2 | Female F3 |
|---|---|---|---|---|---|---|
| iː (FLEECE) | 280 | 2249 | 2765 | 303 | 2654 | 3203 |
| ɪ (KIT) | 367 | 1757 | 2556 | 384 | 2174 | 2962 |
| e (DRESS) | 494 | 1650 | 2547 | 719 | 2063 | 2997 |
| æ (TRAP) | 690 | 1550 | 2463 | 1018 | 1799 | 2869 |
| ʌ (STRUT) | 644 | 1259 | 2551 | 914 | 1459 | 2831 |
| ɑː (START/PALM) | 646 | 1155 | 2490 | 910 | 1316 | 2841 |
| ɒ (LOT) | 558 | 1047 | 2481 | 751 | 1215 | 2790 |
| ɔː (THOUGHT) | 415 | 828 | 2619 | 389 | 888 | 2796 |
| ʊ (FOOT) | 379 | 1173 | 2445 | 410 | 1340 | 2697 |
| uː (GOOSE) | 316 | 1191 | 2408 | 328 | 1437 | 2674 |
| ɜː (NURSE) | 478 | 1436 | 2488 | 606 | 1695 | 2839 |

This is the paper's headline result table — direct per-vowel, per-sex F1/F2/F3 in Hz, the single most reusable table for setting synthesizer vowel targets. Note the paper does NOT use Wells lexical-set labels itself; lexical-set correspondences added above for cross-reference (standard RP correspondences).

### Table 3 — Average MALE F1/F2 (Hz), connected speech (MARSEC) vs. citation forms (Deterding 1990) (p.52, verbatim)

| Vowel | Connected F1 | Connected F2 | Citation F1 | Citation F2 |
|---|---|---|---|---|
| iː | 280 | 2249 | 275 | 2221 |
| ɪ | 367 | 1757 | 382 | 1958 |
| e | 494 | 1650 | 560 | 1797 |
| æ | 690 | 1550 | 732 | 1527 |
| ʌ | 644 | 1259 | 695 | 1224 |
| ɑː | 646 | 1155 | 687 | 1077 |
| ɒ | 558 | 1047 | 593 | 866 |
| ɔː | 415 | 828 | 453 | 642 |
| ʊ | 379 | 1173 | 414 | 1051 |
| uː | 316 | 1191 | 302 | 1131 |
| ɜː | 478 | 1436 | 513 | 1377 |

### Table 4 — Average FEMALE F1/F2 (Hz), connected speech (MARSEC) vs. citation forms (Deterding 1990) (p.52, verbatim)

| Vowel | Connected F1 | Connected F2 | Citation F1 | Citation F2 |
|---|---|---|---|---|
| iː | 303 | 2654 | 319 | 2723 |
| ɪ | 384 | 2174 | 432 | 2296 |
| e | 719 | 2063 | 645 | 2287 |
| æ | 1018 | 1799 | 1011 | 1759 |
| ʌ | 914 | 1459 | 813 | 1422 |
| ɑː | 910 | 1316 | 779 | 1181 |
| ɒ | 751 | 1215 | 602 | 994 |
| ɔː | 389 | 888 | 431 | 799 |
| ʊ | 410 | 1340 | 414 | 1203 |
| uː | 328 | 1437 | 339 | 1396 |
| ɜː | 606 | 1695 | 650 | 1593 |

Note: only F1/F2 given for citation forms since F3 measurements were not available from the earlier (1990) data. *(p.52)*

### Table 5 — Average MALE F1/F2 in Bark + centroid distance, connected vs citation (p.53, verbatim)

| Vowel | Connected F1(Bark) | Connected F2(Bark) | Connected distance | Citation F1(Bark) | Citation F2(Bark) | Citation distance |
|---|---|---|---|---|---|---|
| iː | 2.73 | 13.85 | 3.83 | 2.68 | 13.77 | 4.19 |
| ɪ | 3.54 | 12.26 | 2.04 | 3.68 | 12.97 | 3.02 |
| e | 4.68 | 11.84 | 1.39 | 5.25 | 12.40 | 2.31 |
| æ | 6.31 | 11.42 | 2.03 | 6.63 | 11.32 | 2.20 |
| ʌ | 5.94 | 10.02 | 1.50 | 6.35 | 9.83 | 1.61 |
| ɑː | 5.96 | 9.45 | 1.77 | 6.28 | 8.99 | 1.90 |
| ɒ | 5.23 | 8.81 | 1.81 | 5.53 | 7.61 | 2.64 |
| ɔː | 3.98 | 7.34 | 3.16 | 4.32 | 5.93 | 4.24 |
| ʊ | 3.65 | 9.55 | 1.25 | 3.97 | 8.83 | 1.54 |
| uː | 3.07 | 9.65 | 1.66 | 2.94 | 9.31 | 2.01 |
| ɜː | 4.54 | 10.91 | (0.44) | 4.85 | 10.62 | (0.49) |
| **average** | 4.51 | 10.46 | 2.04 | 4.77 | 10.14 | 2.57 |

### Table 6 — Average FEMALE F1/F2 in Bark + centroid distance, connected vs citation (p.53, verbatim)

| Vowel | Connected F1(Bark) | Connected F2(Bark) | Connected distance | Citation F1(Bark) | Citation F2(Bark) | Citation distance |
|---|---|---|---|---|---|---|
| iː | 2.95 | 14.87 | 4.26 | 3.10 | 15.03 | 4.44 |
| ɪ | 3.70 | 13.64 | 2.82 | 4.14 | 13.98 | 3.03 |
| e | 6.53 | 13.30 | 2.06 | 5.95 | 13.96 | 2.81 |
| æ | 8.62 | 12.41 | 3.22 | 8.58 | 12.26 | 3.39 |
| ʌ | 7.94 | 11.01 | 2.45 | 7.24 | 10.84 | 1.91 |
| ɑː | 7.92 | 10.32 | 2.65 | 6.99 | 9.60 | 2.29 |
| ɒ | 6.78 | 9.78 | 2.11 | 5.60 | 8.47 | 2.75 |
| ɔː | 3.75 | 7.77 | 4.14 | 4.13 | 7.13 | 4.26 |
| ʊ | 3.94 | 10.44 | 1.92 | 3.97 | 9.72 | 2.04 |
| uː | 3.18 | 10.91 | 2.43 | 3.29 | 10.72 | 2.13 |
| ɜː | 5.63 | 12.02 | (0.53) | 5.99 | 11.60 | (0.74) |
| **average** | 5.54 | 11.50 | 2.81 | 5.36 | 11.21 | 2.90 |

### Table A1 — Average formant values (Hz) per individual MALE speaker (p.55, Appendix, verbatim)

| Vowel | B F1 | B F2 | B F3 | C F1 | C F2 | C F3 | H F1 | H F2 | H F3 | J F1 | J F2 | J F3 | K F1 | K F2 | K F3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| iː | 281 | 2016 | 2337 | 276 | 2218 | 3090 | 280 | 2600 | 3128 | 302 | 2008 | 2517 | 261 | 2402 | 2752 |
| ɪ | 335 | 1430 | 2198 | 396 | 1659 | 2592 | 367 | 1987 | 2887 | 395 | 1670 | 2450 | 344 | 2041 | 2653 |
| e | 490 | 1397 | 2127 | 509 | 1520 | 2590 | 444 | 1923 | 2902 | 512 | 1587 | 2544 | 515 | 1823 | 2573 |
| æ | 661 | 1328 | 2139 | 546 | 1542 | 2306 | 579 | 1769 | 2790 | 790 | 1558 | 2559 | 872 | 1555 | 2522 |
| ʌ | 635 | 1237 | 2186 | 537 | 1219 | 2383 | 687 | 1382 | 2833 | 704 | 1204 | 2553 | 659 | 1251 | 2798 |
| ɑː | 694 | 1202 | 2183 | 540 | 1108 | 2195 | 625 | 1165 | 2738 | 649 | 1117 | 2524 | 720 | 1185 | 2811 |
| ɒ | 611 | 1113 | 2111 | 482 | 1042 | 2200 | 609 | 1125 | 2753 | 558 | 1000 | 2574 | 530 | 956 | 2769 |
| ɔː | 419 | 906 | 2157 | 397 | 709 | 2627 | 448 | 925 | 2802 | 425 | 835 | 2657 | 388 | 764 | 2854 |
| ʊ | 370 | 1195 | 2055 | 378 | 1323 | 2332 | 391 | 1136 | 2642 | 387 | 1268 | 2391 | 368 | 945 | 2804 |
| uː | 321 | 1247 | 2149 | 298 | 1373 | 2234 | 327 | 1123 | 2659 | 343 | 1343 | 2404 | 291 | 870 | 2593 |
| ɜː | 472 | 1265 | 2183 | 507 | 1397 | 2482 | 523 | 1468 | 2748 | 462 | 1398 | 2523 | 425 | 1651 | 2506 |

Speaker letters correspond to: B=BSIG(male, newsreading), C=CSIG(male, economics lecture), H=HSIG(male, poetry reading — note-worthy old-fashioned less-open /æ/), J=JSIG(male, sports report), K=KSIG(male, employment discussion — some Northern-accent influence, /ɑː/ measurements exclude affected tokens). *(p.2, p.55)*

### Table A2 — Average formant values (Hz) per individual FEMALE speaker (p.55, Appendix, verbatim)

| Vowel | A F1 | A F2 | A F3 | D F1 | D F2 | D F3 | E F1 | E F2 | E F3 | F F1 | F F2 | F F3 | G F1 | G F2 | G F3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| iː | 304 | 2664 | 3248 | 284 | 2694 | 3315 | 300 | 2582 | 3234 | 321 | 2606 | 3161 | 306 | 2725 | 3055 |
| ɪ | 365 | 2157 | 2953 | 387 | 2215 | 2960 | 410 | 2070 | 3032 | 392 | 2147 | 2887 | 364 | 2279 | 2977 |
| e | 853 | 2054 | 3056 | 620 | 2157 | 2968 | 634 | 1926 | 2992 | 738 | 2065 | 2906 | 750 | 2114 | 3063 |
| æ | 1067 | 1690 | 2791 | 971 | 1892 | 2761 | 1045 | 1766 | 3121 | 972 | 1884 | 2744 | 1033 | 1761 | 2928 |
| ʌ | 1044 | 1495 | 2740 | 950 | 1512 | 2851 | 843 | 1464 | 2929 | 875 | 1489 | 2638 | 860 | 1335 | 2998 |
| ɑː | 1010 | 1304 | 2815 | 903 | 1305 | 2876 | 903 | 1393 | 2945 | 895 | 1327 | 2685 | 837 | 1250 | 2883 |
| ɒ | 761 | 1243 | 2661 | 765 | 1216 | 2791 | 680 | 1249 | 2869 | 823 | 1243 | 2651 | 727 | 1123 | 2980 |
| ɔː | 398 | 934 | 2669 | 373 | 849 | 2778 | 334 | 959 | 3027 | 427 | 876 | 2689 | 412 | 823 | 2817 |
| ʊ | 391 | 1798 | 2627 | 421 | 1361 | 2740 | 415 | 1234 | 2702 | 406 | 1199 | 2638 | 418 | 1109 | 2780 |
| uː | 333 | 1529 | 2657 | 319 | 1521 | 2627 | 328 | 1396 | 2746 | 343 | 1437 | 2683 | 316 | 1302 | 2657 |
| ɜː | 443 | 1762 | 2663 | 746 | 1627 | 2842 | 517 | 1676 | 2953 | 695 | 1705 | 2762 | 631 | 1704 | 2974 |

Speaker letters: A=ASIG(female, religious-affairs broadcast), D=DSIG(female, arts lecture on Dada), E=ESIG(female, prayers/Bible reading — very breathy voice), F=FSIG(female, financial/share analysis — frequent creaky phonation), G=GSIG(female, story reading). *(p.2, p.55)*

Individual raw token-level values were made available online at the time of publication (URL now defunct): `http://videoweb.nie.edu.sg/phonetic/data/jipa-vowels/index.htm` *(p.55)*

## Methods & Implementation Details
- Vowel tokens selected by ear first (clear instances), then measured from LPC-based formant tracks overlaid on digital spectrograms — semi-manual, not automatic; a human judgment call determines "clear" token selection and, implicitly, formant-track trustworthiness at each point. *(p.2)*
- A single fixed LPC order (16th) was deliberately used across ALL vowels/speakers for measurement consistency, even though the author acknowledges some open-vowel tokens (esp. /æ/, /ʌ/) would likely have benefited from a higher (18th) order per Ladefoged's (1996) rule of thumb. This is an explicit precision-vs-consistency tradeoff. *(p.2-3)*
- Coarticulation avoidance: vowels following /j/, /w/, /r/, or preceding /l/ were excluded from measurement wherever enough alternative tokens existed (exception: /ʊ/ and /uː/, which often required these contexts due to scarcity of other tokens). *(p.3)*
- Speaker K's /ɑː/ tokens: excluded a few instances where a Northern-accented fronted vowel appeared in "pass"/"chance" instead of the expected SSB /ɑː/. *(p.2)*

## Figures of Interest
- **Fig 1 (p.50):** F1(Bark) vs F2(Bark) plot, average MALE vowel values (connected speech), axes inverted (F2 decreasing left-to-right, F1 increasing top-to-bottom) to mimic articulatory vowel-quadrilateral orientation.
- **Fig 2 (p.51):** Same plot type for average FEMALE vowel values.

## Results Summary
Connected-speech (MARSEC, broadcast) monophthong vowel formants for SSB English were measured for 5 male + 5 female BBC speakers. Compared with the same author's earlier citation-word measurements (Deterding 1990), connected-speech vowels are on average closer to the vowel-space centroid (less peripheral / more centralized): average distance-from-centroid 2.04 Bark (connected) vs 2.57 Bark (citation) for males — a statistically significant difference (paired t=4.29, df=9, p<0.01) — but for females the analogous difference (2.81 vs 2.90 Bark) was NOT statistically significant (t=0.77, p>0.05). *(p.54)*

## Limitations
- Connected-speech and citation-form datasets come from entirely different speaker groups measured under different conditions (natural broadcast speech vs specially-elicited citation words) — the comparison in Tables 3-6 is not a true within-speaker paired design, just a matched-vowel comparison across different speaker samples, so caution is warranted in interpreting the significance test. *(p.54)*
- Single fixed LPC analysis order (16th) applied uniformly, acknowledged as sometimes inadequate especially for measuring F1 in open vowels (/æ/, /ʌ/); a higher order might have improved measurement in those cases at the cost of losing across-the-board consistency. *(p.2-3)*
- Small numbers of usable tokens for /ʊ/ in two speakers (2 tokens each, well below the ~10 target and even below the otherwise-enforced minimum of 5). *(p.3-4)*
- No demographic (age) information on speakers reported beyond a broad "Standard Southern British / RP or close to it" characterization; individual voice-quality idiosyncrasies (breathiness, creak, slightly non-standard vowel qualities) are noted but not statistically controlled. *(p.2)*
- Speaker-independent measures of vowel openness/frontness (F1-F0, F2-F1) remain unresolved/imperfect — the paper explicitly notes Ladefoged's (1967) finding that F1 does NOT shift with pitch as the F1-F0 normalization theory would require, undermining that normalization's validity. *(p.51)*

## Design Rationale
- Chose the MARSEC corpus specifically because it is a standard, publicly available database, so results are independently checkable/extendable by other researchers (in contrast to ad hoc private citation-word recordings). *(p.2)*
- Chose to report simple F1/F2 (Bark) plots rather than F2-F1 or F1-F0 normalized representations as the primary results, because the speaker-independence benefits of those alternative representations are not well established (F1-F0 in particular is contradicted by Ladefoged's 1967 finding that F1 does not shift with speaking pitch) — while still discussing them for context. *(p.50-51)*
- Chose to exclude vowel tokens adjacent to /j/, /w/, /r/, /l/ wherever possible specifically to minimize known strong coarticulatory effects on F1-F3, only relaxing this for /ʊ/ and /uː/ where token scarcity forced it. *(p.3)*
- Chose a single, fixed LPC order across the whole dataset over per-vowel/per-speaker-optimized orders, prioritizing methodological consistency and reproducibility over per-token measurement accuracy. *(p.2-3)*

## Testable Properties
- Male connected-speech vowels are significantly less peripheral (smaller average Bark-distance from vowel-space centroid) than male citation-word vowels: 2.04 vs 2.57 Bark (paired t=4.29, df=9, p<0.01). *(p.54)*
- Female connected-speech vowels show a similar but NOT statistically significant trend toward centralization: 2.81 vs 2.90 Bark (t=0.77, df=9, p>0.05). *(p.54)*
- Female formants are consistently higher in Hz than male formants for the same vowel across F1, F2, and F3 (visible throughout Table 2) — the ordinary sex-based vocal-tract-length scaling effect, not itself a novel finding but confirmed in this dataset.
- Some individual speakers deviate systematically from the sample norm in a phonetically describable way: speaker H's /æ/ is consistently less open ([ɛ]-like) than other male speakers' (compare Table A1 H column: æ F1=579 vs sample male average 690); speaker K shows a raised/fronted-influenced /ɑː/ pattern in excluded tokens (Northern-accent influence). *(p.2, Table A1)*

## Relevance to Project
This is a compact, directly-usable Hz-based per-sex formant target table (Table 2) for 11 SSB/RP monophthong vowels, drawn from natural connected speech rather than artificial citation words — arguably a more realistic synthesis target than most classic reference tables. Because it is matched against the SAME author's earlier citation-word data (Tables 3-6), it also quantifies exactly how much more "peripheral"/hyperarticulated citation-word-derived targets are relative to natural speech, which is directly useful for deciding whether a formant synthesizer's default (isolated-word) vowel targets should be pulled inward toward centroid for connected/running speech. The per-individual-speaker tables (A1/A2) additionally provide a small but real empirical sample of natural inter-speaker formant variability (including voice-quality-linked idiosyncrasies like speaker H's raised TRAP) useful for voice-preset diversity design.

## Open Questions
- [ ] The individual raw token-level data URL given in the paper (`videoweb.nie.edu.sg/phonetic/data/jipa-vowels/index.htm`) is from 1997/before and is very likely defunct; no attempt was made here to retrieve it.
- [ ] No F3 values exist for the citation-word (Deterding 1990) comparison data, limiting any full 3-formant comparison to the connected-speech side only.

## Related Work Worth Reading
- Deterding, D. (1990). *Speaker Normalization for Automatic Speech Recognition*. Ph.D. thesis, Cambridge University — source of the citation-word comparison data used throughout this paper; the original 8M/8F citation-word formant measurements.
- Roach, Knowles, Varadi & Arnfield (1993). "MARSEC: A machine-readable spoken English corpus." *JIPA* 23, 47-54 — describes the corpus this paper's data is drawn from, including the "RP or close to it" characterization of its speakers quoted here.
- Ladefoged & Maddieson (1990). "Vowels of the world's languages." *Journal of Phonetics* 18, 93-122 — source of the F2-F1 "backness" alternative representation discussed (but not adopted as primary) in this paper.
- Traunmüller, H. (1981). "Perceptual dimension of openness in vowels." *JASA* 69(5), 1465-1475 — source of the F1-F0 speaker-independent openness measure discussed and found wanting.

## Collection Cross-References

### Already in Collection
- (none - no papers directly cited by this paper, e.g. Roach et al. 1993 MARSEC, Deterding 1990 thesis, Ladefoged & Maddieson 1990, Traunmüller 1981, or Zwicker & Terhardt 1980, are yet in the collection)

### Cited By (in Collection)
- [Cross-Racial Studies of Human Vocal Tract Dimensions and Formant Structures](../Hao_2002_VocalTractDimensionsFormants/notes.md) - cites this paper as a formant-frequency reference alongside Peterson & Barney (1952) and Hillenbrand et al. (1995).

### New Leads (Not Yet in Collection)
- Deterding, D. (1990). *Speaker Normalization for Automatic Speech Recognition*. Ph.D. thesis, Cambridge University - the citation-word baseline data this paper compares against; would let us verify the Table 3-6 comparison numbers directly.
- Roach, P., Knowles, G., Varadi, T. & Arnfield, S. (1993). "MARSEC: A machine-readable spoken English corpus." *JIPA* 23, 47-54 - describes the corpus this paper's data is drawn from.
- Zwicker, E. & Terhardt, E. (1980). "Analytical expression for critical-band rate and critical bandwidth as a function of frequency." *JASA* 68(5), 1523-1525 - source of the Hz-to-Bark conversion formula used throughout this paper (and also used, via Traunmüller 1990, in the companion Ferragne & Pellegrino 2010 paper on British Isles accents, though the two papers use slightly different Bark formulas: Traunmüller 1990 vs Zwicker & Terhardt 1980).

### Conceptual Links (not citation-based)
- [Formant frequencies of vowels in 13 accents of the British Isles](../Ferragne_2010_FormantFrequenciesVowels13/notes.md) - Strong. Ferragne & Pellegrino's `sse` (Standard Southern English) accent is the same target variety as this paper's SSB, and both report male monophthong F1/F2 medians/means in Hz for a comparable 11-vowel monophthong inventory (this paper additionally reports F2 for female speakers and F3 for both sexes) - directly comparable numbers for cross-checking. Ferragne & Pellegrino's `sse` Table 3 values (F1/F2 in Hz: iː/heed 273/2289, ɪ/hid 386/2038, e/head 527/1801, æ/had 751/1558, ʌ/Hudd 623/1370, ɑː/hard 655/1044, ɒ/hod 552/986, ɔː/hoard 452/793, ʊ/hood 397/1550, uː/who'd 291/1672, ɜː/heard 527/1528) are systematically higher-F1/more-open than Deterding's male connected-speech values here (e.g. TRAP F1 690 vs 751, though GOOSE/FOOT are reversed in F2 direction due to different speaker-sample fronting) - both papers independently support the idea that natural/connected running speech yields somewhat more centralized vowel targets than careful citation-word elicitation, though the two studies used different corpora, decades, and speaker samples, so the discrepancy is only suggestive, not a controlled comparison. Both papers also use a Hz-to-Bark conversion for their z-scored/Bark plots, though from different source formulas (Zwicker & Terhardt 1980 here vs Traunmüller 1990 in Ferragne & Pellegrino), a minor methodological point worth noting if combining data from both papers into one target table.
- [Kent & Vorperian 2018 - Static Measurements of Vowel Formant Frequencies and Bandwidths: A Review](../Kent_Vorperian_2018_VowelFormantBandwidths/notes.md) - Moderate. Both papers provide normative multi-formant (F1-F3) vowel tables by sex intended as synthesis/reference targets; Kent & Vorperian's review spans American English across age/sex from 12 studies (1952-2009), while this paper is a single-study British-English (SSB/RP) connected-speech dataset - useful as a British-vs-American, connected-speech-vs-citation-word contrast pair for a formant synthesizer's regional/register vowel-target selection.
