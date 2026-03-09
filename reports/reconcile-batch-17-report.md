# Reconcile Batch 17 Report

## Papers Processed

1. `papers/King_2020_LabialGestureAngloEnglishR/` -- reviewed, no changes needed
2. `papers/Kirkham_2025_DynamicalLawsSpeechGestures/` -- added conceptual link
3. `papers/Klatt_1976_SegmentalDuration/` -- major update: added 11 "Already in Collection" + 11 "Cited By" entries
4. `papers/Klatt_1979_SpeechPerceptionLexicalAccess/` -- major update: added intra-batch refs + 6 "Cited By" entries
5. `papers/Klatt_1980_CascadeParallelFormantSynthesizer/` -- major update: added annotations + 27 "Cited By" entries
6. `papers/Klatt_1982_KlattalkTTS/` -- major update: added intra-batch refs + 7 "Cited By" entries
7. `papers/Klatt_1990_VoiceQualityVariations/` -- major update: added 29 "Cited By" entries, consolidated conceptual links
8. `papers/Kocon_2018_VowelDirectivityRunningSpeech/` -- reviewed, no changes needed (already comprehensive)
9. `papers/Koenig_LaryngealFactors/` -- updated: added 2 "Already in Collection" + 1 "Cited By" + 2 "Conceptual Links"
10. `papers/Kreiman_2007_GlottalSourceSpectrum/` -- reviewed, no changes needed (already comprehensive)

## Summary of Changes

### Papers Requiring No Changes (4)
- **King_2020**: Cross-references already adequate with 5 collection entries, no reverse citations found.
- **Kocon_2018**: Already has comprehensive forward/reverse/conceptual cross-references including bidirectional links with Monson_2012, Porschmann_2024, Hartenstein_2025, and Chalker_1985.
- **Kreiman_2007**: Already has 10 "Already in Collection" entries, 2 "Cited By" entries, 3 "New Leads", and conceptual links. Well-maintained.
- **Klatt_1990** (pre-update): Had good "Already in Collection" but was missing "Cited By" section entirely.

### Papers With Major Updates (5)
- **Klatt_1976**: Previously had only 1 "Already in Collection" entry (Stevens_1971). This is one of the most-cited papers in the collection (referenced by 20+ papers). Added 10 additional "Already in Collection" entries (intra-batch Klatt papers, Allen_1977, Allen_1987, Carlson papers, Crystal_House_1988, Blumstein_Stevens_1979) and 11 "Cited By" entries (Campbell_Isard_1991, vanSanten_1993/1994/1997, Hertz papers, etc.).
- **Klatt_1979**: Previously had 4 entries. Added intra-batch references to Klatt_1980 and Klatt_1982, plus 6 "Cited By" entries.
- **Klatt_1980**: Previously had 9 "Already in Collection" entries but no "Cited By" section. This is the single most-cited paper in the collection (35+ papers reference it). Added 27 "Cited By" entries spanning synthesizer reimplementations, extensions, and uses.
- **Klatt_1982**: Previously had 3 entries. Added Klatt_1976, Hunnicutt_1976 to "Already in Collection" and 7 "Cited By" entries.
- **Klatt_1990**: Previously had 18 "Already in Collection" entries but no "Cited By" section. Added 29 "Cited By" entries and consolidated the duplicate "Conceptual Links" sections into one.

### Papers With Minor Updates (2)
- **Kirkham_2025**: Added conceptual link to Iskarous_Pouplier_2022_ArticulatoryPhonologyAppraisal (articulatory phonology appraisal relevance to under-damping findings).
- **Koenig_LaryngealFactors**: Added Hanson_1997 and Lisker_Abramson_1964 to "Already in Collection", Simpson_2009 to "Cited By", and 2 conceptual links (Abramson_Whalen_2017, Hanson_1995).

## Bidirectional Verification

All major referencing papers were checked for reciprocal entries. The following bidirectional links were confirmed as already present:
- Saltzman_1989 <-> Kirkham_2025
- Monson_2012 <-> Kocon_2018
- Hartenstein_2025 <-> Kocon_2018
- Porschmann_2024 <-> Kocon_2018
- Chalker_1985 <-> Kocon_2018
- Holmberg_1988 <-> Koenig_LaryngealFactors
- Hanson_1997 <-> Kreiman_2007
- Zhang_2016 <-> Kreiman_2007
- Lisker_Abramson_1964 <-> Koenig_LaryngealFactors
- Simpson_2009 <-> Koenig_LaryngealFactors

## Key Observation

The Klatt papers (1976, 1979, 1980, 1982, 1990) are the backbone of this collection. Klatt_1980 alone is referenced by 35+ papers. Their cross-reference sections were significantly under-populated relative to their actual citation density in the collection. This batch corrects that gap.

## Commit
See git log for commit hash.
