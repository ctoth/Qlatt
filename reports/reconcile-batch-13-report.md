# Reconcile Batch 13 Report

## Papers Processed

1. `papers/Hanson_1995_GlottalCharacteristicsFemale/`
2. `papers/Hanson_1997_GlottalCharacteristicsFemaleAcoustic/`
3. `papers/Hanson_1999_GlottalMaleSpeakers/`
4. `papers/Hanson_2001_ModelsPhonation/`
5. `papers/Hanson_2002_HLsynSourceParameters/`
6. `papers/Hanson_2003_AspiratedStopsModels/`
7. `papers/Harrington_2011_HighBackVowelFronting/`
8. `papers/Haskins_StopRecognition/`
9. `papers/Hawkins_Stevens_1985_NasalVowelCorrelates/`
10. `papers/Hellbernd_2016_ProsodySpeechActIntention/`

## Status

All 10 papers already had `## Collection Cross-References` sections with "Already in Collection" entries. The main work was adding missing "Cited By" entries discovered through reverse citation search, and adding conceptual links.

## Changes Made

### Hanson_1995_GlottalCharacteristicsFemale
- **Added "Cited By" section** (14 entries): Iseli_2007, Doval_2003, Keating_2015, Starr_2015, Drugman_2020, Plumpe_1999, Sundberg_2005, Henrich_2005, Henrich_2001, Qharabagh_2025, Feugere_2017, Fant_1986, Kreiman_2007, Kreiman_2012

### Hanson_1997_GlottalCharacteristicsFemaleAcoustic
- **Extended "Cited By" section** (8 new entries): Goudbeek_2010, Chen_2022, Kreiman_2007, Kreiman_2012, Laukka_2011, Fant_1997, Koenig_LaryngealFactors, Starr_2015

### Hanson_1999_GlottalMaleSpeakers
- **Added "Cited By" section** (2 entries): Chen_2022, Zuta_2007

### Hanson_2001_ModelsPhonation
- **Replaced empty "Cited By" section** with 5 entries: Kreiman_2021, Zhang_2016, Lucero_2005, Iseli_2007, Henrich_2001

### Hanson_2002_HLsynSourceParameters
- **Extended "Cited By" section** (3 new entries): Zhang_2016, Iseli_2007, Titze_1992

### Hanson_2003_AspiratedStopsModels
- **Replaced empty "Cited By" section** with 1 entry: McGowan_Howe_2007

### Harrington_2011_HighBackVowelFronting
- **Added "Cited By" section** (3 entries): King_2020, Peterson_Barney_1952, Qharabagh_2025

### Haskins_StopRecognition
- **Added Lisker_Abramson_1964 to "Already in Collection"**
- **Added "Cited By" section** (3 entries): Cooper_1952, HoltLotto_2006, Lisker_Abramson_1964
- **Added "Conceptual Links" section** (3 entries): Blumstein_Stevens_1979 (Strong), Abramson_Whalen_2017 (Moderate), Hanson_2003 (Moderate)

### Hawkins_Stevens_1985_NasalVowelCorrelates
- **Extended "Cited By" section** (4 new entries): Stevens_1989, Stevens_1991_HL_Parameters, Feng_1996, Chen_1997

### Hellbernd_2016_ProsodySpeechActIntention
- **Extended "Cited By" section** (2 new entries): Jiang_2017, Breen_InPress
- **Extended "Conceptual Links" section** (1 new entry): Larrouy-Maestri_2024 (Strong)

### Bidirectional Update
- **House_Stevens_1956_NasalizationVowels**: Added Hawkins_Stevens_1985 to "Cited By" section

## Methodology

1. Read all 10 papers' `notes.md` files (all had existing cross-references)
2. Read `citations.md` files for forward reference checking
3. Ran reverse citation search using grep for all author names across the collection
4. Identified 39 missing "Cited By" entries and 4 new conceptual links
5. Added reciprocal entries where the citing paper already referenced the batch paper but no "Cited By" was recorded
6. Verified no duplicate entries before each write

## Commit

`42bcc09` — Reconcile batch 13: Hanson_1995 through Hellbernd
