# A Cross-Language Acoustic Study of Initial and Final Allophones of /l/

**Authors:** Daniel Recasens
**Year:** 2012
**Venue:** Speech Communication 54 (2012) 368-383
**DOI:** 10.1016/j.specom.2011.10.001

## One-Sentence Summary
Provides F1, F2, F3 formant frequency data for /l/ across 23 languages/dialects, quantifying clear vs dark /l/ distinctions and position-dependent allophonic variation for implementation in formant synthesis.

## Problem Addressed
Need for cross-linguistic acoustic data on /l/ formant frequencies to understand:
- Clear vs dark /l/ spectral characteristics
- Position-dependent allophonic variation (initial vs final)
- Vowel coarticulation effects on laterals

## Key Contributions
1. Comprehensive F2 frequency data for /l/ in 23 languages/dialects
2. Quantitative threshold for clear/dark /l/ distinction (~1300-1400 Hz in /i/ context)
3. Definition of "intrinsic" (<200-300 Hz difference) vs "extrinsic" (>400 Hz) positional allophones
4. Cross-linguistic vowel coarticulation data for laterals

## Methodology
- Acoustic recordings of /l/ in utterance-initial, utterance-final, and intervocalic positions
- Vowel contexts: /i/ and /a/
- Formant measurements (F1, F2, F3) at consonant midpoint
- 25 ms Hamming window, minimum 14 LPC coefficients
- Statistical analysis via one-way ANOVAs with Bonferroni corrections

## Key Findings

### Clear vs Dark /l/ F2 Frequencies

| /l/ Type | F2 in /ili/ context | F2 in /ala/ context |
|----------|---------------------|---------------------|
| Clear /l/ | 1714.83 Hz (sd=189.26) | 1221.9 Hz (sd=170.31) |
| Dark /l/ | 1103.73 Hz (sd=202.72) | 972.11 Hz (sd=99.70) |

**Splitting boundary:** ~1300-1400 Hz in /i/ context, ~1000 Hz in /a/ context

### F2 Frequency Ranges by /l/ Type

| Context | Clear /l/ Range | Dark /l/ Range |
|---------|-----------------|----------------|
| /i/ | 1359-2094 Hz | 892-1453 Hz |
| /a/ | 986-1593 Hz | 871-1084 Hz |

### Position-Dependent F2 (Initial vs Final)

| /l/ Type | /li/ (initial) | /il/ (final) | Difference |
|----------|----------------|--------------|------------|
| Clear /l/ | 1640.14 Hz | 1428.47 Hz | 211.67 Hz |
| Dark /l/ | 1067.61 Hz | 979.79 Hz | 87.82 Hz |

**Key insight:** Dark /l/ shows less position-dependent variation due to higher articulatory constraint.

### Intrinsic vs Extrinsic Allophones
- **Intrinsic allophones:** F2 difference <200-300 Hz (most languages)
- **Extrinsic allophones:** F2 difference >400 Hz
  - American English: 512 Hz
  - British English RP: 600 Hz
  - Czech: 497 Hz
  - Newcastle English: 448 Hz
  - Dutch: 979 Hz

## Parameters

| Parameter | Symbol | Units | Clear /l/ | Dark /l/ | Notes |
|-----------|--------|-------|-----------|----------|-------|
| F2 intervocalic /i/ | F2 | Hz | ~1715 | ~1104 | Primary darkness indicator |
| F2 intervocalic /a/ | F2 | Hz | ~1222 | ~972 | Less differentiation |
| F2 initial /i/ | F2 | Hz | ~1640 | ~1068 | Higher than final |
| F2 final /i/ | F2 | Hz | ~1428 | ~980 | Lower than initial |
| F1 intervocalic /i/ | F1 | Hz | 280.8 | 336.7 | Higher for dark /l/ |
| F1 intervocalic /a/ | F1 | Hz | 413.3 | 459.5 | Higher for dark /l/ |
| F3 intervocalic /a/ | F3 | Hz | 2521.7 | 2638.6 | Higher for dark /l/ |

## Language/Dialect Classification

### Clear /l/ Languages (F2 > ~1400 Hz in /ili/)
- Alguerese Catalan, British English RP, Czech, Danish, Dutch, Finnish, French, German, Hungarian, Italian, Newcastle English, Norwegian, Occitan, Romanian, Spanish, Swedish, Valencian Catalan

### Dark /l/ Languages (F2 < ~1200 Hz in /ili/)
- American English, Leeds British English, Majorcan Catalan, Portuguese, Russian

### Intermediate/Moderately Dark
- Eastern Catalan (~1453 Hz - highest of "dark" group, overlaps with clear)

### Intermediate/Moderately Clear
- Czech, Newcastle English, Finnish (lower F2 than typical clear /l/)

## Complete F2 Data Table (from Table 1)

| Language | /li/ | /ili/ | /il/ | /la/ | /ala/ | /al/ |
|----------|------|-------|------|------|-------|------|
| American English | 1272 | 892 | 760 | 992 | 895 | 858 |
| Alguerese Catalan | 1621 | 1599 | 1620 | 1431 | 1327 | 1491 |
| British English RP | 1600 | - | 1000 | 1120 | - | 860 |
| Czech | 1518 | 1425 | 1021 | 1139 | 992 | 968 |
| Danish | 1717 | 1786 | 1617 | 1591 | 1593 | 1531 |
| Dutch | 1800 | 1729 | 821 | 1181 | 1131 | 924 |
| Eastern Catalan | 1123 | 1453 | 1060 | 1025 | 1072 | 1024 |
| Finnish | 1539 | 1517 | 1409 | 985 | 986 | 995 |
| French | 1682 | 1830 | 1748 | 1525 | 1340 | 1512 |
| German | 1618 | 1734 | 1557 | 1363 | 1316 | 1498 |
| Hungarian | 1642 | 1700 | 1343 | 1126 | 1083 | 1202 |
| Italian | 1629 | 2094 | 1559 | 1394 | 1231 | 1391 |
| Leeds British English | 1012 | 1024 | 1024 | - | - | - |
| Majorcan Catalan | 989 | 1228 | 1016 | 929 | 1084 | 973 |
| Newcastle English | 1588 | 1359 | 1140 | - | - | - |
| Norwegian | 1724 | 1681 | 1604 | 1486 | 1128 | 1181 |
| Occitan | 1748 | 1886 | 1630 | 1413 | 1220 | 1487 |
| Portuguese | 1046 | 1003 | 1096 | 879 | 871 | 1116 |
| Romanian | 1580 | 1722 | 1461 | 1280 | 1136 | 1295 |
| Russian | 964 | 1023 | 922 | 972 | 938 | 887 |
| Spanish | 1800 | 1630 | 1960 | 1560 | 1500 | 1520 |
| Swedish | 1709 | 1765 | 1531 | 1383 | 1180 | 1189 |
| Valencian Catalan | 1368 | 1982 | 1264 | 1150 | 1165 | 1121 |

## Vowel Coarticulation

### F2 Distance (/ili/ - /ala/)
| /l/ Type | Mean Distance | Range |
|----------|---------------|-------|
| Clear /l/ | 516.6 Hz (sd=205.54) | 130-863 Hz |
| Dark /l/ | 147.6 Hz (sd=142.76) | 3-381 Hz |

**Key finding:** Clear /l/ shows much greater vowel coarticulation than dark /l/ due to lower articulatory constraint.

### Position Effect on Coarticulation
- Intervocalic > Initial > Final
- Less coarticulation in final position for both /l/ types

## Articulatory Correlates

### Clear /l/ Production
- Tongue body raising and fronting
- Single large cavity behind dentoalveolar constriction
- More laminal involvement
- More contact at sides of palate
- /i/-like tongue configuration

### Dark /l/ Production
- Tongue predorsum lowering
- Postdorsum retraction toward uvular/upper pharyngeal wall
- Cavity splits into oral and pharyngeal subcavities
- More apical articulation
- Greater inward lateral compression
- /u/-like tongue configuration
- May be more anterior (dentoalveolar vs alveolar)

## Implementation Notes

### For Klatt Synthesizer /l/ Targets

**American English (dark /l/):**
- Initial /li/: F2 ≈ 1272 Hz
- Final /il/: F2 ≈ 760 Hz
- Initial /la/: F2 ≈ 992 Hz
- Final /al/: F2 ≈ 858 Hz

**For "General American" synthesis:**
- Use lower F2 for final /l/ (darken by ~500 Hz from initial)
- F1 slightly higher for dark /l/ (~325-500 Hz depending on context)
- F3 relatively stable (~2400-2600 Hz)

### Position-Dependent /l/ Rules
1. Final /l/ should have lower F2 than initial /l/
2. For extrinsic allophone languages (American English), difference should be ~400-600 Hz
3. Vowel context affects F2: higher next to /i/, lower next to /a/

### Coarticulation Implementation
- Dark /l/ requires less vowel-dependent F2 adjustment
- Clear /l/ should show more formant interpolation toward adjacent vowels

## Figures of Interest
- **Fig. 1 (p. 369):** Vocal tract configurations for dark /l/, clear /l/, and vowels /i/, /a/
- **Fig. 2 (p. 374):** F2 frequency values for /ili/ and /ala/ by language/dialect
- **Fig. 3 (p. 375):** F2 for /li/, /il/, /la/, /al/ by language/dialect
- **Fig. 4 (p. 376):** F1 and F3 values by /l/ type and position
- **Fig. 6 (p. 378):** Position-dependent F2 patterns
- **Fig. 9 (p. 380):** F2 values for /i/ and /a/ at consonant midpoint by position

## Limitations
- Speaker age range 20-75 years (potential variability)
- Some languages from literature sources with incomplete data (British English RP, Leeds, Newcastle)
- American English data recorded in carrier phrase that may have affected measurements
- No temporal/durational data provided

## Relevance to Qlatt Project
1. **Direct F2 targets for /l/:** Use American English values for dark /l/ synthesis
2. **Position rules:** Implement final darkening (~500 Hz F2 drop)
3. **Coarticulation:** Dark /l/ needs less interpolation than other consonants
4. **F1/F3 guidelines:** F1 ~325-500 Hz, F3 ~2400-2600 Hz for /l/

## Open Questions
- [ ] How does /l/ duration interact with F2 frequency?
- [ ] Optimal F2 transition rates for /l/ in synthesis?
- [ ] Effect of speaking rate on /l/ darkness?

## Related Work Worth Reading
- Bladon & Al-Bamerni (1976) - Coarticulatory resistance in English /l/
- Sproat & Fujimura (1993) - Allophonic variation in English /l/
- Narayanan et al. (1997) - MRI/EPG articulatory-acoustic models for laterals
- Stevens (1998) - Acoustic Phonetics (general reference)
- Fant (1960) - Acoustic Theory of Speech Production
